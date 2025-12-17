'use client';

import { useState, useEffect } from 'react';
import { Character } from '@/lib/dashboard-data';
import { LetterArea } from './LetterArea';
import { Toolkit } from './Toolkit';
import { SendingView } from './SendingView';
import { useUploadThing } from '@/lib/uploadthing';
import { saveDraft, getDraft, clearDrafts } from '@/lib/db';
import { createShipment } from '@/app/actions/shipment';
import { GiftType } from '@prisma/client';

interface ComposeLetterWrapperProps {
    selectedChar: Character;
    attachedItems: any[];
    onRemoveItem: (id: number) => void;
    onToolClick: (toolId: string) => void;
    onSent: () => void;
}

export const ComposeLetterWrapper = ({
    selectedChar,
    attachedItems,
    onRemoveItem,
    onToolClick,
    onSent
}: ComposeLetterWrapperProps) => {
    const [composeMessage, setComposeMessage] = useState('');
    const [isSealed, setIsSealed] = useState(false);
    const [view, setView] = useState<'compose' | 'sending'>('compose');

    // Load text draft on character change
    useEffect(() => {
        const loadDrafts = async () => {
            if (!selectedChar?.id) return;
            const draft = await getDraft(String(selectedChar.id));
            if (draft) setComposeMessage(draft.text);
            else setComposeMessage('');
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

    // Handle the sending flow transition
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
            }

            // 2. Prepare Attachments
            for (const item of attachedItems) {
                if (item.type === 'voice' && item.blob) {
                    const file = new File([item.blob], `voice-${item.id}.webm`, { type: 'audio/webm' });
                    filesToUpload.push(file);
                }
                // Add other types here as needed
            }

            // 3. Upload All Files
            let uploadedUrls: string[] = [];
            if (filesToUpload.length > 0) {
                const uploadRes = await startUpload(filesToUpload, { recipientId: selectedChar.recipientId });
                if (!uploadRes) throw new Error('Upload failed');
                uploadedUrls = uploadRes.map(r => r.url);
            }

            // 4. Construct Shipment Items
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
                await clearDrafts(String(selectedChar.id));

                onSent();
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

    if (view === 'sending') {
        return <SendingView />;
    }

    return (
        <div className="flex flex-col md:flex-row gap-6 h-full flex-grow">
            {/* Left Side: The Letter */}
            <LetterArea
                message={composeMessage}
                setMessage={setComposeMessage}
                attachedItems={attachedItems}
                onRemoveItem={onRemoveItem}
                isSealed={isSealed}
            />

            {/* Right Side: Tools Pouch */}
            <Toolkit
                onToolClick={onToolClick}
                attachedItemsCount={attachedItems.length}
                onSend={handleComposeSend}
                canSend={composeMessage.length > 0}
                isSealed={isSealed}
            />
        </div>
    );
};
