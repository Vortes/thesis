'use client';

import React from 'react';
import { History as HistoryIcon, User, ChevronLeft } from 'lucide-react';
import { Character } from '@/lib/dashboard-data';
import { useRouter } from 'next/navigation';

interface HistoryProps {
    selectedChar: Character | null;
}

export const History: React.FC<HistoryProps> = ({ selectedChar }) => {
    const router = useRouter();

    return (
        <div className="flex-1 bg-[#fdfbf7] p-6 relative flex flex-col h-full animate-in fade-in duration-300 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-8 bg-yellow-100 opacity-20 pointer-events-none"></div>

            <div className="flex items-center gap-4 mb-6 border-b-2 border-dashed border-gray-300 pb-4">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-1 text-gray-500 hover:text-black transition-colors group mr-2 hover:cursor-pointer"
                >
                    <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                </button>

                <HistoryIcon size={24} className="text-[#8b7355]" />
                <div>
                    <h2 className="font-handheld text-3xl text-gray-800">Mission Logs</h2>
                    <p className="font-pixel text-[10px] text-gray-500">
                        {selectedChar
                            ? `TRACKING: ${selectedChar.name.toUpperCase()}`
                            : 'SELECT A COURIER TO VIEW LOGS'}
                    </p>
                </div>
            </div>

            <div className="flex-1">
                {!selectedChar ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
                        <User size={48} className="mb-2" />
                        <span className="font-pixel text-xs">NO COURIER SELECTED</span>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {selectedChar.history.length === 0 ? (
                            <div className="text-center font-handheld text-xl text-gray-400 mt-10">
                                No prior missions recorded.
                            </div>
                        ) : (
                            selectedChar.history.map(log => (
                                <div
                                    key={log.id}
                                    className="bg-white border-2 border-gray-200 p-4 relative group hover:border-black transition-colors"
                                >
                                    {/* Stamp style date */}
                                    <div className="absolute -top-3 -right-2 bg-pixel-accent text-black font-pixel text-[8px] px-2 py-1 rotate-3 border border-black">
                                        {log.date}
                                    </div>

                                    <div className="flex gap-4">
                                        <div className="flex flex-col items-center gap-1">
                                            <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                                            <div className="w-0.5 h-full bg-gray-300"></div>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-pixel text-[10px] text-gray-600 mb-1">
                                                DESTINATION: {log.location.toUpperCase()}
                                            </h3>
                                            <div className="font-handheld text-xl mb-2">Delivered to {log.to}</div>
                                            <div className="flex gap-2">
                                                {log.items.map((item, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="bg-gray-100 px-2 py-1 font-pixel text-[8px] text-gray-500 border border-gray-300 rounded"
                                                    >
                                                        {item}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
