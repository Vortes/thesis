
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Character } from "@/lib/dashboard-data";
import { Messenger } from "@prisma/client";

export const fetchMessengers = async () => {
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
     console.error("User not found");
     return [];
   }
   // Check if user has any messengers available
   const connections = await prisma.connection.findMany({
     where: {
       OR: [
         { initiatorId: dbUser.id },
         { recipientId: dbUser.id },
       ],
       messenger: {
         isNot: null,
       },
     },
     include: {
       messenger: true,
     },
   });
   
   const messengers = connections.map((c) => c.messenger);
 
     const haus: Character[] = messengers
       .filter((m): m is Messenger => m !== null)
       .map((m) => ({
         id: m.id,
         name: m.name,
         status: m.isBusy ? 'En Route' : 'Ready',
         destination: 'Unknown',
         progress: 0,
         color: '#fca5a5',
         coords: { x: 50, y: 50 },
         history: [],
       }));
    
if(!haus) {
    console.log("No messengers found");
    return [] as Character[];
}
    return haus;
}