import { Map } from '@/components/dashboard/map/Map';
import { fetchMessengers } from '@/app/utils/fetch-messengers';

export default async function Home({
    searchParams
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const { charId } = await searchParams;
    const messengers = await fetchMessengers();
    const selectedChar = messengers.find(c => c.id === charId) || null;

    return <Map selectedChar={selectedChar} characters={messengers} />;
}
