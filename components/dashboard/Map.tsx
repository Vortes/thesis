import React from 'react';
import { Character, CHARACTERS } from '@/lib/dashboard-data';
import { CharacterPin } from './CharacterPin';

interface MapProps {
    selectedChar: Character | null;
    isSealed: boolean;
    handleCharClick: (char: Character) => void;
    setCurrentView: (view: string) => void;
}

export const Map: React.FC<MapProps> = ({ selectedChar, isSealed, handleCharClick, setCurrentView }) => {
    return (
        <div className="absolute inset-0 bg-[#e5e7eb] flex flex-col animate-in fade-in duration-300">
            {/* Fake Map Background */}
            <div className="flex-1 relative map-pattern overflow-hidden">
                {/* Fake Landmasses (SVG) */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" preserveAspectRatio="none">
                    <path d="M0,100 Q150,50 300,100 T600,80 T900,150 V300 H0 Z" fill="#94a3b8" />
                    <path d="M400,0 Q450,100 600,50 T800,0 Z" fill="#94a3b8" />
                </svg>
                
                {/* Map Grid/Decorations */}
                <div className="absolute top-4 left-4 bg-white/80 p-2 pixel-border-sm z-20">
                    <div className="font-pixel text-[8px] text-gray-500">GLOBAL TRACKER</div>
                </div>

                {/* Pins */}
                {CHARACTERS.map(char => (
                    <CharacterPin key={char.id} char={char} onClick={handleCharClick} />
                ))}
            </div>

            {/* Selected Character Detail Panel (Bottom Overlay) */}
            {selectedChar && !isSealed && (
                <div className="bg-white p-4 border-t-4 border-[#6d5a43] flex items-center gap-4 animate-in slide-in-from-bottom duration-300">
                    <div className="w-16 h-16 border-2 border-black relative" style={{ backgroundColor: selectedChar.color }}>
                         <div className="absolute top-4 left-2 w-2 h-4 bg-black"></div>
                         <div className="absolute top-4 right-2 w-2 h-4 bg-black"></div>
                    </div>
                    <div className="flex-1">
                        <h3 className="font-pixel text-sm flex items-center gap-2">
                            {selectedChar.name}
                            {selectedChar.status === 'Ready' && <span className="bg-red-500 text-white text-[8px] px-1 py-0.5 rounded">READY!</span>}
                        </h3>
                        <p className="font-handheld text-lg text-gray-600">
                            {selectedChar.status === 'Ready' 
                              ? "Waiting for orders at base." 
                              : `Currently traveling to ${selectedChar.destination}.`}
                        </p>
                        {selectedChar.status !== 'Ready' && (
                            <div className="w-full bg-gray-200 h-2 mt-2 border border-gray-400 rounded-full overflow-hidden">
                                <div className="h-full bg-pixel-accent" style={{ width: `${selectedChar.progress}%` }}></div>
                            </div>
                        )}
                    </div>
                    
                    {/* Action Button */}
                    {selectedChar.status === 'Ready' ? (
                        <button 
                            onClick={() => setCurrentView('compose')}
                            className="bg-[#ef4444] text-white px-4 py-2 font-pixel text-[10px] pixel-border-sm hover:translate-y-[-2px] hover:shadow-lg animate-bounce-sm"
                        >
                            START QUEST
                        </button>
                    ) : (
                        <button onClick={() => setCurrentView('history')} className="bg-gray-200 text-gray-600 px-4 py-2 font-pixel text-[10px] pixel-border-sm hover:bg-gray-300">
                            VIEW LOGS
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};
