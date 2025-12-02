'use client';

import React from 'react';
import { Globe, Plus } from 'lucide-react';
import { Character } from '@/lib/dashboard-data';
import { SidebarItem } from './SidebarItem';
import { SignedIn, UserButton } from '@clerk/nextjs';
import { useRouter, usePathname, useSearchParams, useParams } from 'next/navigation';
import Link from 'next/link';

interface SidebarProps {
    sortedChars: Character[];
}

export const Sidebar: React.FC<SidebarProps> = ({ sortedChars }) => {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const params = useParams();

    const selectedCharId = (params.charId as string) || searchParams.get('charId');

    const handleCharClick = (charId: string | number) => {
        if (pathname.includes('/history')) {
            router.push(`/${charId}/history`);
        } else if (pathname.includes('/compose')) {
            router.push(`/${charId}/compose`);
        } else {
            router.push(`/?charId=${charId}`);
        }
    };

    return (
        <div className="w-full md:w-86 flex flex-col gap-2 h-full p-2">
            {/* Brand / Nav Header */}
            <div className="bg-[#5e4c35] p-4 pixel-border-sm text-[#e0d5c1] flex flex-col gap-2">
                <div className="flex justify-between items-center">
                    <Link href="/">
                        <h1 className="font-pixel text-sm text-pixel-accent flex items-center gap-2">
                            <Globe size={16} />
                            HAUMAIL
                        </h1>
                    </Link>
                    <SignedIn>
                        <UserButton />
                    </SignedIn>
                </div>
                {/* <div className="flex gap-2 mt-2">
                    <Link 
                        href="/"
                        className={`flex-1 py-2 text-center font-pixel text-[8px] pixel-border-sm transition-all bg-pixel-card text-[#5e4c35]`}
                    >
                        MAP
                    </Link>
                    <Link 
                        href={selectedCharId ? `/${selectedCharId}/history` : '#'}
                        className={`flex-1 py-2 text-center font-pixel text-[8px] pixel-border-sm transition-all bg-pixel-card text-[#5e4c35] ${!selectedCharId ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={(e) => !selectedCharId && e.preventDefault()}
                    >
                        HISTORY
                    </Link>
                </div> */}
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
                            isSelected={selectedCharId === String(char.id)}
                            onClick={() => handleCharClick(char.id)}
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
