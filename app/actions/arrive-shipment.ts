'use server';

import { prisma } from '@/lib/prisma';
import { ShipmentStatus, MessengerStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';

/**
 * Marks a shipment as ARRIVED when the messenger reaches its destination.
 * This updates both the shipment status and the messenger status, and transfers
 * the messenger to the recipient so they can create a return gift.
 *
 * This should be called when:
 * - The client detects 100% progress on a shipment
 * - Or on page load/refresh to sync state if arrival time has passed
 */
export async function arriveShipment(shipmentId: string) {
    try {
        // Find the shipment with its messenger
        const shipment = await prisma.shipment.findUnique({
            where: { id: shipmentId },
            include: {
                messenger: true
            }
        });

        if (!shipment) {
            return { success: false, error: 'Shipment not found' };
        }

        // Only allow arriving shipments that are currently IN_TRANSIT
        if (shipment.status !== ShipmentStatus.IN_TRANSIT) {
            // If already arrived or opened, just return success (idempotent)
            if (shipment.status === ShipmentStatus.ARRIVED || shipment.status === ShipmentStatus.OPENED) {
                return { success: true, alreadyArrived: true };
            }
            return { success: false, error: `Cannot arrive shipment with status: ${shipment.status}` };
        }

        if (!shipment.messenger) {
            return { success: false, error: 'No messenger associated with this shipment' };
        }

        // Update both shipment and messenger in a transaction
        await prisma.$transaction(async tx => {
            // Update shipment status to ARRIVED
            await tx.shipment.update({
                where: { id: shipmentId },
                data: {
                    status: ShipmentStatus.ARRIVED
                }
            });

            // Update messenger status to WAITING and transfer to recipient
            await tx.messenger.update({
                where: { id: shipment.messenger!.id },
                data: {
                    status: MessengerStatus.WAITING,
                    currentHolderId: shipment.recipientId
                }
            });
        });

        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error('Failed to arrive shipment:', error);
        return { success: false, error: 'Failed to arrive shipment' };
    }
}

/**
 * Checks if any IN_TRANSIT shipments have actually arrived (based on time)
 * and updates their status accordingly. This is useful for syncing state
 * when a user refreshes their browser.
 *
 * Returns the IDs of shipments that were updated to ARRIVED.
 */
export async function syncArrivedShipments(userId: string) {
    try {
        // Find all IN_TRANSIT shipments for this user (as sender or recipient)
        const inTransitShipments = await prisma.shipment.findMany({
            where: {
                status: ShipmentStatus.IN_TRANSIT,
                OR: [{ senderId: userId }, { recipientId: userId }]
            },
            include: {
                messenger: true
            }
        });

        const arrivedShipmentIds: string[] = [];

        for (const shipment of inTransitShipments) {
            // Calculate if the shipment should have arrived based on time
            if (!shipment.dispatchedAt || !shipment.distanceInKm) continue;

            // Use same speed calculation as frontend (500 km/h = 8.33 km/min)
            const SPEED_KM_PER_MS = 500 / 60 / 60 / 1000; // ~0.000139 km/ms
            const travelTimeMs = shipment.distanceInKm / SPEED_KM_PER_MS;
            const arrivalTime = shipment.dispatchedAt.getTime() + travelTimeMs;
            const now = Date.now();

            if (now >= arrivalTime && shipment.messenger) {
                // This shipment should have arrived, update it
                await prisma.$transaction(async tx => {
                    await tx.shipment.update({
                        where: { id: shipment.id },
                        data: {
                            status: ShipmentStatus.ARRIVED
                        }
                    });

                    await tx.messenger.update({
                        where: { id: shipment.messenger!.id },
                        data: {
                            status: MessengerStatus.WAITING,
                            currentHolderId: shipment.recipientId
                        }
                    });
                });

                arrivedShipmentIds.push(shipment.id);
            }
        }

        if (arrivedShipmentIds.length > 0) {
            revalidatePath('/');
        }

        return { success: true, arrivedShipmentIds };
    } catch (error) {
        console.error('Failed to sync arrived shipments:', error);
        return { success: false, error: 'Failed to sync arrived shipments', arrivedShipmentIds: [] };
    }
}
