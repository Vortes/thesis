import { fetchMessengers } from '@/app/utils/fetch-messengers';
import { getPendingShipment } from '@/app/actions/open-shipment';
import { redirect } from 'next/navigation';
import { OpenGift } from '@/components/dashboard/open/OpenGift';

export default async function OpenPage({ params }: { params: Promise<{ charId: string }> }) {
    const { charId } = await params;
    const messengers = await fetchMessengers();
    const selectedChar = messengers.find(c => c.id === charId);

    if (!selectedChar) {
        redirect('/');
    }

    const result = await getPendingShipment(charId);

    if (!result.success || !result.shipment) {
        redirect(`/?charId=${charId}`);
    }

    return <OpenGift selectedChar={selectedChar} shipment={result.shipment} />;
}
