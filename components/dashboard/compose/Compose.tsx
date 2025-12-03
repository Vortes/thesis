'use client';

import { useState, useEffect } from 'react';
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

    // Handle the sending flow
    useEffect(() => {
        if (isSealed && view === 'compose') {
            const timer1 = setTimeout(() => {
                setView('sending');
                const timer2 = setTimeout(() => {
                    setView('sent');
                }, 3000);
                return () => clearTimeout(timer2);
            }, 1500);
            return () => clearTimeout(timer1);
        }
    }, [isSealed, view]);

    const { startUpload } = useUploadThing('shipmentUploader', {
        onClientUploadComplete: async res => {
            if (!res || res.length === 0) {
                setIsSealed(false);
                return;
            }

            const serverData = res[0].serverData;

            if (serverData.success) {
                setTimeout(() => {
                    setComposeMessage('');
                    setAttachedItems([]);
                    setIsSealed(false);
                    router.push('/');
                }, 2500);
            } else {
                setIsSealed(false);
            }
        },
        onUploadError: error => {
            setIsSealed(false);
        }
    });

    const handleComposeSend = () => {
        setIsSealed(true);

        const textFile = new File([composeMessage], 'message.txt', { type: 'text/plain' });
        const recipientId = selectedChar.recipientId;

        startUpload([textFile], { recipientId });
    };

    const handleToolClick = (toolId: string) => {
        if (toolId === 'voice' || toolId === 'drawing') {
            setActiveTool(toolId);
        } else {
            // Fallback for other tools (simulated for now as they don't have modals yet)
            const tool = TOOLS.find(t => t.id === toolId);
            if (tool) {
                const newItem = {
                    id: Date.now(),
                    type: toolId,
                    name: tool.name,
                    icon: <tool.icon size={16} />, // Render icon as element
                    detail: 'Attached'
                };
                setAttachedItems([...attachedItems, newItem]);
            }
        }
    };

    const removeItem = (id: number) => {
        setAttachedItems(attachedItems.filter(i => i.id !== id));
    };

    return (
        <div className="relative z-10 w-full h-full flex flex-col">
            {/* --- OVERLAYS (Modals) --- */}
            {activeTool === 'voice' && (
                <VoiceRecorder
                    onSave={i => {
                        setAttachedItems([...attachedItems, i]);
                        setActiveTool(null);
                    }}
                    onCancel={() => setActiveTool(null)}
                />
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
