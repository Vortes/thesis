'use client';

import { useState, useEffect, useCallback } from 'react';
import { Character, TOOLS } from '@/lib/dashboard-data';
import { VoiceRecorder } from './VoiceRecorder';
import { DrawingPad } from './DrawingPad';
import { useRouter } from 'next/navigation';
import { ComposeHeader } from './ComposeHeader';
import { LetterArea } from './LetterArea';
import { Toolkit } from './Toolkit';
import { SendingView } from './SendingView';
import { SentView } from './SentView';
import { useUploadThing } from '@/lib/uploadthing';
import { saveDraft, getDraft, saveAttachment, getAttachments, clearDrafts, deleteAttachment } from '@/lib/db';
import { createShipment } from '@/app/actions/shipment';
import { GiftType } from '@prisma/client';
import { Mic } from 'lucide-react';

interface ComposeProps {
    selectedChar: Character;
}

export const Compose = ({ selectedChar }: ComposeProps) => {
    const router = useRouter();
    // State moved from Dashboard
    const [composeMessage, setComposeMessage] = useState('');
    const [attachedItems, setAttachedItems] = useState<any[]>([]);
    const [isSealed, setIsSealed] = useState(false);
    const [activeTool, setActiveTool] = useState<string | null>(null);

    const [view, setView] = useState<'compose' | 'sending' | 'sent'>('compose');

    // Load drafts on character change
    useEffect(() => {
        const loadDrafts = async () => {
            if (!selectedChar?.id) return;

            const draft = await getDraft(String(selectedChar.id));
            if (draft) setComposeMessage(draft.text);
            else setComposeMessage('');

            const attachments = await getAttachments(String(selectedChar.id));
            if (attachments) {
                // Reconstruct icons since IDB doesn't store React elements
                const hydrated = attachments.map((item: any) => ({
                    ...item,
                    icon: item.type === 'voice' ? <Mic size={16} /> : item.icon // Add other types as needed
                }));
                setAttachedItems(hydrated);
            } else {
                setAttachedItems([]);
            }
        };
        loadDrafts();
    }, [selectedChar.id]);

    // Auto-save text draft
    useEffect(() => {
        const timer = setTimeout(() => {
            if (selectedChar?.id) {
                saveDraft(String(selectedChar.id), composeMessage);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [composeMessage, selectedChar.id]);

    // Handle the sending flow
    useEffect(() => {
        if (isSealed && view === 'compose') {
            // Start the visual transition
            const timer1 = setTimeout(() => {
                setView('sending');
            }, 1500);
            return () => clearTimeout(timer1);
        }
    }, [isSealed, view]);

    const { startUpload } = useUploadThing('shipmentUploader');

    const handleComposeSend = async () => {
        setIsSealed(true);

        try {
            const filesToUpload: File[] = [];
            const shipmentItems: { type: GiftType; content: string }[] = [];

            // 1. Prepare Text
            if (composeMessage.trim()) {
                const textFile = new File([composeMessage], 'message.txt', { type: 'text/plain' });
                filesToUpload.push(textFile);
                // We'll map this back by index or type, but for now let's assume order is preserved
                // Actually, better to wait for upload results.
            }

            // 2. Prepare Attachments (Voice, etc)
            // We need to fetch the blobs from IDB if they aren't in memory (though VoiceRecorder passes them up)
            // For now, let's assume attachedItems contains the blob if it's a new recording.
            // If it was loaded from IDB, we might need to fetch it again if we didn't keep the blob in state.
            // Let's rely on `attachedItems` having the blob for now.

            for (const item of attachedItems) {
                if (item.type === 'voice' && item.blob) {
                    const file = new File([item.blob], `voice-${item.id}.webm`, { type: 'audio/webm' });
                    filesToUpload.push(file);
                }
                // Add other types here
            }

            // 3. Upload All Files
            let uploadedUrls: string[] = [];
            if (filesToUpload.length > 0) {
                const uploadRes = await startUpload(filesToUpload, { recipientId: selectedChar.recipientId });
                if (!uploadRes) throw new Error('Upload failed');
                uploadedUrls = uploadRes.map(r => r.url);
            }

            // 4. Construct Shipment Items
            // This is a bit tricky: mapping URLs back to types.
            // Since we uploaded [Text, Voice1, Voice2...], we can shift them off.

            let urlIndex = 0;
            if (composeMessage.trim()) {
                shipmentItems.push({ type: 'TEXT', content: uploadedUrls[urlIndex++] });
            }

            for (const item of attachedItems) {
                if (item.type === 'voice') {
                    shipmentItems.push({ type: 'AUDIO', content: uploadedUrls[urlIndex++] });
                }
            }

            // 5. Call Server Action
            const result = await createShipment(selectedChar.recipientId, shipmentItems);

            if (result.success) {
                // 6. Cleanup
                await clearDrafts(String(selectedChar.id));
                setView('sent');
                setTimeout(() => {
                    setComposeMessage('');
                    setAttachedItems([]);
                    setIsSealed(false);
                    setView('compose'); // Reset view for next time
                    router.push('/');
                }, 2500);
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Send failed:', error);
            setIsSealed(false);
            setView('compose');
            // Show error toast
        }
    };

    const handleToolClick = (toolId: string) => {
        if (toolId === 'voice' || toolId === 'drawing') {
            setActiveTool(toolId);
        } else {
            // Fallback for other tools
            const tool = TOOLS.find(t => t.id === toolId);
            if (tool) {
                // ... logic for other tools
            }
        }
    };

    const handleSaveAttachment = async (item: any) => {
        // Save to IDB (exclude non-serializable icon)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { icon, ...itemForDb } = item;
        await saveAttachment({ ...itemForDb, messengerId: String(selectedChar.id) });

        // State keeps the icon for rendering
        setAttachedItems(prev => [...prev, item]);
        setActiveTool(null);
    };

    const removeItem = async (id: number) => {
        await deleteAttachment(id);
        setAttachedItems(attachedItems.filter(i => i.id !== id));
    };

    return (
        <div className="relative z-10 w-full h-full flex flex-col">
            {/* --- OVERLAYS (Modals) --- */}
            {activeTool === 'voice' && (
                <VoiceRecorder onSave={handleSaveAttachment} onCancel={() => setActiveTool(null)} />
            )}
            {activeTool === 'drawing' && (
                <DrawingPad
                    onSave={i => {
                        setAttachedItems([...attachedItems, i]);
                        setActiveTool(null);
                    }}
                    onCancel={() => setActiveTool(null)}
                />
            )}

            {/* The Desk */}
            <div className="bg-[#8b7355] p-2 pixel-border pixel-corners h-full w-full">
                <div className="bg-[#a08560] p-6 h-full flex flex-col gap-6 relative">
                    {/* Header */}
                    <ComposeHeader onBack={() => router.back()} />

                    {view === 'compose' && (
                        <div className="flex flex-col md:flex-row gap-6 h-full flex-grow">
                            {/* Left Side: The Letter */}
                            <LetterArea
                                message={composeMessage}
                                setMessage={setComposeMessage}
                                attachedItems={attachedItems}
                                onRemoveItem={removeItem}
                                isSealed={isSealed}
                            />

                            {/* Right Side: Tools Pouch */}
                            <Toolkit
                                onToolClick={handleToolClick}
                                attachedItemsCount={attachedItems.length}
                                onSend={handleComposeSend}
                                canSend={composeMessage.length > 0}
                                isSealed={isSealed}
                            />
                        </div>
                    )}

                    {/* View: Sealed / Sending */}
                    {view === 'sending' && <SendingView />}

                    {/* View: Sent Success */}
                    {view === 'sent' && <SentView />}
                </div>

                <div className="mt-2 flex justify-between px-4">
                    <div className="flex gap-2">
                        <div className="w-2 h-2 bg-[#4a3b2a] rounded-full"></div>
                        <div className="w-2 h-2 bg-[#4a3b2a] rounded-full"></div>
                    </div>
                    <div className="font-pixel text-[10px] text-[#5e4c35]">VER 2.1</div>
                </div>
            </div>
        </div>
    );
};
