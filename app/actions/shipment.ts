'use server';

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { GiftType } from '@prisma/client';

interface CreateShipmentItem {
    type: GiftType;
    content: string;
}

export async function createShipment(recipientId: string, items: CreateShipmentItem[]) {
    const { userId } = await auth();

    if (!userId) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        await prisma.$transaction(async tx => {
            await tx.shipment.create({
                data: {
                    senderId: userId,
                    recipientId,
                    status: 'IN_TRANSIT',
                    dispatchedAt: new Date(),
                    items: {
                        create: items.map(item => ({
                            type: item.type,
                            content: item.content
                        }))
                    }
                }
            });
        });

        return { success: true };
    } catch (error) {
        console.error('Failed to create shipment:', error);
        return { success: false, error: 'Failed to create shipment' };
    }
}
