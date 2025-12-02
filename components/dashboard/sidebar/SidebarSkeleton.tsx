import React from 'react';
import { Globe } from 'lucide-react';

export const SidebarSkeleton: React.FC = () => {
    return (
        <div className="w-full md:w-86 flex flex-col gap-2 h-full p-2 animate-pulse">
            {/* Brand / Nav Header Skeleton */}
            <div className="bg-[#5e4c35] p-4 pixel-border-sm flex flex-col gap-2 opacity-80">
                <div className="flex justify-between items-center">
                    <div className="h-4 w-24 bg-[#4a3b2a] rounded"></div>
                    <div className="h-8 w-8 bg-[#4a3b2a] rounded-full"></div>
                </div>
                <div className="flex gap-2 mt-2">
                    <div className="flex-1 h-6 bg-[#4a3b2a] rounded pixel-border-sm"></div>
                    <div className="flex-1 h-6 bg-[#4a3b2a] rounded pixel-border-sm"></div>
                </div>
            </div>

            {/* Character Roster Skeleton */}
            <div className="bg-[#a08560] p-2 pixel-border-sm flex-1 overflow-hidden flex flex-col opacity-80">
                <div className="mb-2 border-b border-[#8b7355] pb-1 flex justify-between items-center">
                    <div className="h-3 w-16 bg-[#8b7355] rounded"></div>
                    <div className="h-3 w-20 bg-[#8b7355] rounded"></div>
                </div>
                <div className="flex flex-col gap-2 pr-1 pt-2">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-12 bg-[#8b7355] rounded pixel-border-sm"></div>
                    ))}
                </div>
            </div>
        </div>
    );
};
