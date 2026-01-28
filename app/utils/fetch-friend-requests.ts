import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export interface FriendRequest {
    id: string;
    type: 'incoming' | 'outgoing';
    createdAt: Date;
    user: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
}

export interface FriendRequestsResult {
    incoming: FriendRequest[];
    outgoing: FriendRequest[];
}

export async function fetchFriendRequests(): Promise<FriendRequestsResult> {
    const user = await currentUser();

    if (!user) {
        return { incoming: [], outgoing: [] };
    }

    const dbUser = await prisma.user.findUnique({
        where: { email: user.emailAddresses[0].emailAddress }
    });

    if (!dbUser) {
        return { incoming: [], outgoing: [] };
    }

    // Fetch pending connections where user is recipient (incoming)
    const incomingConnections = await prisma.connection.findMany({
        where: {
            recipientId: dbUser.id,
            status: 'PENDING'
        },
        include: {
            initiator: true
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    // Fetch pending connections where user is initiator (outgoing)
    const outgoingConnections = await prisma.connection.findMany({
        where: {
            initiatorId: dbUser.id,
            status: 'PENDING'
        },
        include: {
            recipient: true
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    const incoming: FriendRequest[] = incomingConnections.map(conn => ({
        id: conn.id,
        type: 'incoming',
        createdAt: conn.createdAt,
        user: {
            id: conn.initiator.id,
            firstName: conn.initiator.first_name,
            lastName: conn.initiator.last_name,
            email: conn.initiator.email
        }
    }));

    const outgoing: FriendRequest[] = outgoingConnections.map(conn => ({
        id: conn.id,
        type: 'outgoing',
        createdAt: conn.createdAt,
        user: {
            id: conn.recipient.id,
            firstName: conn.recipient.first_name,
            lastName: conn.recipient.last_name,
            email: conn.recipient.email
        }
    }));

    return { incoming, outgoing };
}
