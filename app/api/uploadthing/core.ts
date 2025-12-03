import { createUploadthing, type FileRouter } from 'uploadthing/next';
import { UploadThingError } from 'uploadthing/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import type { GiftType } from '@prisma/client';

const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
    // Define as many FileRoutes as you like, each with a unique routeSlug
    imageUploader: f({
        image: {
            /**
             * For connected users, max file size is 4MB
             */
            maxFileSize: '4MB',
            maxFileCount: 1
        }
    })
        // Set permissions and file types for this FileRoute
        .middleware(async ({ req }) => {
            // This code runs on your server before upload
            const { userId } = await auth();

            // If you throw, the user will not be able to upload
            if (!userId) throw new UploadThingError('Unauthorized');

            // Whatever is returned here is accessible in onUploadComplete as `metadata`
            return { userId };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            // This code RUNS ON YOUR SERVER after upload
            console.log('Upload complete for userId:', metadata.userId);

            console.log('file url', file.url);

            // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
            return { uploadedBy: metadata.userId };
        }),

    audioUploader: f({
        audio: {
            maxFileSize: '8MB',
            maxFileCount: 1
        }
    })
        .middleware(async ({ req }) => {
            const { userId } = await auth();
            if (!userId) throw new UploadThingError('Unauthorized');
            return { userId };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            console.log('Audio upload complete for userId:', metadata.userId);
            console.log('file url', file.url);
            return { uploadedBy: metadata.userId };
        }),

    textUploader: f({
        text: {
            maxFileSize: '1MB',
            maxFileCount: 1
        }
    })
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
