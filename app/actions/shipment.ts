'use server';

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { GiftType, MessengerStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';

interface CreateShipmentItem {
    type: GiftType;
    content: string;
}

// Haversine formula to calculate distance between two coordinates in km
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

export async function createShipment(recipientId: string, items: CreateShipmentItem[]) {
    const { userId } = await auth();

    if (!userId) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        // Find the connection and messenger between sender and recipient
        const connection = await prisma.connection.findFirst({
            where: {
                OR: [
                    { initiatorId: userId, recipientId: recipientId },
                    { initiatorId: recipientId, recipientId: userId }
                ]
            },
            include: {
                messenger: true,
                initiator: true,
                recipient: true
            }
        });

        if (!connection) {
            return { success: false, error: 'No connection found with this recipient' };
        }

        if (!connection.messenger) {
            return { success: false, error: 'No messenger assigned to this connection' };
        }

        const messenger = connection.messenger;

        // Verify current user is the one who can send (has the messenger)
        if (messenger.currentHolderId && messenger.currentHolderId !== userId) {
            return { success: false, error: 'Messenger is not at your location' };
        }

        // Verify messenger is in a sendable state:
        // - AVAILABLE: ready for new shipment
        // - WAITING: recipient is replying after opening a shipment
        const canSend =
            messenger.status === MessengerStatus.AVAILABLE ||
            (messenger.status === MessengerStatus.WAITING && messenger.currentHolderId === userId);

        if (!canSend) {
            return { success: false, error: `Messenger is currently ${messenger.status.toLowerCase()}` };
        }

        // Get sender and recipient coordinates
        const sender = connection.initiatorId === userId ? connection.initiator : connection.recipient;
        const recipient = connection.initiatorId === userId ? connection.recipient : connection.initiator;

        const originLat = sender.latitude;
        const originLng = sender.longitude;
        const destLat = recipient.latitude;
        const destLng = recipient.longitude;

        // Calculate distance if both have coordinates
        let distanceInKm: number | null = null;
        if (originLat && originLng && destLat && destLng) {
            distanceInKm = calculateDistance(originLat, originLng, destLat, destLng);
        }

        await prisma.$transaction(async tx => {
            // Create the shipment
            const shipment = await tx.shipment.create({
                data: {
                    senderId: userId,
                    recipientId,
                    status: 'IN_TRANSIT',
                    dispatchedAt: new Date(),
                    originLat,
                    originLng,
                    destLat,
                    destLng,
                    distanceInKm,
                    messengerId: messenger.id,
                    items: {
                        create: items.map(item => ({
                            type: item.type,
                            content: item.content
                        }))
                    }
                }
            });

            // Update messenger status and set current shipment
            await tx.messenger.update({
                where: { id: messenger.id },
                data: {
                    status: MessengerStatus.IN_TRANSIT,
                    currentShipmentId: shipment.id
                }
            });
        });

        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error('Failed to create shipment:', error);
        return { success: false, error: 'Failed to create shipment' };
    }
}
