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

    // Generate pseudo-random coordinates based on messenger ID for consistent positioning
    function getMessengerCoords(id: string): { lng: number; lat: number } {
        // Use hash of ID to generate deterministic but varied coordinates
        const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const lng = ((hash * 137) % 360) - 180; // Range: -180 to 180
        const lat = ((hash * 97) % 140) - 70; // Range: -70 to 70
        return { lng, lat };
    }

    function getDestinationCoords(id: string): { lng: number; lat: number } {
        // Offset from origin for destination
        const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const lng = ((hash * 173 + 90) % 360) - 180;
        const lat = ((hash * 113 + 45) % 140) - 70;
        return { lng, lat };
    }

    const haus: Character[] = connections
        .filter((c): c is typeof c & { messenger: Messenger } => c.messenger !== null)
        .map(c => {
            const m = c.messenger;
            const friendId = c.initiatorId === dbUser.id ? c.recipientId : c.initiatorId;
            const isBusy = m.isBusy;
            const coords = getMessengerCoords(m.id);
            const destCoords = isBusy ? getDestinationCoords(m.id) : undefined;

            return {
                id: m.id,
                recipientId: friendId,
                name: m.name,
                status: isBusy ? 'En Route' : 'Ready',
                destination: isBusy ? 'Destination' : 'Unknown',
                progress: isBusy ? Math.floor(Math.random() * 80) + 10 : 0, // 10-90% if en route
                color: '#fca5a5',
                skinId: m.skinId,
                coords,
                destCoords,
                history: []
            } as Character;
        });

    if (!haus) {
        console.log('No messengers found');
        return [] as Character[];
    }
    return haus;
};
