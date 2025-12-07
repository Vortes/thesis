'use server';

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { ShipmentStatus } from '@prisma/client';

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

        return { success: true };
    } catch (error) {
        console.error('Failed to open shipment:', error);
        return { success: false, error: 'Failed to open shipment' };
    }
}
