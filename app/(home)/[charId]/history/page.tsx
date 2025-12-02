import { History } from '@/components/dashboard/history/History';
import { fetchMessengers } from '@/app/utils/fetch-messengers';
import { redirect } from 'next/navigation';

export default async function HistoryPage({ params }: { params: Promise<{ charId: string }> }) {
    const { charId } = await params;
    const messengers = await fetchMessengers();
    const selectedChar = messengers.find(c => c.id === charId);

    if (!selectedChar) {
        redirect('/map');
    }

    return <History selectedChar={selectedChar} />;
}
