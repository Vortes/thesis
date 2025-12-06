'use client';
import React from 'react';
import { Loader2, Headphones, Image as ImageIcon } from 'lucide-react';
import { Character } from '@/lib/dashboard-data';
import { Shipment, GiftItem } from '@prisma/client';
import { AudioPlayer } from './AudioPlayer';

interface LetterDetailViewProps {
    shipment: Shipment & { items: GiftItem[] };
    selectedChar: Character;
    letterContent: string | null;
    loadingLetter: boolean;
}

export const LetterDetailView: React.FC<LetterDetailViewProps> = ({
    shipment,
    selectedChar,
    letterContent,
    loadingLetter
}) => {
    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="max-w-2xl mx-auto animate-in zoom-in duration-300 relative z-10">
            <div
                className="bg-white p-8 pixel-border shadow-xl relative min-h-[500px] flex flex-col"
                style={{
                    backgroundImage:
                        'repeating-linear-gradient(transparent, transparent 31px, #e5e7eb 31px, #e5e7eb 32px)',
                    backgroundPosition: '0 60px'
                }}
            >
                {/* Paper Decor - Wax Seal */}
                <div className="absolute -top-3 -right-3 w-12 h-12 bg-red-100 rotate-12 pixel-border-sm flex items-center justify-center border border-red-200">
                    <div className="w-8 h-8 rounded-full border-2 border-red-300" />
                </div>

                {/* Letter Header */}
                <div className="border-b-2 border-dashed border-gray-300 pb-4 mb-6 flex justify-between items-end">
                    <div>
                        <div className="font-pixel text-[10px] text-gray-400 uppercase">TO: {selectedChar.name}</div>
                    </div>
                    <div className="font-handheld text-xl text-[#8b7355]">{formatDate(shipment.createdAt)}</div>
                </div>

                {/* The Message */}
                <div className="flex-1 mb-8">
                    {loadingLetter ? (
                        <div className="flex flex-col items-center justify-center gap-4 text-gray-400 py-12">
                            <Loader2 size={32} className="animate-spin" />
                            <span className="font-pixel text-xs">UNSEALING LETTER...</span>
                        </div>
                    ) : letterContent ? (
                        <p className="font-handheld text-2xl text-gray-800 leading-relaxed whitespace-pre-wrap">
                            {letterContent}
                        </p>
                    ) : (
                        <p className="font-handheld text-xl text-gray-400 italic">
                            No letter content in this shipment.
                        </p>
                    )}
                </div>

                {/* Attachments Section */}
                {shipment.items.length > 0 && (
                    <div className="mt-auto bg-gray-50 p-4 rounded border-2 border-gray-200 border-dashed">
                        <div className="font-pixel text-[8px] text-gray-400 mb-4 uppercase">Attached Evidence</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {shipment.items.map(item => (
                                <div key={item.id} className="bg-white p-3 pixel-border-sm flex items-center gap-3">
                                    {item.type === 'TEXT' && (
                                        <>
                                            <div className="w-10 h-10 bg-gray-100 flex items-center justify-center text-2xl border border-gray-300">
                                                📄
                                            </div>
                                            <div>
                                                <div className="font-pixel text-[8px]">Letter</div>
                                                <div className="font-handheld text-xs text-gray-500 uppercase">
                                                    TEXT
                                                </div>
                                            </div>
                                        </>
                                    )}
                                    {item.type === 'AUDIO' && (
                                        <div className="w-full">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Headphones size={14} className="text-blue-500" />
                                                <span className="font-pixel text-[8px]">Voice Memo</span>
                                            </div>
                                            <AudioPlayer src={item.content} />
                                        </div>
                                    )}
                                    {item.type === 'PHOTO' && (
                                        <div className="w-full">
                                            <div className="flex items-center gap-2 mb-2">
                                                <ImageIcon size={14} className="text-orange-500" />
                                                <span className="font-pixel text-[8px]">Photo</span>
                                            </div>
                                            <div className="h-24 bg-white border border-gray-200 w-full flex items-center justify-center relative overflow-hidden">
                                                <img
                                                    src={item.content}
                                                    alt="Attached"
                                                    className="max-w-full max-h-full object-contain"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
