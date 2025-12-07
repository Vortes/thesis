import React from 'react';
import { Character } from '@/lib/dashboard-data';

interface CharacterPinProps {
    char: Character;
    onClick: (char: Character) => void;
}

export const CharacterPin: React.FC<CharacterPinProps> = ({ char, onClick }) => (
    <div
        className="absolute transform -translate-x-1/2 -translate-y-full cursor-pointer group hover:z-50"
        style={{ left: `${char.coords.lng}%`, top: `${char.coords.lat}%` }}
        onClick={() => onClick(char)}
    >
        <div className="relative">
            {/* Quest Marker for Ready Chars */}
            {char.status === 'Ready' && (
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 animate-bounce-sm">
                    <div className="bg-red-500 text-white font-pixel text-[10px] w-4 h-4 flex items-center justify-center pixel-border-sm border-white">
                        !
                    </div>
                </div>
            )}

            {/* Status Pulse for En Route */}
            {char.status === 'En Route' && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full animate-pulse-ring -z-10"></div>
            )}

            {/* The Character Graphic (Tiny) */}
            <div
                className={`w-10 h-10 pixel-border-sm bg-white p-1 relative z-10 transition-transform duration-200 ${
                    char.status === 'Ready' ? 'hover:scale-110' : ''
                }`}
            >
                <div className="w-full h-full" style={{ backgroundColor: char.color }}></div>
                {/* Tiny eyes */}
                <div className="absolute top-3 left-2 w-1 h-2 bg-black"></div>
                <div className="absolute top-3 right-2 w-1 h-2 bg-black"></div>
            </div>

            {/* Tooltip Label */}
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black text-white px-2 py-1 font-pixel text-[8px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 pixel-border-sm">
                {char.name} ({char.status})
            </div>
        </div>
        {/* Pin Stick */}
        <div className="w-0.5 h-4 bg-black mx-auto"></div>
    </div>
);
