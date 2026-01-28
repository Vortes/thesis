'use client';

import React, { useState } from 'react';
import { Check, X, Loader2, UserCircle } from 'lucide-react';
import { FriendRequest } from '@/app/utils/fetch-friend-requests';
import { acceptFriendRequest, declineFriendRequest, cancelFriendRequest } from '@/app/actions/friend-request';

interface FriendRequestListProps {
    requests: FriendRequest[];
    type: 'incoming' | 'outgoing';
    onActionComplete?: () => void;
}

export const FriendRequestList: React.FC<FriendRequestListProps> = ({ requests, type, onActionComplete }) => {
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleAccept = async (connectionId: string) => {
        setLoadingId(connectionId);
        setError(null);

        const result = await acceptFriendRequest(connectionId);

        setLoadingId(null);

        if (result.success) {
            onActionComplete?.();
        } else if ('error' in result) {
            setError(result.error);
        }
    };

    const handleDecline = async (connectionId: string) => {
        setLoadingId(connectionId);
        setError(null);

        const result = await declineFriendRequest(connectionId);

        setLoadingId(null);

        if (result.success) {
            onActionComplete?.();
        } else if ('error' in result) {
            setError(result.error);
        }
    };

    const handleCancel = async (connectionId: string) => {
        setLoadingId(connectionId);
        setError(null);

        const result = await cancelFriendRequest(connectionId);

        setLoadingId(null);

        if (result.success) {
            onActionComplete?.();
        } else if ('error' in result) {
            setError(result.error);
        }
    };

    if (requests.length === 0) {
        return (
            <div className="text-center py-4 text-[#6d5a43] font-handheld">
                {type === 'incoming' ? 'No incoming requests' : 'No outgoing requests'}
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {error && (
                <div className="p-2 bg-red-100 border-2 border-red-400 text-red-700 font-handheld text-sm mb-2">
                    {error}
                </div>
            )}

            {requests.map(request => (
                <div
                    key={request.id}
                    className="flex items-center justify-between p-2 bg-[#fdfbf7] border-2 border-[#6d5a43]"
                >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                        <UserCircle className="w-8 h-8 text-[#6d5a43] flex-shrink-0" />
                        <div className="min-w-0">
                            <div className="font-handheld text-base text-[#4a3b2a] truncate">
                                {request.user.firstName} {request.user.lastName}
                            </div>
                            <div className="font-handheld text-xs text-[#6d5a43] truncate">{request.user.email}</div>
                        </div>
                    </div>

                    <div className="flex gap-1 flex-shrink-0 ml-2">
                        {type === 'incoming' ? (
                            <>
                                <button
                                    onClick={() => handleAccept(request.id)}
                                    disabled={loadingId === request.id}
                                    className="p-2 bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                                    title="Accept"
                                >
                                    {loadingId === request.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Check className="w-4 h-4" />
                                    )}
                                </button>
                                <button
                                    onClick={() => handleDecline(request.id)}
                                    disabled={loadingId === request.id}
                                    className="p-2 bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                                    title="Decline"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => handleCancel(request.id)}
                                disabled={loadingId === request.id}
                                className="px-3 py-2 bg-[#6d5a43] text-[#e0d5c1] font-pixel text-[8px] hover:bg-[#4a3b2a] disabled:opacity-50"
                            >
                                {loadingId === request.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'CANCEL'}
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};
