import { fetchMessengers } from "@/app/utils/fetch-messengers";
import { fetchFriendRequests } from "@/app/utils/fetch-friend-requests";
import { Sidebar } from "./Sidebar";

export const SidebarLoader = async () => {
    const [haus, friendRequests] = await Promise.all([
        fetchMessengers(),
        fetchFriendRequests()
    ]);

    return (
        <Sidebar
            sortedChars={haus}
            incomingRequests={friendRequests.incoming}
            outgoingRequests={friendRequests.outgoing}
        />
    );
};
