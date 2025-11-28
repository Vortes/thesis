import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { sendInviteEmail } from "@/lib/mail";
import { randomBytes } from "crypto";

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get the user from our DB to get their ID
    const dbUser = await prisma.user.findUnique({
      where: { email: user.emailAddresses[0].emailAddress },
    });

    if (!dbUser) {
      return new NextResponse("User not found", { status: 404 });
    }

    const { email } = await req.json();

    if (!email) {
      return new NextResponse("Email is required", { status: 400 });
    }

    // Check if invite already exists
    const existingInvite = await prisma.invitation.findUnique({
      where: {
        email_senderId: {
          email,
          senderId: dbUser.id,
        },
      },
    });

    if (existingInvite) {
      return new NextResponse("Invitation already sent", { status: 409 });
    }

    // Generate token
    const token = randomBytes(32).toString("hex");

    // Create invitation
    const invitation = await prisma.invitation.create({
      data: {
        email,
        token,
        senderId: dbUser.id,
      },
    });

    // Send email
    const emailResult = await sendInviteEmail(email, token);

    if (!emailResult.success) {
      // Rollback invitation if email fails? Or just return error?
      // For now, let's keep the invitation but return error so user can retry
      return new NextResponse("Failed to send email", { status: 500 });
    }

    return NextResponse.json(invitation);
  } catch (error) {
    console.error("[INVITE_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
