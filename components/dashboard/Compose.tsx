import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Character, TOOLS } from '@/lib/dashboard-data';

interface ComposeProps {
    selectedChar: Character;
    setCurrentView: (view: string) => void;
    setActiveTool: (toolId: string | null) => void;
    attachedItems: any[];
    setAttachedItems: (items: any[]) => void;
    isSealed: boolean;
    handleComposeSend: () => void;
    composeMessage: string;
    setComposeMessage: (message: string) => void;
}

export const Compose: React.FC<ComposeProps> = ({ 
    selectedChar, 
    setCurrentView, 
    setActiveTool, 
    attachedItems, 
    setAttachedItems, 
    isSealed, 
    handleComposeSend,
    composeMessage,
    setComposeMessage
}) => {
    return (
        <div className="flex-1 bg-[#fdfbf7] p-8 relative flex flex-col h-full animate-in fade-in zoom-in duration-300">
            {/* Watermark */}
            <div className="absolute top-0 left-0 right-0 h-8 bg-red-100 opacity-20 pointer-events-none"></div>
            
            {/* Header with Back Button */}
            <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setCurrentView('dashboard')}
                        className="p-2 border-2 border-gray-300 hover:bg-gray-100 hover:border-black transition-colors"
                    >
                        <ArrowLeft size={16} />
                    </button>
                    <div>
                        <div className="font-handheld text-3xl text-gray-800">New Quest</div>
                        <div className="font-pixel text-[10px] text-green-600 mt-1 flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            COURIER {selectedChar.name} IS READY
                        </div>
                    </div>
                </div>
                
                {/* Courier Avatar */}
                <div className="w-12 h-12 border-2 border-black relative" style={{backgroundColor: selectedChar.color}}>
                    <div className="absolute top-3 left-2 w-1.5 h-3 bg-black"></div>
                    <div className="absolute top-3 right-2 w-1.5 h-3 bg-black"></div>
                    {/* Backpack */}
                    <div className="absolute bottom-0 w-full h-4 bg-black/20"></div>
                </div>
            </div>

            {/* Text Area */}
            <textarea 
                className="w-full flex-grow bg-transparent border-none resize-none font-handheld text-2xl text-gray-700 focus:outline-none leading-relaxed p-0"
                placeholder={`What should ${selectedChar.name} carry to your friend?`}
                value={composeMessage}
                onChange={(e) => setComposeMessage(e.target.value)}
                autoFocus
            />

            {/* Attachments Bar */}
            <div className="mt-auto pt-4 border-t-2 border-dashed border-gray-300">
                <div className="flex items-center gap-4">
                    <div className="flex gap-2">
                        {TOOLS.map(tool => (
                            <button 
                                key={tool.id}
                                onClick={() => tool.id === 'voice' || tool.id === 'drawing' ? setActiveTool(tool.id) : setAttachedItems([...attachedItems, {id: Date.now(), icon: tool.icon, name: tool.name}])}
                                className="p-2 bg-gray-100 border border-gray-300 hover:bg-pixel-accent hover:border-black hover:text-black transition-colors group"
                                title={tool.name}
                            >
                                <div className="group-hover:scale-110 transition-transform">
                                   <tool.icon />
                                </div>
                            </button>
                        ))}
                    </div>
                    <div className="w-px h-8 bg-gray-300"></div>
                    {/* Attached Items Preview */}
                    <div className="flex gap-1 overflow-x-auto">
                        {attachedItems.map((item, i) => (
                            <div key={i} className="bg-white border border-black px-2 py-1 flex items-center gap-1 font-pixel text-[8px] animate-in zoom-in">
                                {item.icon} {item.name}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Send Button */}
                <div className="mt-4 flex justify-end">
                    <button 
                        onClick={handleComposeSend}
                        className={`px-8 py-3 font-pixel text-xs uppercase tracking-widest transition-all
                            ${composeMessage ? 'bg-[#ef4444] text-white pixel-border-sm hover:-translate-y-1' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}
                        `}
                    >
                        {isSealed ? 'SEALING...' : 'START QUEST'}
                    </button>
                </div>
            </div>
            
            {/* Sealed Overlay Animation */}
            {isSealed && (
                <div className="absolute inset-0 bg-[#fdfbf7] z-20 flex flex-col items-center justify-center animate-in fade-in duration-500">
                     <div className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center shadow-xl border-4 border-red-800 mb-4 animate-bounce">
                        <span className="font-handheld text-white text-4xl">♥</span>
                     </div>
                     <div className="font-pixel text-sm text-gray-500">DISPATCHING {selectedChar.name.toUpperCase()}...</div>
                </div>
            )}
        </div>
    );
};
