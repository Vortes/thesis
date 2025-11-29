import React, { useState, useEffect } from 'react';
import { MapPin, X, Mic, Link as LinkIcon, Image as ImageIcon, PenTool } from 'lucide-react';
import { Character, TOOLS } from '@/lib/dashboard-data';

interface ComposeProps {
    selectedChar: Character;
    setCurrentView: (view: string) => void;
    setActiveTool: (toolId: string | null) => void;
    attachedItems: any[];
    setAttachedItems: (items: any[]) => void;
    isSealed: boolean;
    setIsSealed: (sealed: boolean) => void;
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
    setIsSealed,
    handleComposeSend,
    composeMessage,
    setComposeMessage
}) => {
    const [view, setView] = useState<'compose' | 'sending' | 'sent'>('compose');

    // Handle the sending flow based on isSealed prop
    useEffect(() => {
        if (isSealed && view === 'compose') {
            const timer1 = setTimeout(() => {
                setView('sending');
                const timer2 = setTimeout(() => {
                    setView('sent');
                }, 3000);
                return () => clearTimeout(timer2);
            }, 1500);
            return () => clearTimeout(timer1);
        }
    }, [isSealed, view]);

    const handleToolClick = (toolId: string) => {
        if (attachedItems.length >= 3) return; // Max items reached
        
        if (toolId === 'voice' || toolId === 'drawing') {
            setActiveTool(toolId);
        } else {
            // Fallback for other tools (simulated for now as they don't have modals yet)
            const tool = TOOLS.find(t => t.id === toolId);
            if (tool) {
                const newItem = {
                    id: Date.now(),
                    type: toolId,
                    name: tool.name,
                    icon: <tool.icon size={16} />, // Render icon as element
                    detail: 'Attached'
                };
                setAttachedItems([...attachedItems, newItem]);
            }
        }
    };

    const removeItem = (id: number) => {
        setAttachedItems(attachedItems.filter(i => i.id !== id));
    };

    const handleSendClick = () => {
        handleComposeSend(); // This should set isSealed(true) in parent
    };

    const handleReset = () => {
        setView('compose');
        setIsSealed(false);
        setComposeMessage('');
        setAttachedItems([]);
    };

    return (
        <div className="relative z-10 w-full   h-full flex flex-col">

            {/* The Desk */}
            <div className="bg-[#8b7355] p-2 pixel-border pixel-corners h-full w-full">
              <div className="bg-[#a08560] p-6 h-full flex flex-col gap-6 relative">
                
                {/* Header */}
                <div className="flex justify-center items-center bg-[#5e4c35] p-3 pixel-border-sm text-[#e0d5c1]">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5" />
                    <span className="font-pixel text-xs md:text-sm tracking-widest uppercase">
                      FROM: ME &rarr; TO: {selectedChar.destination}
                    </span>
                  </div>
                </div>

                {view === 'compose' && (
                  <div className="flex flex-col md:flex-row gap-6 h-full flex-grow">
                    
                    {/* Left Side: The Letter */}
                    <div className={`flex-1 bg-[#fdfbf7] p-6 relative flex flex-col transition-all duration-700 ${isSealed ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`} style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.2)' }}>
                      
                      <div className="absolute top-0 left-0 right-0 h-8 bg-blue-100 opacity-20 pointer-events-none"></div>
                      
                      <div className="font-handheld text-3xl text-gray-800 mb-4 border-b-2 border-dashed border-gray-300 pb-2">
                        Dear Friend,
                      </div>
                      
                      <textarea 
                        className="w-full flex-grow bg-transparent border-none resize-none font-handheld text-2xl text-gray-700 focus:outline-none leading-relaxed custom-textarea min-h-[120px]"
                        placeholder="Write your message here..."
                        value={composeMessage}
                        onChange={(e) => setComposeMessage(e.target.value)}
                        autoFocus
                      />

                      {/* Attached Items Drop Zone */}
                      <div className="mt-4 border-t-2 border-gray-200 pt-4">
                        <div className="flex justify-between items-end mb-2">
                            <div className="font-pixel text-[10px] text-gray-400 uppercase tracking-wider">Attachments ({attachedItems.length}/3)</div>
                        </div>
                        
                        <div className="flex gap-2 min-h-[60px] bg-gray-50 p-2 border-2 border-dashed border-gray-200 rounded-lg items-center">
                          {attachedItems.length === 0 && (
                            <span className="font-handheld text-xl text-gray-400 italic w-full text-center">Empty...</span>
                          )}
                          {attachedItems.map(item => (
                            <div key={item.id} className="relative group animate-in zoom-in duration-300">
                                <button 
                                    onClick={() => removeItem(item.id)}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                >
                                    <X size={12} />
                                </button>
                                <div className="bg-white border-2 border-black p-2 flex flex-col items-center gap-1 shadow-md w-20 h-20 justify-center">
                                <span className="text-gray-800">{item.icon}</span>
                                <span className="font-pixel text-[8px] text-center leading-tight truncate w-full">{item.detail}</span>
                                </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right Side: Tools Pouch */}
                    <div className={`w-full md:w-64 bg-[#4a3b2a] p-3 pixel-border-sm flex flex-col gap-3 transition-all duration-500 ${isSealed ? 'translate-x-20 opacity-0' : ''}`}>
                      <div className="text-[#e0d5c1] font-pixel text-xs text-center border-b-2 border-[#6d5a43] pb-2">
                        TOOLKIT
                      </div>
                      
                      <div className="flex flex-col gap-2 flex-1">
                        {TOOLS.map(tool => {
                          const isDisabled = attachedItems.length >= 3;
                          return (
                            <button
                              key={tool.id}
                              onClick={() => handleToolClick(tool.id)}
                              disabled={isDisabled}
                              className={`
                                p-3 text-left flex items-center gap-3 transition-all pixel-border-sm group w-full
                                ${isDisabled
                                  ? 'bg-[#5e4c35] opacity-50 cursor-not-allowed' 
                                  : 'bg-[#6d5a43] text-[#e0d5c1] hover:bg-[#a3e635] hover:text-black hover:-translate-y-1 active:translate-y-0'}
                              `}
                            >
                              <span className="text-xl group-hover:scale-110 transition-transform">
                                <tool.icon size={20} />
                              </span>
                              <div className="flex flex-col">
                                <span className="font-pixel text-[9px] leading-tight">{tool.name}</span>
                                <span className="font-handheld text-sm opacity-70 leading-none group-hover:opacity-100">{tool.desc}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      <div className="mt-auto">
                        <button 
                          onClick={handleSendClick}
                          disabled={composeMessage.length === 0}
                          className={`
                            w-full py-3 font-pixel text-xs uppercase tracking-widest
                            transition-all duration-200
                            ${composeMessage.length > 0 
                              ? 'bg-[#ef4444] text-white pixel-border-sm hover:translate-y-1 active:translate-y-2 shadow-[0_4px_0_#991b1b]' 
                              : 'bg-gray-600 text-gray-400 cursor-not-allowed'}
                          `}
                        >
                          {isSealed ? 'Sealing...' : 'Seal It'}
                        </button>
                      </div>
                    </div>

                  </div>
                )}

                {/* View: Sealed / Sending */}
                {view === 'sending' && (
                  <div className="flex-grow flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500">
                    <div className="bg-[#fdfbf7] w-64 h-40 pixel-border relative flex items-center justify-center rotate-3 shadow-xl">
                      <div className="absolute inset-0 bg-red-500 opacity-5 scanline"></div>
                      <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg border-4 border-red-800 animate-pulse">
                        <span className="font-handheld text-white text-3xl font-bold">♥</span>
                      </div>
                      <div className="absolute bottom-4 right-4 font-handheld text-gray-400 text-xl -rotate-6 border-2 border-gray-300 px-2">
                        AIR MAIL
                      </div>
                    </div>
                    <div className="mt-12 font-pixel text-sm text-[#e0d5c1] animate-pulse">
                      HANDING OFF TO COURIER...
                    </div>
                  </div>
                )}

                {/* View: Sent Success */}
                {view === 'sent' && (
                  <div className="flex-grow flex flex-col items-center justify-center text-center">
                    <div className="w-32 h-32 mb-6 relative">
                       <svg viewBox="0 0 100 100" className="w-full h-full animate-float opacity-50">
                         <path d="M20,40 h60 v40 h-10 v10 h-10 v-10 h-20 v10 h-10 v-10 h-10 z" fill="#a3e635" />
                         <rect x="30" y="30" width="40" height="40" fill="#fefce8" rx="2" />
                         <rect x="35" y="45" width="30" height="25" fill="#4a3b2a" />
                         <rect x="48" y="30" width="4" height="10" fill="#a3e635" /> 
                         <circle cx="50" cy="25" r="5" fill="#a3e635" /> 
                       </svg>
                    </div>
                    <h2 className="font-pixel text-xl text-[#a3e635] mb-4">ON THE WAY!</h2>
                  </div>
                )}

              </div>

              <div className="mt-2 flex justify-between px-4">
                 <div className="flex gap-2">
                    <div className="w-2 h-2 bg-[#4a3b2a] rounded-full"></div>
                    <div className="w-2 h-2 bg-[#4a3b2a] rounded-full"></div>
                 </div>
                 <div className="font-pixel text-[10px] text-[#5e4c35]">
                    VER 2.1
                 </div>
              </div>
            </div>
        </div>
    );
};
