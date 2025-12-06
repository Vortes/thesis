'use client';
import React from 'react';
import { Play } from 'lucide-react';

interface AudioPlayerProps {
    src: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ src }) => {
    return (
        <div className="flex items-center gap-3 bg-[#2d2d2d] p-2 rounded">
            <button className="w-8 h-8 bg-[#4a5d4a] rounded flex items-center justify-center hover:bg-[#5a6d5a] transition-colors">
                <Play size={14} className="text-white ml-0.5" fill="white" />
            </button>
            <div className="flex-1 h-2 bg-[#1a1a1a] rounded overflow-hidden">
                <div className="h-full w-1/3 bg-[#a3e635] rounded" />
            </div>
            <span className="font-handheld text-[#a3e635] text-sm">0:00</span>
        </div>
    );
};
