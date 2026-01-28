'use client';

import React, { useState } from 'react';
import { Send, Mail, Loader2 } from 'lucide-react';
import { sendFriendRequest } from '@/app/actions/friend-request';

interface AddFriendFormProps {
    onRequestSent?: () => void;
}

export const AddFriendForm: React.FC<AddFriendFormProps> = ({ onRequestSent }) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showInvitePrompt, setShowInvitePrompt] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteLoading, setInviteLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;

        setLoading(true);
        setError(null);
        setSuccess(null);
        setShowInvitePrompt(false);

        const result = await sendFriendRequest(email.trim().toLowerCase());

        setLoading(false);

        if (result.success) {
            setSuccess('Friend request sent!');
            setEmail('');
            onRequestSent?.();
        } else if ('userNotFound' in result && result.userNotFound) {
            setInviteEmail(result.email);
            setShowInvitePrompt(true);
        } else if ('error' in result) {
            setError(result.error);
        }
    };

    const handleSendInvite = async () => {
        setInviteLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: inviteEmail })
            });

            if (res.ok) {
                setSuccess(`Invitation sent to ${inviteEmail}!`);
                setShowInvitePrompt(false);
                setEmail('');
            } else if (res.status === 409) {
                setError('An invitation has already been sent to this email');
                setShowInvitePrompt(false);
            } else {
                setError('Failed to send invitation');
            }
        } catch {
            setError('Failed to send invitation');
        }

        setInviteLoading(false);
    };

    return (
        <div className="space-y-3">
            <form onSubmit={handleSubmit} className="flex gap-2">
                <div className="flex-1 relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6d5a43]" />
                    <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="friend@email.com"
                        className="w-full pl-10 pr-3 py-2 bg-[#fdfbf7] border-2 border-[#6d5a43] font-handheld text-lg text-[#4a3b2a] placeholder:text-[#a08560] focus:outline-none focus:border-[#4a3b2a]"
                        disabled={loading}
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading || !email.trim()}
                    className="px-4 py-2 bg-[#4a3b2a] text-[#e0d5c1] font-pixel text-[8px] hover:bg-[#5e4c35] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 pixel-border-sm"
                >
                    {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <>
                            <Send className="w-3 h-3" />
                            SEND
                        </>
                    )}
                </button>
            </form>

            {error && (
                <div className="p-2 bg-red-100 border-2 border-red-400 text-red-700 font-handheld text-sm">{error}</div>
            )}

            {success && (
                <div className="p-2 bg-green-100 border-2 border-green-500 text-green-700 font-handheld text-sm">
                    {success}
                </div>
            )}

            {showInvitePrompt && (
                <div className="p-3 bg-[#f5f0e6] border-2 border-dashed border-[#a08560]">
                    <p className="font-handheld text-sm text-[#4a3b2a] mb-2">
                        <strong>{inviteEmail}</strong> is not on HauMail yet.
                    </p>
                    <p className="font-handheld text-sm text-[#6d5a43] mb-3">
                        Would you like to send them an invitation?
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={handleSendInvite}
                            disabled={inviteLoading}
                            className="flex-1 px-3 py-2 bg-[#4a3b2a] text-[#e0d5c1] font-pixel text-[8px] hover:bg-[#5e4c35] disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {inviteLoading ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                                <>
                                    <Mail className="w-3 h-3" />
                                    SEND INVITE
                                </>
                            )}
                        </button>
                        <button
                            onClick={() => setShowInvitePrompt(false)}
                            className="px-3 py-2 bg-[#a08560] text-[#e0d5c1] font-pixel text-[8px] hover:bg-[#8b7355]"
                        >
                            CANCEL
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
