import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Character } from '@/lib/dashboard-data';
import { Messenger } from '@prisma/client';

export const fetchMessengers = async () => {
    const user = await currentUser();

    if (!user) {
        redirect('/sign-in');
    }
    console.log('fetching messengers');
    //simulate slow response
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('Currently refetching user again!');

    const dbUser = await prisma.user.findUnique({
        where: { email: user.emailAddresses[0].emailAddress },
        include: {
            onboarding: true
        }
    });

    if (!dbUser) {
        // Should handle this case better, maybe redirect to sign-in or show error
        console.error('User not found');
        return [];
    }
    // Check if user has any messengers available
    const connections = await prisma.connection.findMany({
        where: {
            OR: [{ initiatorId: dbUser.id }, { recipientId: dbUser.id }],
            messenger: {
                isNot: null
            }
        },
        include: {
            messenger: true
        }
    });

    const haus: Character[] = connections
        .filter((c): c is typeof c & { messenger: Messenger } => c.messenger !== null)
        .map(c => {
            const m = c.messenger;
            const friendId = c.initiatorId === dbUser.id ? c.recipientId : c.initiatorId;

            return {
                id: m.id,
                recipientId: friendId,
                name: m.name,
                status: m.isBusy ? 'En Route' : 'Ready',
                destination: 'Unknown',
                progress: 0,
                color: '#fca5a5',
                coords: { x: 50, y: 50 },
                history: []
            };
        });

    if (!haus) {
        console.log('No messengers found');
        return [] as Character[];
    }
    return haus;
};
