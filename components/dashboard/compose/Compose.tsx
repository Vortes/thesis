'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
import { Mic, Image as ImageIcon } from 'lucide-react';

interface ComposeProps {
    selectedChar: Character;
}

export const Compose = ({ selectedChar }: ComposeProps) => {
    const router = useRouter();
    const [attachedItems, setAttachedItems] = useState<any[]>([]);
    const [activeTool, setActiveTool] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [view, setView] = useState<'compose' | 'sent'>('compose');

    // Load drafts on character change
    useEffect(() => {
        const loadDrafts = async () => {
            if (!selectedChar?.id) return;

            // Text draft loading moved to ComposeLetterWrapper

            const attachments = await getAttachments(String(selectedChar.id));
            if (attachments) {
                // Reconstruct icons since IDB doesn't store React elements
                const hydrated = attachments.map((item: any) => {
                    let previewUrl = item.previewUrl;

                    // If we have a stored file/blob but no previewUrl (because blob: URLs are revoked/lost on reload), create one
                    if (item.type === 'photo' && item.file instanceof Blob) {
                        previewUrl = URL.createObjectURL(item.file);
                    }

                    return {
                        ...item,
                        previewUrl,
                        icon: item.type === 'voice' ? <Mic size={16} /> : <ImageIcon size={16} /> // Add other types as needed
                    };
                });
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
        } else if (toolId === 'photo') {
            fileInputRef.current?.click();
        } else {
            // Fallback for other tools
            const tool = TOOLS.find(t => t.id === toolId);
            if (tool) {
                // ... logic for other tools
            }
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        const previewUrl = URL.createObjectURL(file);
        const newItem = {
            id: Date.now(),
            type: 'photo',
            name: 'Photo',
            file: file, // Store file for upload later
            previewUrl: previewUrl,
            detail: 'Photo',
            icon: <ImageIcon size={16} />
        };

        await handleSaveAttachment(newItem);
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSaveAttachment = async (item: any) => {
        // Save to IDB (exclude non-serializable icon)
        // We persist the file object (Blob) to IDB.
        // We DON'T persist previewUrl because blob: schemas are temporary.
        // We will regenerate it on load.

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { icon, previewUrl, ...itemForDb } = item;

        await saveAttachment({ ...itemForDb, messengerId: String(selectedChar.id) });

        // State keeps the icon and previewUrl for rendering
        setAttachedItems(prev => [...prev, item]);
        setActiveTool(null);
    };

    const removeItem = async (id: number) => {
        await deleteAttachment(id);
        setAttachedItems(attachedItems.filter(i => i.id !== id));
    };

    return (
        <div className="relative z-10 w-full h-full flex flex-col">
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />

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
                    <ComposeHeader onBack={() => router.back()} recipientName={selectedChar.destination} />

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
