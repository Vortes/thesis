import type { Metadata } from 'next';
import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { OnboardingGuard } from '@/components/onboarding-guard';

export const metadata: Metadata = {
    title: 'My App',
    description: 'Created with Next.js'
};

import Providers from '@/components/providers';

export default async function RootLayout({
    children
}: Readonly<{
    children: React.ReactNode;
}>) {
    const { userId } = await auth();
    let isOnboarded = false;

    if (userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { onboarding: { select: { completed: true } } }
        });
        isOnboarded = user?.onboarding?.completed ?? false;
    }

    return (
        <ClerkProvider>
            <html lang="en">
                <body className={`antialiased`}>
                    <Providers>
                        <OnboardingGuard isLoggedIn={!!userId} isOnboarded={isOnboarded}>
                            {children}
                        </OnboardingGuard>
                    </Providers>
                </body>
            </html>
        </ClerkProvider>
    );
}
