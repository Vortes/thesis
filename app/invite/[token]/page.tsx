import { prisma } from '@/lib/prisma';
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getRandomHauCharacter } from '@/lib/hau-characters';

interface InvitePageProps {
    params: Promise<{
        token: string;
    }>;
}

export default async function InvitePage({ params }: InvitePageProps) {
    const { token } = await params;
    const user = await currentUser();

    // 1. Validate Token
    const invitation = await prisma.invitation.findUnique({
        where: { token },
        include: { sender: true }
    });

    if (!invitation || invitation.status !== 'PENDING') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-red-600">Invalid Invitation</CardTitle>
                        <CardDescription>
                            This invitation is invalid, expired, or has already been used.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link href="/">
                            <Button className="w-full">Go Home</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // 2. If not logged in, redirect to sign up
    if (!user) {
        // In a real app, you'd pass the token to the sign-up flow to auto-accept after registration.
        // For MVP, we'll just redirect to sign-up and ask them to click the link again (or handle it via cookies/search params).
        // Let's redirect to sign-up with a redirect_url back to this page.
        return redirect(`/sign-up?redirect_url=/invite/${token}`);
    }

    // 3. If logged in, accept invite
    const recipientEmail = user.emailAddresses[0].emailAddress;

    // Verify the email matches (optional, but good for security if invites are email-specific)
    // For now, let's allow anyone with the link to accept if they are logged in,
    // OR enforce that the logged-in user's email matches the invite email.
    if (invitation.email !== recipientEmail) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-red-600">Email Mismatch</CardTitle>
                        <CardDescription>
                            This invitation was sent to {invitation.email}, but you are logged in as {recipientEmail}.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link href="/sign-out">
                            <Button variant="outline" className="w-full">
                                Sign Out & Switch Account
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Get recipient user ID
    const recipientUser = await prisma.user.findUnique({
        where: { email: recipientEmail }
    });

    if (!recipientUser) {
        // Should not happen if Clerk webhook worked
        return <div>Error: User record not found. Please contact support.</div>;
    }

    // Create Connection and Update Invitation atomically
    // Randomly assign a Hau character
    const hau = getRandomHauCharacter();

    await prisma.$transaction(async tx => {
        await tx.connection.create({
            data: {
                initiatorId: invitation.senderId,
                recipientId: recipientUser.id,
                status: 'ACCEPTED',
                messenger: {
                    create: {
                        name: hau.name,
                        skinId: hau.id,
                        currentHolderId: recipientUser.id, // Recipient holds first
                        revealedToInitiator: false,
                        revealedToRecipient: false
                    }
                }
            }
        });

        await tx.invitation.update({
            where: { id: invitation.id },
            data: { status: 'ACCEPTED' }
        });
    });

    // Redirect to dashboard
    redirect('/');
}
