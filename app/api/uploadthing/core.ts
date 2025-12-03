import { createUploadthing, type FileRouter } from 'uploadthing/next';
import { UploadThingError } from 'uploadthing/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import type { GiftType } from '@prisma/client';

const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
    shipmentUploader: f(['image', 'audio', 'text'])
        .input(
            z.object({
                recipientId: z.string()
            })
        )
        .middleware(async ({ req, input }) => {
            const { userId } = await auth();

            if (!userId) throw new UploadThingError('User not authenticated');
            return { userId, recipientId: input.recipientId };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            try {
                const shipment = await prisma.shipment.create({
                    data: {
                        senderId: metadata.userId,
                        recipientId: metadata.recipientId,
                        status: 'DRAFTING',
                        items: {
                            create: [
                                {
                                    type: 'TEXT',
                                    content: file.url
                                }
                            ]
                        }
                    }
                });

                return {
                    uploadedBy: metadata.userId,
                    shipmentId: shipment.id,
                    success: true
                };
            } catch (error) {
                console.error('[textUploader] ❌ Error creating shipment:', error);
                // We can't really return an error to the client in the same way here,
                // but we can return success: false
                return {
                    uploadedBy: metadata.userId,
                    success: false,
                    error: 'Failed to create shipment'
                };
            }
        })
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
