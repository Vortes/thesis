'use server';

import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export type FriendRequestResult =
    | { success: true }
    | { success: false; error: string }
    | { success: false; userNotFound: true; email: string };

export async function sendFriendRequest(email: string): Promise<FriendRequestResult> {
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

    // Can't send to yourself
    if (email.toLowerCase() === dbUser.email.toLowerCase()) {
        return { success: false, error: 'You cannot send a friend request to yourself' };
    }

    // Find target user by email
    const targetUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
    });

    if (!targetUser) {
        return { success: false, userNotFound: true, email };
    }

    // Check for existing connection (in either direction)
    const existingConnection = await prisma.connection.findFirst({
        where: {
            OR: [
                { initiatorId: dbUser.id, recipientId: targetUser.id },
                { initiatorId: targetUser.id, recipientId: dbUser.id }
            ]
        }
    });

    if (existingConnection) {
        if (existingConnection.status === 'PENDING') {
            if (existingConnection.initiatorId === dbUser.id) {
                return { success: false, error: 'You already sent a friend request to this user' };
            } else {
                return { success: false, error: 'This user already sent you a friend request' };
            }
        }
        return { success: false, error: 'You are already connected with this user' };
    }

    // Create pending connection
    await prisma.connection.create({
        data: {
            initiatorId: dbUser.id,
            recipientId: targetUser.id,
            status: 'PENDING'
        }
    });

    revalidatePath('/');
    return { success: true };
}

export async function acceptFriendRequest(connectionId: string): Promise<FriendRequestResult> {
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

    const connection = await prisma.connection.findUnique({
        where: { id: connectionId }
    });

    if (!connection) {
        return { success: false, error: 'Friend request not found' };
    }

    // Only recipient can accept
    if (connection.recipientId !== dbUser.id) {
        return { success: false, error: 'You cannot accept this friend request' };
    }

    if (connection.status !== 'PENDING') {
        return { success: false, error: 'This friend request has already been processed' };
    }

    // Update connection to accepted and create messenger
    // Recipient (who accepts) holds the messenger first
    await prisma.connection.update({
        where: { id: connectionId },
        data: {
            status: 'ACCEPTED',
            messenger: {
                create: {
                    name: 'Messenger',
                    skinId: 'default_messenger',
                    currentHolderId: dbUser.id // Recipient holds first
                }
            }
        }
    });

    revalidatePath('/');
    return { success: true };
}

export async function declineFriendRequest(connectionId: string): Promise<FriendRequestResult> {
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

    const connection = await prisma.connection.findUnique({
        where: { id: connectionId }
    });

    if (!connection) {
        return { success: false, error: 'Friend request not found' };
    }

    // Only recipient can decline
    if (connection.recipientId !== dbUser.id) {
        return { success: false, error: 'You cannot decline this friend request' };
    }

    if (connection.status !== 'PENDING') {
        return { success: false, error: 'This friend request has already been processed' };
    }

    await prisma.connection.delete({
        where: { id: connectionId }
    });

    revalidatePath('/');
    return { success: true };
}

export async function cancelFriendRequest(connectionId: string): Promise<FriendRequestResult> {
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

    const connection = await prisma.connection.findUnique({
        where: { id: connectionId }
    });

    if (!connection) {
        return { success: false, error: 'Friend request not found' };
    }

    // Only initiator can cancel
    if (connection.initiatorId !== dbUser.id) {
        return { success: false, error: 'You cannot cancel this friend request' };
    }

    if (connection.status !== 'PENDING') {
        return { success: false, error: 'This friend request has already been processed' };
    }

    await prisma.connection.delete({
        where: { id: connectionId }
    });

    revalidatePath('/');
    return { success: true };
}
