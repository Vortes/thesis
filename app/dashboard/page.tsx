import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const user = await currentUser();
  
  if (!user) {
    return <div>Please sign in</div>;
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: user.emailAddresses[0].emailAddress },
    include: {
      connectionsAsInitiator: { include: { messenger: true, recipient: true, initiator: true } },
      connectionsAsReceiver: { include: { messenger: true, initiator: true, recipient: true } },
    },
  });

  if (!dbUser) {
    return <div>User not found in database</div>;
  }

  const connections = [
    ...dbUser.connectionsAsInitiator,
    ...dbUser.connectionsAsReceiver,
  ];

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {connections.length === 0 ? (
          <p>No connections yet.</p>
        ) : (
          connections.map((conn) => (
            <Card key={conn.id}>
              <CardHeader>
                <CardTitle>
                  {conn.messenger?.name || "Messenger"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>Status: {conn.status}</p>
                <p>With: {conn.initiatorId === dbUser.id ? conn.recipient.first_name : conn.initiator.first_name}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
