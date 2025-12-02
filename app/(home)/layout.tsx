import '../globals.css';

import { Suspense } from 'react';
import { Sidebar } from '@/components/dashboard/sidebar/Sidebar';
import { SidebarLoader } from '@/components/dashboard/sidebar/SidebarLoader';
import { SidebarSkeleton } from '@/components/dashboard/sidebar/SidebarSkeleton';

export default async function RootLayout({
    children
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="h-screen w-screen bg-slate-800 relative overflow-hidden font-sans select-none">
            <div className="relative z-10 w-full h-full flex flex-col md:flex-row bg-pixel-bg p-3 pixel-border pixel-corners gap-0">
                <Suspense fallback={<SidebarSkeleton />}>
                    <SidebarLoader />
                </Suspense>
                <div className="flex-1 bg-[#a08560] border-4 border-[#6d5a43] relative overflow-hidden flex flex-col pixel-border pixel-corners">
                    {children}
                </div>
            </div>
        </div>
    );
}
