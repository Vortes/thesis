import { Compose } from '@/components/dashboard/compose/Compose';
import { fetchMessengers } from '@/app/utils/fetch-messengers';
import { redirect } from 'next/navigation';

export default async function ComposePage({ params }: { params: Promise<{ charId: string }> }) {
    const { charId } = await params;
    const messengers = await fetchMessengers();
    const selectedChar = messengers.find(c => c.id === charId);

    if (!selectedChar) {
        redirect('/');
    }

    return <Compose selectedChar={selectedChar} />;
}
