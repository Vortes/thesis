"use server";

import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function updateUserLocation(latitude: number, longitude: number) {
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

  await prisma.user.update({
    where: { id: dbUser.id },
    data: {
      latitude,
      longitude,
    },
  });
}
