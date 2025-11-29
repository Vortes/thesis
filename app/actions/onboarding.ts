"use server";

import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function completeOnboarding() {
  const user = await currentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: user.emailAddresses[0].emailAddress },
  });

  if (!dbUser) {
    throw new Error("User not found");
  }

  await prisma.onboarding.upsert({
    where: { userId: dbUser.id },
    update: { completed: true },
    create: {
      userId: dbUser.id,
      completed: true,
    },
  });

  revalidatePath("/");
}
