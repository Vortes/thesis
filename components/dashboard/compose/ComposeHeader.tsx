import React from 'react';
import { ChevronLeft, MapPin } from 'lucide-react';

interface ComposeHeaderProps {
    onBack: () => void;
}

export const ComposeHeader: React.FC<ComposeHeaderProps> = ({ onBack }) => {
    console.log('re-rendering');
    return (
        <div className="flex justify-between items-center bg-[#5e4c35] p-3 pixel-border-sm text-[#e0d5c1]">
            <button
                onClick={onBack}
                className="flex items-center gap-1 hover:text-white transition-colors group cursor-pointer"
            >
                <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                <span className="font-pixel text-[10px] uppercase">Back</span>
            </button>
            <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5" />
                <span className="font-pixel text-xs md:text-sm tracking-widest uppercase">FROM: ME &rarr; TO:</span>
            </div>
            <div className="w-10"></div> {/* Spacer for balance */}
        </div>
    );
};
