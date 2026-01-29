import { History } from '@/components/dashboard/history/History';
import { fetchMessengers } from '@/app/utils/fetch-messengers';
import { redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { ShipmentStatus } from '@prisma/client';

export default async function HistoryPage({ params }: { params: Promise<{ charId: string }> }) {
    const { charId } = await params;
    const user = await currentUser();

    if (!user) {
        redirect('/sign-in');
    }

    // Get database user ID
    const dbUser = await prisma.user.findUnique({
        where: { email: user.emailAddresses[0].emailAddress }
    });

    if (!dbUser) {
        redirect('/sign-in');
    }

    const messengers = await fetchMessengers();
    const selectedChar = messengers.find(c => c.id === charId);

    if (!selectedChar) {
        redirect('/map');
    }

    // Fetch history (delivered shipments exchanged with this contact)
    const shipments = await prisma.shipment.findMany({
        where: {
            OR: [
                { senderId: dbUser.id, recipientId: selectedChar.recipientId },
                { senderId: selectedChar.recipientId, recipientId: dbUser.id }
            ],
            status: {
                in: [ShipmentStatus.ARRIVED, ShipmentStatus.IN_TRANSIT, ShipmentStatus.OPENED]
            }
        },
        include: {
            items: true
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    return <History selectedChar={selectedChar} shipments={shipments} currentUserId={dbUser.id} />;
}
