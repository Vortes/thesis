'use server';

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { MessengerStatus, ShipmentStatus } from '@prisma/client';

export async function recallShipment(shipmentId: string) {
    const { userId } = await auth();

    if (!userId) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        // Find the shipment with messenger
        const shipment = await prisma.shipment.findUnique({
            where: { id: shipmentId },
            include: {
                messenger: true
            }
        });

        if (!shipment) {
            return { success: false, error: 'Shipment not found' };
        }

        // Verify caller is the sender
        if (shipment.senderId !== userId) {
            return { success: false, error: 'Only the sender can recall a shipment' };
        }

        // Verify shipment is in transit
        if (shipment.status !== ShipmentStatus.IN_TRANSIT) {
            return { success: false, error: 'Can only recall shipments that are in transit' };
        }

        if (!shipment.messenger) {
            return { success: false, error: 'No messenger found for this shipment' };
        }

        await prisma.$transaction(async tx => {
            // Update shipment status and set recall time
            await tx.shipment.update({
                where: { id: shipmentId },
                data: {
                    status: ShipmentStatus.RECALLED,
                    recalledAt: new Date()
                }
            });

            // Update messenger status to returning
            await tx.messenger.update({
                where: { id: shipment.messenger!.id },
                data: {
                    status: MessengerStatus.RETURNING
                }
            });
        });

        return { success: true };
    } catch (error) {
        console.error('Failed to recall shipment:', error);
        return { success: false, error: 'Failed to recall shipment' };
    }
}
