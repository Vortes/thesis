'use client';
import React, { useEffect, useState } from 'react';
import { History as HistoryIcon, User, ArrowLeft } from 'lucide-react';
import { Character } from '@/lib/dashboard-data';
import { useRouter } from 'next/navigation';
import type { Shipment, GiftItem } from '@prisma/client';
import { ShipmentCard } from './ShipmentCard';
import { LetterDetailView } from './LetterDetailView';

interface HistoryProps {
    selectedChar: Character | null;
    shipments?: (Shipment & { items: GiftItem[] })[];
}

export const History: React.FC<HistoryProps> = ({ selectedChar, shipments = [] }) => {
    const router = useRouter();
    const [viewingShipment, setViewingShipment] = useState<(Shipment & { items: GiftItem[] }) | null>(null);
    const [letterContent, setLetterContent] = useState<string | null>(null);
    const [loadingLetter, setLoadingLetter] = useState(false);

    // Fetch letter content when viewing a shipment
    useEffect(() => {
        const fetchLetter = async () => {
            if (!viewingShipment) {
                setLetterContent(null);
                return;
            }

            const textItem = viewingShipment.items.find(i => i.type === 'TEXT');
            if (!textItem) {
                setLetterContent(null);
                return;
            }

            try {
                setLoadingLetter(true);
                const response = await fetch(textItem.content);
                if (!response.ok) throw new Error('Failed to load');
                const text = await response.text();
                setLetterContent(text);
            } catch (err) {
                console.error('Error fetching letter:', err);
                setLetterContent('Could not load letter content.');
            } finally {
                setLoadingLetter(false);
            }
        };

        fetchLetter();
    }, [viewingShipment]);

    return (
        <div className="flex-1 bg-[#fdfbf7] relative flex flex-col h-full animate-in fade-in duration-300 overflow-hidden">
            {/* Header */}
            <div className="bg-[#e0d5c1] p-4 border-b-4 border-[#8b7355] flex items-center justify-between z-10">
                <div className="flex items-center gap-4">
                    <div className="p-2 rounded transition-colors">
                        <HistoryIcon size={24} className="text-[#5e4c35]" />
                    </div>
                    <div>
                        <h2 className="font-pixel text-xs text-[#5e4c35]">SHIPMENT HISTORY</h2>
                        <p className="font-handheld text-xl text-gray-600">
                            {viewingShipment
                                ? `LOG #${viewingShipment.id.slice(-4)}`
                                : selectedChar
                                ? `${selectedChar.name}'s Missions`
                                : 'All Archives'}
                        </p>
                    </div>
                </div>
                {viewingShipment ? (
                    <button
                        onClick={() => setViewingShipment(null)}
                        className="flex items-center gap-2 font-pixel text-[10px] bg-[#8b7355] text-white px-3 py-2 pixel-border-sm hover:bg-[#5e4c35] transition-colors"
                    >
                        <ArrowLeft size={10} /> BACK TO LIST
                    </button>
                ) : selectedChar ? (
                    <button
                        onClick={() => router.push(`/?charId=${selectedChar.id}`)}
                        className="flex items-center gap-2 font-pixel text-[10px] bg-[#8b7355] text-white px-3 py-2 pixel-border-sm hover:bg-[#5e4c35] transition-colors"
                    >
                        <ArrowLeft size={10} /> BACK TO MAP
                    </button>
                ) : null}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto bg-[#f0e6d2] p-6 relative custom-scrollbar">
                <div
                    className="absolute inset-0 opacity-10 pointer-events-none"
                    style={{
                        backgroundImage: 'radial-gradient(#8b7355 1px, transparent 1px)',
                        backgroundSize: '20px 20px'
                    }}
                />

                {!selectedChar ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-60">
                        <User size={64} className="mb-4 text-[#8b7355]" />
                        <span className="font-pixel text-xs text-center">
                            SELECT A COURIER
                            <br />
                            TO OPEN THEIR FILES
                        </span>
                    </div>
                ) : viewingShipment ? (
                    /* --- SINGLE LETTER VIEW --- */
                    <LetterDetailView
                        shipment={viewingShipment}
                        selectedChar={selectedChar}
                        letterContent={letterContent}
                        loadingLetter={loadingLetter}
                    />
                ) : (
                    /* --- LOG LIST VIEW --- */
                    <div className="grid grid-cols-1 gap-8 mx-auto relative z-10 pb-10">
                        {(() => {
                            const inTransit = shipments.filter(s => s.status === 'IN_TRANSIT');
                            const arrivedOrOpened = shipments.filter(
                                s => s.status === 'ARRIVED' || s.status === 'OPENED'
                            );

                            if (shipments.length === 0) {
                                return (
                                    <div className="text-center font-handheld text-xl text-gray-500 mt-20">
                                        No archives found.
                                    </div>
                                );
                            }

                            return (
                                <>
                                    {/* In Transit Section */}
                                    {inTransit.length > 0 && (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 mb-4 px-1">
                                                <div className="h-2 w-2 bg-yellow-500 rounded-full animate-pulse" />
                                                <h3 className="font-pixel text-[10px] text-[#8b7355] uppercase tracking-wider">
                                                    IN TRANSIT ({inTransit.length})
                                                </h3>
                                            </div>
                                            <div className="grid gap-4">
                                                {inTransit.map(shipment => (
                                                    <ShipmentCard
                                                        key={shipment.id}
                                                        shipment={shipment}
                                                        selectedChar={selectedChar}
                                                        onClick={() => setViewingShipment(shipment)}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Arrived/Opened Section */}
                                    {arrivedOrOpened.length > 0 && (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 mb-4 px-1">
                                                <h3 className="font-pixel text-[10px] text-[#8b7355] uppercase tracking-wider opacity-70">
                                                    Arrived Shipments ({arrivedOrOpened.length})
                                                </h3>
                                            </div>
                                            <div className="grid gap-4">
                                                {arrivedOrOpened.map(shipment => (
                                                    <ShipmentCard
                                                        key={shipment.id}
                                                        shipment={shipment}
                                                        selectedChar={selectedChar}
                                                        onClick={() => setViewingShipment(shipment)}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            );
                        })()}
                    </div>
                )}
            </div>
        </div>
    );
};
