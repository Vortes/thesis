import React from 'react';

export const SendingView: React.FC = () => {
    return (
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
            <div className="mt-12 font-pixel text-sm text-[#e0d5c1] animate-pulse">HANDING OFF TO COURIER...</div>
        </div>
    );
};
