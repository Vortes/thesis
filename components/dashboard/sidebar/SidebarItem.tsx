import React from 'react';
import { Sparkles } from 'lucide-react';
import { Character } from '@/lib/dashboard-data';

interface SidebarItemProps {
    char: Character;
    isSelected: boolean;
    onClick: () => void;
    onRevealClick?: () => void;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({ char, isSelected, onClick, onRevealClick }) => {
    const isReady = char.status === 'Ready' && char.canSend;
    const hasGift = char.status === 'Waiting' && char.canSend;
    const needsReveal = !char.revealed;

    const handleClick = () => {
        if (needsReveal && onRevealClick) {
            onRevealClick();
        } else {
            onClick();
        }
    };

    return (
        <button
            onClick={handleClick}
            className={`w-full p-3 flex items-center gap-3 text-left pixel-border-sm transition-all group relative overflow-visible hover:cursor-pointer
                ${
                    needsReveal
                        ? 'bg-purple-100 hover:bg-purple-200 ring-2 ring-purple-400 ring-offset-1'
                        : isSelected
                        ? 'bg-pixel-accent text-black -translate-y-1'
                        : hasGift
                        ? 'bg-yellow-100 hover:bg-yellow-200'
                        : isReady
                        ? 'bg-yellow-50 hover:bg-yellow-100'
                        : 'bg-[#fdfbf7] text-gray-700 hover:bg-gray-50'
                }
            `}
        >
            {/* Avatar */}
            <div
                className="w-8 h-8 border-2 border-black shrink-0 relative overflow-hidden"
                style={{ backgroundColor: char.color }}
            >
                <div className="absolute top-2 left-1 w-1 h-2 bg-black"></div>
                <div className="absolute top-2 right-1 w-1 h-2 bg-black"></div>
            </div>

            {/* Info */}
            <div className="flex flex-col flex-1 min-w-0">
                <div className="flex justify-between items-center">
                    <span className="font-pixel text-[10px] truncate">{char.name}</span>
                    {/* Status Icons */}
                    {char.status === 'En Route' && (
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                    )}
                </div>
                <span className="font-handheld text-sm opacity-70 truncate uppercase">
                    {char.status === 'Ready'
                        ? char.holderName
                            ? `WITH ${char.holderName}`
                            : 'AVAILABLE'
                        : char.status === 'Waiting'
                        ? char.canSend
                            ? 'GIFT ARRIVED!'
                            : `WITH ${char.destination}`
                        : `${char.status} > ${char.destination}`}
                </span>
            </div>

            {/* New Hau Badge */}
            {needsReveal && (
                <div className="absolute -top-2 -right-2 bg-purple-500 text-white px-2 py-1 pixel-border-sm flex items-center gap-1 animate-pulse">
                    <Sparkles className="w-3 h-3" />
                    <span className="font-pixel text-[6px]">NEW</span>
                </div>
            )}

            {/* Selection Arrow */}
            {isSelected && !needsReveal && (
                <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-8 border-r-black"></div>
            )}
        </button>
    );
};
