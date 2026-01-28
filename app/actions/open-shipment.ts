'use server';

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { ShipmentStatus, MessengerStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';

export async function openShipment(shipmentId: string) {
    const { userId } = await auth();

    if (!userId) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        // Find the shipment
        const shipment = await prisma.shipment.findUnique({
            where: { id: shipmentId },
            include: {
                messenger: true
            }
        });

        if (!shipment) {
            return { success: false, error: 'Shipment not found' };
        }

        // Verify caller is the recipient
        if (shipment.recipientId !== userId) {
            return { success: false, error: 'Only the recipient can open a shipment' };
        }

        // Verify shipment has arrived
        if (shipment.status !== ShipmentStatus.ARRIVED) {
            return { success: false, error: 'Shipment has not arrived yet' };
        }

        // Update shipment status to opened
        // Messenger stays WAITING until recipient composes a reply
        await prisma.shipment.update({
            where: { id: shipmentId },
            data: {
                status: ShipmentStatus.OPENED
            }
        });

        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error('Failed to open shipment:', error);
        return { success: false, error: 'Failed to open shipment' };
    }
}

/**
 * Gets the pending shipment for a messenger that the current user needs to open.
 * Returns the shipment with its items if one exists and is ARRIVED or OPENED.
 */
export async function getPendingShipment(messengerId: string) {
    const { userId } = await auth();

    if (!userId) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        // Find the messenger with its current shipment
        const messenger = await prisma.messenger.findUnique({
            where: { id: messengerId },
            include: {
                currentShipment: {
                    include: {
                        items: true,
                        sender: {
                            select: {
                                id: true,
                                first_name: true,
                                last_name: true
                            }
                        }
                    }
                }
            }
        });

        if (!messenger) {
            return { success: false, error: 'Messenger not found' };
        }

        // Check if messenger is waiting with a shipment for this user
        if (messenger.status !== MessengerStatus.WAITING) {
            return { success: false, error: 'No pending shipment' };
        }

        if (!messenger.currentShipment) {
            return { success: false, error: 'No shipment to open' };
        }

        const shipment = messenger.currentShipment;

        // Verify the current user is the recipient
        if (shipment.recipientId !== userId) {
            return { success: false, error: 'You are not the recipient of this shipment' };
        }

        // Check shipment status
        if (shipment.status !== ShipmentStatus.ARRIVED && shipment.status !== ShipmentStatus.OPENED) {
            return { success: false, error: 'Shipment is not ready to be opened' };
        }

        return {
            success: true,
            shipment: {
                id: shipment.id,
                status: shipment.status,
                createdAt: shipment.createdAt,
                sender: shipment.sender,
                items: shipment.items.map(item => ({
                    id: item.id,
                    type: item.type,
                    content: item.content
                }))
            }
        };
    } catch (error) {
        console.error('Failed to get pending shipment:', error);
        return { success: false, error: 'Failed to get pending shipment' };
    }
}
