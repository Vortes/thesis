import React from 'react';
import { TOOLS } from '@/lib/dashboard-data';

interface ToolkitProps {
    onToolClick: (toolId: string) => void;
    attachedItemsCount: number;
    onSend: () => void;
    canSend: boolean;
    isSealed: boolean;
}

export const Toolkit: React.FC<ToolkitProps> = ({ onToolClick, attachedItemsCount, onSend, canSend, isSealed }) => {
    return (
        <div
            className={`w-full md:w-64 bg-[#4a3b2a] p-3 pixel-border-sm flex flex-col gap-3 transition-all duration-500 ${
                isSealed ? 'translate-x-20 opacity-0' : ''
            }`}
        >
            <div className="text-[#e0d5c1] font-pixel text-xs text-center border-b-2 border-[#6d5a43] pb-2">
                TOOLKIT
            </div>

            <div className="flex flex-col gap-2 flex-1">
                {TOOLS.map(tool => {
                    const isDisabled = attachedItemsCount >= 3;
                    return (
                        <button
                            key={tool.id}
                            onClick={() => onToolClick(tool.id)}
                            disabled={isDisabled}
                            className={`
                p-3 text-left flex items-center gap-3 transition-all pixel-border-sm group w-full
                ${
                    isDisabled
                        ? 'bg-[#5e4c35] opacity-50 cursor-not-allowed'
                        : 'bg-[#6d5a43] text-[#e0d5c1] hover:bg-[#a3e635] hover:text-black hover:-translate-y-1 active:translate-y-0'
                }
              `}
                        >
                            <span className="text-xl group-hover:scale-110 transition-transform">
                                <tool.icon size={20} />
                            </span>
                            <div className="flex flex-col">
                                <span className="font-pixel text-[9px] leading-tight">{tool.name}</span>
                                <span className="font-handheld text-sm opacity-70 leading-none group-hover:opacity-100">
                                    {tool.desc}
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>

            <div className="mt-auto">
                <button
                    onClick={onSend}
                    disabled={!canSend}
                    className={`
            w-full py-3 font-pixel text-xs uppercase tracking-widest
            transition-all duration-200 hover:cursor-pointer
            ${
                canSend
                    ? 'bg-[#ef4444] text-white pixel-border-sm hover:translate-y-1 active:translate-y-2 shadow-[0_4px_0_#991b1b]'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }
          `}
                >
                    {isSealed ? 'Sealing...' : 'Seal It'}
                </button>
            </div>
        </div>
    );
};
