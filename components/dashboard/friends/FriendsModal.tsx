'use client';

import React, { useState } from 'react';
import { UserPlus, Inbox, Send } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FriendRequest } from '@/app/utils/fetch-friend-requests';
import { AddFriendForm } from './AddFriendForm';
import { FriendRequestList } from './FriendRequestList';
import { useRouter } from 'next/navigation';

interface FriendsModalProps {
    incomingRequests: FriendRequest[];
    outgoingRequests: FriendRequest[];
    trigger: React.ReactNode;
}

type Tab = 'add' | 'incoming' | 'outgoing';

export const FriendsModal: React.FC<FriendsModalProps> = ({ incomingRequests, outgoingRequests, trigger }) => {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>('add');

    const handleActionComplete = () => {
        router.refresh();
    };

    const tabs: { id: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
        { id: 'add', label: 'ADD', icon: <UserPlus className="w-3 h-3" /> },
        {
            id: 'incoming',
            label: 'INBOX',
            icon: <Inbox className="w-3 h-3" />,
            count: incomingRequests.length
        },
        {
            id: 'outgoing',
            label: 'SENT',
            icon: <Send className="w-3 h-3" />,
            count: outgoingRequests.length
        }
    ];

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent
                className="bg-[#c4a574] border-none p-0 pixel-border max-w-md gap-0 rounded-none"
                showCloseButton={false}
            >
                <DialogHeader className="bg-[#5e4c35] p-4">
                    <DialogTitle className="font-pixel text-sm text-[#e0d5c1] flex items-center gap-2">
                        <UserPlus className="w-4 h-4" />
                        FRIENDS
                    </DialogTitle>
                </DialogHeader>

                {/* Tab Bar */}
                <div className="flex border-b-2 border-[#8b7355] bg-[#a08560]">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 px-3 py-2 font-pixel text-[8px] flex items-center justify-center gap-1 transition-colors ${
                                activeTab === tab.id
                                    ? 'bg-[#c4a574] text-[#4a3b2a]'
                                    : 'text-[#e0d5c1] hover:bg-[#8b7355]'
                            }`}
                        >
                            {tab.icon}
                            {tab.label}
                            {tab.count !== undefined && tab.count > 0 && (
                                <span
                                    className={`ml-1 px-1.5 py-0.5 text-[6px] rounded-full ${
                                        activeTab === tab.id
                                            ? 'bg-[#4a3b2a] text-[#e0d5c1]'
                                            : 'bg-[#e0d5c1] text-[#4a3b2a]'
                                    }`}
                                >
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="p-4">
                    {activeTab === 'add' && (
                        <div>
                            <p className="font-handheld text-lg text-[#4a3b2a] mb-3">
                                Enter your friend&apos;s email to send a connection request.
                            </p>
                            <AddFriendForm onRequestSent={handleActionComplete} />
                        </div>
                    )}

                    {activeTab === 'incoming' && (
                        <div>
                            <FriendRequestList
                                requests={incomingRequests}
                                type="incoming"
                                onActionComplete={handleActionComplete}
                            />
                        </div>
                    )}

                    {activeTab === 'outgoing' && (
                        <div>
                            <FriendRequestList
                                requests={outgoingRequests}
                                type="outgoing"
                                onActionComplete={handleActionComplete}
                            />
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
