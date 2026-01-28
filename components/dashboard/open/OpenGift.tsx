'use client';

import { useState, useEffect } from 'react';
import { Character } from '@/lib/dashboard-data';
import { useRouter } from 'next/navigation';
import { openShipment } from '@/app/actions/open-shipment';
import { ArrowLeft, MessageSquare, Mic, Image, PenTool, Link as LinkIcon } from 'lucide-react';
import { GiftType } from '@prisma/client';

interface ShipmentData {
    id: string;
    status: string;
    createdAt: Date;
    sender: {
        id: string;
        first_name: string;
        last_name: string;
    };
    items: {
        id: string;
        type: GiftType;
        content: string;
    }[];
}

interface OpenGiftProps {
    selectedChar: Character;
    shipment: ShipmentData;
}

function getItemIcon(type: GiftType) {
    switch (type) {
        case 'TEXT':
            return <MessageSquare size={16} />;
        case 'AUDIO':
            return <Mic size={16} />;
        case 'PHOTO':
            return <Image size={16} />;
        case 'DRAWING':
            return <PenTool size={16} />;
        case 'LINK':
            return <LinkIcon size={16} />;
        default:
            return <MessageSquare size={16} />;
    }
}

// Helper to check if content is a URL
function isUrl(str: string): boolean {
    return str.startsWith('http://') || str.startsWith('https://');
}

export const OpenGift = ({ selectedChar, shipment }: OpenGiftProps) => {
    const router = useRouter();
    const [isOpening, setIsOpening] = useState(false);
    const [isOpened, setIsOpened] = useState(shipment.status === 'OPENED');
    const [textContents, setTextContents] = useState<Record<string, string>>({});

    // Fetch text content from URLs for backward compatibility with old shipments
    useEffect(() => {
        const fetchTextContents = async () => {
            const textItems = shipment.items.filter(item => item.type === 'TEXT' && isUrl(item.content));
            const contents: Record<string, string> = {};

            await Promise.all(
                textItems.map(async item => {
                    try {
                        const res = await fetch(item.content);
                        const text = await res.text();
                        contents[item.id] = text;
                    } catch {
                        contents[item.id] = item.content; // Fallback to showing URL
                    }
                })
            );

            setTextContents(contents);
        };

        fetchTextContents();
    }, [shipment.items]);

    const handleOpen = async () => {
        if (isOpened) return;

        setIsOpening(true);
        const result = await openShipment(shipment.id);
        if (result.success) {
            setIsOpened(true);
        }
        setIsOpening(false);
    };

    const handleReply = () => {
        router.push(`/${selectedChar.id}/compose`);
    };

    return (
        <div className="relative z-10 w-full h-full flex flex-col">
            {/* The Desk */}
            <div className="bg-[#8b7355] p-2 pixel-border pixel-corners h-full w-full">
                <div className="bg-[#a08560] p-6 h-full flex flex-col gap-6 relative">
                    {/* Header */}
                    <div className="flex justify-between items-center">
                        <button
                            onClick={() => router.back()}
                            className="flex items-center gap-2 font-pixel text-[10px] text-[#5e4c35] hover:text-[#3d2e1f] hover:cursor-pointer"
                        >
                            <ArrowLeft size={16} />
                            BACK
                        </button>
                        <div className="font-pixel text-[12px] text-[#5e4c35]">
                            FROM: {shipment.sender.first_name.toUpperCase()}
                        </div>
                    </div>

                    {/* Gift Package */}
                    <div className="flex-1 flex flex-col items-center justify-center gap-6">
                        {!isOpened ? (
                            <>
                                {/* Unopened Package */}
                                <div className="relative">
                                    <div
                                        className="w-32 h-32 bg-[#facc15] border-4 border-black flex items-center justify-center animate-bounce-sm"
                                        style={{
                                            boxShadow:
                                                '-4px 0 0 0 black, 4px 0 0 0 black, 0 -4px 0 0 black, 0 4px 0 0 black'
                                        }}
                                    >
                                        <div className="text-4xl">?</div>
                                    </div>
                                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-4 bg-red-500 border-2 border-black"></div>
                                </div>

                                <p className="font-handheld text-xl text-[#5e4c35]">
                                    {selectedChar.name} brought you a gift!
                                </p>

                                <button
                                    onClick={handleOpen}
                                    disabled={isOpening}
                                    className="bg-[#facc15] text-black px-8 py-3 font-pixel text-sm pixel-border-sm hover:bg-[#eab308] hover:cursor-pointer disabled:opacity-50"
                                >
                                    {isOpening ? 'OPENING...' : 'OPEN GIFT'}
                                </button>
                            </>
                        ) : (
                            <>
                                {/* Opened - Show Items */}
                                <div className="w-full max-w-md bg-[#fdfbf7] p-6 pixel-border-sm">
                                    <h3 className="font-pixel text-sm mb-4 text-center">
                                        GIFT FROM {shipment.sender.first_name.toUpperCase()}
                                    </h3>

                                    <div className="space-y-4">
                                        {shipment.items.map(item => (
                                            <div key={item.id} className="border-2 border-gray-300 p-3">
                                                <div className="flex items-center gap-2 mb-2 text-gray-500">
                                                    {getItemIcon(item.type)}
                                                    <span className="font-pixel text-[10px]">{item.type}</span>
                                                </div>

                                                {item.type === 'TEXT' && (
                                                    <p className="font-handheld text-lg whitespace-pre-wrap">
                                                        {isUrl(item.content)
                                                            ? textContents[item.id] ?? 'Loading...'
                                                            : item.content}
                                                    </p>
                                                )}

                                                {item.type === 'AUDIO' && (
                                                    <audio controls className="w-full">
                                                        <source src={item.content} type="audio/webm" />
                                                    </audio>
                                                )}

                                                {(item.type === 'PHOTO' || item.type === 'DRAWING') && (
                                                    <img
                                                        src={item.content}
                                                        alt="Gift"
                                                        className="max-w-full h-auto"
                                                    />
                                                )}

                                                {item.type === 'LINK' && (
                                                    <a
                                                        href={item.content}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-500 underline font-handheld text-lg break-all"
                                                    >
                                                        {item.content}
                                                    </a>
                                                )}
                                            </div>
                                        ))}

                                        {shipment.items.length === 0 && (
                                            <p className="font-handheld text-lg text-gray-400 text-center">
                                                The gift was empty...
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <button
                                    onClick={handleReply}
                                    className="bg-[#ef4444] text-white px-8 py-3 font-pixel text-sm pixel-border-sm hover:bg-[#dc2626] hover:cursor-pointer animate-bounce-sm"
                                >
                                    SEND REPLY
                                </button>
                            </>
                        )}
                    </div>
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
