import { fetchMessengers } from "@/app/utils/fetch-messengers";
import { Sidebar } from "./Sidebar";

export const SidebarLoader = async () => {
    const haus = await fetchMessengers();
    
    return <Sidebar sortedChars={haus} />;
};
