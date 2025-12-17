'use client';

import { useState, useEffect, useCallback } from 'react';
import { Character, TOOLS } from '@/lib/dashboard-data';
import { VoiceRecorder } from './VoiceRecorder';
import { DrawingPad } from './DrawingPad';
import { useRouter } from 'next/navigation';
import { ComposeHeader } from './ComposeHeader';
import { ComposeLetterWrapper } from './ComposeLetterWrapper';
import { SendingView } from './SendingView'; // Not used internally anymore? Wait, Compose uses SentView. ComposeLetterWrapper uses SendingView.
// Actually Compose only needs SentView. SendingView is inside wrapper.
import { SentView } from './SentView';
import { saveAttachment, getAttachments, deleteAttachment } from '@/lib/db';
import { Mic } from 'lucide-react';

interface ComposeProps {
    selectedChar: Character;
}

export const Compose = ({ selectedChar }: ComposeProps) => {
    const router = useRouter();
    const [attachedItems, setAttachedItems] = useState<any[]>([]);
    const [activeTool, setActiveTool] = useState<string | null>(null);

    const [view, setView] = useState<'compose' | 'sent'>('compose');

    // Load drafts on character change
    useEffect(() => {
        const loadDrafts = async () => {
            if (!selectedChar?.id) return;

            // Text draft loading moved to ComposeLetterWrapper

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

    const handleSent = () => {
        setView('sent');
        setTimeout(() => {
            setAttachedItems([]);
            setView('compose'); // Reset view for next time
            router.push('/');
        }, 2500);
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
                        <ComposeLetterWrapper
                            selectedChar={selectedChar}
                            attachedItems={attachedItems}
                            onRemoveItem={removeItem}
                            onToolClick={handleToolClick}
                            onSent={handleSent}
                        />
                    )}

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
