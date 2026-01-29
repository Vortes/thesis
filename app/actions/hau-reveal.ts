'use server';

import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export type HauRevealResult =
    | { success: true }
    | { success: false; error: string };

export async function markHauRevealed(messengerId: string): Promise<HauRevealResult> {
    const user = await currentUser();
    if (!user) {
        return { success: false, error: 'Not authenticated' };
    }

    const dbUser = await prisma.user.findUnique({
        where: { email: user.emailAddresses[0].emailAddress }
    });

    if (!dbUser) {
        return { success: false, error: 'User not found in database' };
    }

    // Get the messenger with its connection
    const messenger = await prisma.messenger.findUnique({
        where: { id: messengerId },
        include: { connection: true }
    });

    if (!messenger) {
        return { success: false, error: 'Messenger not found' };
    }

    // Check if user is part of this connection
    const isInitiator = messenger.connection.initiatorId === dbUser.id;
    const isRecipient = messenger.connection.recipientId === dbUser.id;

    if (!isInitiator && !isRecipient) {
        return { success: false, error: 'You are not part of this connection' };
    }

    // Update the appropriate revealed field
    await prisma.messenger.update({
        where: { id: messengerId },
        data: isInitiator
            ? { revealedToInitiator: true }
            : { revealedToRecipient: true }
    });

    revalidatePath('/');
    return { success: true };
}
