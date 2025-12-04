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
            // We NO LONGER create the shipment here.
            // The client will collect all URLs and call the createShipment server action.
            return {
                uploadedBy: metadata.userId,
                url: file.url,
                success: true
            };
        })
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
