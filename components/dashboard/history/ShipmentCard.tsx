'use client';
import React from 'react';
import { Mic, Image as ImageIcon, PenTool } from 'lucide-react';
import { Character } from '@/lib/dashboard-data';
import { Shipment, GiftItem } from '@prisma/client';

interface ShipmentCardProps {
    shipment: Shipment & { items: GiftItem[] };
    selectedChar: Character;
    onClick: () => void;
}

export const ShipmentCard: React.FC<ShipmentCardProps> = ({ shipment, selectedChar, onClick }) => {
    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div
            onClick={onClick}
            className="bg-[#fdfbf7] p-4 pixel-border-sm relative group cursor-pointer hover:-translate-y-1 hover:shadow-lg transition-all"
        >
            {/* Folder Tab Look */}
            <div className="absolute -top-2 left-0 w-24 h-4 bg-[#fdfbf7] border-t-2 border-l-2 border-r-2 border-[#8b7355] rounded-t-lg z-0" />

            <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#8b7355] text-[#e0d5c1] flex flex-col items-center justify-center pixel-border-sm">
                        <span className="font-pixel text-[8px]">LOG</span>
                        <span className="font-handheld text-lg">#{shipment.id.slice(-4)}</span>
                    </div>
                    <div>
                        <div className="font-pixel text-[10px] text-gray-400 mb-1">
                            {formatDate(shipment.createdAt)}
                        </div>
                        <div className="font-handheld text-xl text-gray-800">Delivery to {selectedChar.name}</div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {shipment.items.some(i => i.type === 'AUDIO') && <Mic size={16} className="text-gray-400" />}
                    {shipment.items.some(i => i.type === 'PHOTO') && <ImageIcon size={16} className="text-gray-400" />}
                    {shipment.items.some(i => i.type === 'TEXT') && <PenTool size={16} className="text-gray-400" />}
                    <div className="bg-[#a3e635] px-3 py-1 font-pixel text-[8px] pixel-border-sm hover:bg-[#86efac]">
                        OPEN
                    </div>
                </div>
            </div>
        </div>
    );
};
