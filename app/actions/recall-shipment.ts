'use server';

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { MessengerStatus, ShipmentStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';

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

        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error('Failed to recall shipment:', error);
        return { success: false, error: 'Failed to recall shipment' };
    }
}

/**
 * Completes the return journey of a recalled shipment.
 * Called when the messenger arrives back at the sender's location.
 * This resets the messenger to AVAILABLE so the sender can send again.
 */
export async function completeReturn(shipmentId: string) {
    const { userId } = await auth();

    if (!userId) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        const shipment = await prisma.shipment.findUnique({
            where: { id: shipmentId },
            include: {
                messenger: true
            }
        });

        if (!shipment) {
            return { success: false, error: 'Shipment not found' };
        }

        // Verify caller is the original sender
        if (shipment.senderId !== userId) {
            return { success: false, error: 'Only the sender can complete a return' };
        }

        // Verify shipment was recalled
        if (shipment.status !== ShipmentStatus.RECALLED) {
            return { success: false, error: 'Shipment was not recalled' };
        }

        if (!shipment.messenger) {
            return { success: false, error: 'No messenger found for this shipment' };
        }

        // Verify messenger is actually returning
        if (shipment.messenger.status !== MessengerStatus.RETURNING) {
            // Idempotent: if already available, just return success
            if (shipment.messenger.status === MessengerStatus.AVAILABLE) {
                return { success: true, alreadyCompleted: true };
            }
            return { success: false, error: 'Messenger is not returning' };
        }

        await prisma.$transaction(async tx => {
            // Reset messenger to available, keeping it with the sender
            await tx.messenger.update({
                where: { id: shipment.messenger!.id },
                data: {
                    status: MessengerStatus.AVAILABLE,
                    currentShipmentId: null,
                    currentHolderId: userId
                }
            });
        });

        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error('Failed to complete return:', error);
        return { success: false, error: 'Failed to complete return' };
    }
}

/**
 * Syncs returned shipments that should have completed their return journey.
 * Similar to syncArrivedShipments but for recalled shipments returning to sender.
 */
export async function syncReturnedShipments(userId: string) {
    try {
        // Find all RECALLED shipments where user is the sender and messenger is RETURNING
        const returningShipments = await prisma.shipment.findMany({
            where: {
                status: ShipmentStatus.RECALLED,
                senderId: userId,
                messenger: {
                    status: MessengerStatus.RETURNING
                }
            },
            include: {
                messenger: true
            }
        });

        const completedReturnIds: string[] = [];

        for (const shipment of returningShipments) {
            if (!shipment.recalledAt || !shipment.distanceInKm || !shipment.messenger) continue;

            // Calculate return progress based on time since recall
            // Use same speed as forward journey (500 km/h)
            const SPEED_KM_PER_MS = 500 / 60 / 60 / 1000;

            // Return distance is proportional to how far the messenger had traveled
            // For simplicity, assume full round trip distance
            const travelTimeMs = shipment.distanceInKm / SPEED_KM_PER_MS;
            const returnArrivalTime = shipment.recalledAt.getTime() + travelTimeMs;
            const now = Date.now();

            if (now >= returnArrivalTime) {
                await prisma.$transaction(async tx => {
                    await tx.messenger.update({
                        where: { id: shipment.messenger!.id },
                        data: {
                            status: MessengerStatus.AVAILABLE,
                            currentShipmentId: null,
                            currentHolderId: shipment.senderId
                        }
                    });
                });

                completedReturnIds.push(shipment.id);
            }
        }

        if (completedReturnIds.length > 0) {
            revalidatePath('/');
        }

        return { success: true, completedReturnIds };
    } catch (error) {
        console.error('Failed to sync returned shipments:', error);
        return { success: false, error: 'Failed to sync returned shipments', completedReturnIds: [] };
    }
}
