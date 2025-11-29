import React from 'react';
import { Globe, Plus, AlertCircle } from 'lucide-react';
import { Character } from '@/lib/dashboard-data';
import { SidebarItem } from './SidebarItem';

import { SignedIn, UserButton } from "@clerk/nextjs";

interface SidebarProps {
    currentView: string;
    setCurrentView: (view: string) => void;
    sortedChars: Character[];
    selectedChar: Character | null;
    handleCharClick: (char: Character) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
    currentView, 
    setCurrentView, 
    sortedChars, 
    selectedChar, 
    handleCharClick 
}) => {
    return (
        <div className="w-full md:w-86 flex flex-col gap-2 h-full p-2">
            
            {/* Brand / Nav Header */}
            <div className="bg-[#5e4c35] p-4 pixel-border-sm text-[#e0d5c1] flex flex-col gap-2">
                <div className="flex justify-between items-center">
                    <h1 className="font-pixel text-sm text-pixel-accent flex items-center gap-2">
                        <Globe size={16} /> 
                        HAUMAIL
                    </h1>
                    <SignedIn>
                        <UserButton />
                    </SignedIn>
                </div>
                <div className="flex gap-2 mt-2">
                    <button 
                        onClick={() => setCurrentView('dashboard')}
                        className={`flex-1 py-2 text-center font-pixel text-[8px] pixel-border-sm transition-all ${currentView === 'dashboard' ? 'bg-pixel-card text-[#5e4c35]' : 'bg-[#4a3b2a] hover:bg-[#6d5a43]'}`}
                    >
                        MAP
                    </button>
                    <button 
                        onClick={() => setCurrentView('history')}
                        className={`flex-1 py-2 text-center font-pixel text-[8px] pixel-border-sm transition-all ${currentView === 'history' ? 'bg-pixel-card text-[#5e4c35]' : 'bg-[#4a3b2a] hover:bg-[#6d5a43]'}`}
                    >
                        HISTORY
                    </button>
                </div>
            </div>

            {/* Character Roster */}
            <div className="bg-[#a08560] p-2 pixel-border-sm flex-1 overflow-hidden flex flex-col">
                <div className="font-pixel text-[8px] text-[#4a3b2a] mb-2 uppercase tracking-widest border-b border-[#8b7355] pb-1 flex justify-between items-center">
                    <span>COURIERS</span>
                    <span className="text-[6px] bg-[#4a3b2a] text-[#e0d5c1] px-1 rounded">SORT: STATUS</span>
                </div>
                <div className="flex flex-col gap-2 pr-1 pt-2">
                    {sortedChars.map(char => (
                        <SidebarItem 
                            key={char.id} 
                            char={char} 
                            isSelected={selectedChar?.id === char.id}
                            onClick={handleCharClick}
                        />
                    ))}
                    
                    {/* Add New Button */}
                    <button className="w-full py-3 border-2 border-dashed border-[#6d5a43] text-[#6d5a43] font-pixel text-[8px] hover:bg-[#8b7355] hover:text-[#e0d5c1] transition-colors flex items-center justify-center gap-2 opacity-50 hover:opacity-100">
                        <Plus size={12} /> HIRE NEW
                    </button>
                </div>
            </div>

        </div>
    );
};
