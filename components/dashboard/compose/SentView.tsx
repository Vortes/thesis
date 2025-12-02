import React from 'react';

export const SentView: React.FC = () => {
    return (
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
    );
};
