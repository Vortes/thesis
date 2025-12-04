'use client';
import React from 'react';
import { History as HistoryIcon, User, ChevronLeft, Package } from 'lucide-react';
import { Character } from '@/lib/dashboard-data';
import { useRouter } from 'next/navigation';
import { Shipment, GiftItem } from '@prisma/client';

interface HistoryProps {
    selectedChar: Character | null;
    shipments?: (Shipment & { items: GiftItem[] })[];
}

export const History: React.FC<HistoryProps> = ({ selectedChar, shipments = [] }) => {
    const router = useRouter();

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric'
        });
    };

    return (
        <div className="flex-1 bg-[#fdfbf7] p-6 relative flex flex-col h-full animate-in fade-in duration-300 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-8 bg-yellow-100 opacity-20 pointer-events-none"></div>

            <div className="flex items-center gap-4 mb-6 border-b-2 border-dashed border-gray-300 pb-4">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-1 text-gray-500 hover:text-black transition-colors group mr-2 hover:cursor-pointer"
                >
                    <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                </button>

                <HistoryIcon size={24} className="text-[#8b7355]" />
                <div>
                    <h2 className="font-handheld text-3xl text-gray-800">Mission Logs</h2>
                    <p className="font-pixel text-[10px] text-gray-500">
                        {selectedChar
                            ? `TRACKING: ${selectedChar.name.toUpperCase()}`
                            : 'SELECT A COURIER TO VIEW LOGS'}
                    </p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {!selectedChar ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
                        <User size={48} className="mb-2" />
                        <span className="font-pixel text-xs">NO COURIER SELECTED</span>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {shipments.length === 0 ? (
                            <div className="text-center font-handheld text-xl text-gray-400 mt-10">
                                No delivered shipments found.
                            </div>
                        ) : (
                            shipments.map(shipment => (
                                <div
                                    key={shipment.id}
                                    className="bg-white border-2 border-gray-200 p-4 relative group hover:border-black transition-colors rounded-sm"
                                >
                                    {/* Stamp style date */}
                                    <div className="absolute -top-3 -right-2 bg-pixel-accent text-black font-pixel text-[8px] px-2 py-1 rotate-3 border border-black shadow-sm">
                                        {formatDate(shipment.createdAt)}
                                    </div>

                                    <div className="flex gap-4">
                                        <div className="flex flex-col items-center gap-1 pt-2">
                                            <div className="w-3 h-3 rounded-full bg-gray-300 border border-gray-400"></div>
                                            <div className="w-0.5 h-full bg-gray-200 dashed-line"></div>
                                        </div>
                                        <div className="flex-1 pb-2">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Package size={14} className="text-gray-400" />
                                                <span className="font-pixel text-[10px] text-gray-500 uppercase tracking-wider">
                                                    Shipment #{shipment.id.slice(-4)}
                                                </span>
                                            </div>

                                            <div className="flex flex-col gap-3">
                                                {shipment.items.map(item => (
                                                    <div
                                                        key={item.id}
                                                        className="bg-gray-50 p-3 rounded border border-gray-100"
                                                    >
                                                        {item.type === 'TEXT' && (
                                                            <p className="font-handheld text-lg text-gray-800 whitespace-pre-wrap leading-relaxed">
                                                                {/* If content is a URL (from uploadthing), fetch it? Or is it raw text? 
                                                                    Wait, for TEXT type, we stored the URL in content if it was uploaded as a file?
                                                                    Actually, in Compose.tsx we uploaded text as a file. 
                                                                    So content is a URL. We need to fetch it or display a link.
                                                                    User said "display text". 
                                                                    If it's a URL, I can't easily display it without fetching.
                                                                    For now, let's assume I should display a link or if I can, fetch it.
                                                                    Given the constraints, I'll display a "View Letter" link if it looks like a URL, 
                                                                    or just the content if it's not.
                                                                    Actually, `Compose.tsx` creates a File for text. So it IS a URL.
                                                                    I'll render an iframe or a fetch? 
                                                                    Let's render a link for now to be safe, or try to fetch if I can.
                                                                    Actually, for "TEXT", maybe I should have stored it directly in DB if it's short?
                                                                    But the plan was "upload files".
                                                                    I will render a "Read Letter" button that opens the URL.
                                                                */}
                                                                <a
                                                                    href={item.content}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-blue-600 hover:underline flex items-center gap-2"
                                                                >
                                                                    <span>📄 Read Letter</span>
                                                                </a>
                                                            </p>
                                                        )}
                                                        {item.type === 'AUDIO' && (
                                                            <div className="w-full">
                                                                <audio
                                                                    controls
                                                                    src={item.content}
                                                                    className="w-full h-8"
                                                                />
                                                            </div>
                                                        )}
                                                        {item.type === 'PHOTO' && (
                                                            <img
                                                                src={item.content}
                                                                alt="Attached photo"
                                                                className="max-w-full h-auto rounded border border-gray-200"
                                                            />
                                                        )}
                                                        {/* Handle other types if needed */}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
