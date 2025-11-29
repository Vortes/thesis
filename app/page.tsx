import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Dashboard from "@/components/dashboard/Dashboard";

export default async function Home() {
  const user = await currentUser();
  
  if (!user) {
    redirect("/sign-in");
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: user.emailAddresses[0].emailAddress },
    include: {
      onboarding: true,
    },
  });

  if (!dbUser) {
    // Should handle this case better, maybe redirect to sign-in or show error
    return <div>User not found</div>;
  }

  // Check onboarding status
  if (!dbUser.onboarding?.completed) {
    redirect("/onboarding");
  }

  return <Dashboard />;
}
