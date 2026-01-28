'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function OnboardingGuard({
    children,
    isOnboarded,
    isLoggedIn
}: {
    children: React.ReactNode;
    isOnboarded: boolean;
    isLoggedIn: boolean;
}) {
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        // If not logged in, or already onboarded, no need to redirect
        if (!isLoggedIn || isOnboarded) return;

        // Allowed paths while not onboarded
        const allowedPaths = ['/onboarding', '/sign-in', '/sign-up', '/invite'];
        const isAllowed = allowedPaths.some(path => pathname?.startsWith(path));

        if (!isAllowed) {
            router.push('/onboarding');
        }
    }, [pathname, isOnboarded, isLoggedIn, router]);

    // Prevent flash of content for non-onboarded users on protected routes
    if (isLoggedIn && !isOnboarded) {
        const allowedPaths = ['/onboarding', '/sign-in', '/sign-up', '/invite'];
        const isAllowed = allowedPaths.some(path => pathname?.startsWith(path));
        if (!isAllowed) {
            return null;
        }
    }

    return <>{children}</>;
}
