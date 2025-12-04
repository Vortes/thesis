import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const targetUserId = 'user_3675PFptgQz7QtUsJcGUorUR4qL';

    console.log(`Seeding for user: ${targetUserId}`);

    // Upsert target user to ensure they exist
    await prisma.user.upsert({
        where: { id: targetUserId },
        update: {},
        create: {
            id: targetUserId,
            email: 'alan@test.com',
            first_name: 'Alan',
            last_name: 'Main'
        }
    });

    const names = ['Alice', 'Bob', 'Charlie', 'David', 'Eve', 'Frank', 'Grace', 'Heidi', 'Ivan', 'Judy'];

    for (let i = 0; i < 10; i++) {
        const firstName = names[i];
        const email = `${firstName.toLowerCase()}@example.com`;

        // Create Friend
        const friend = await prisma.user.upsert({
            where: { email },
            update: {},
            create: {
                email,
                first_name: firstName,
                last_name: 'Doe'
            }
        });

        console.log(`Created user: ${firstName}`);

        // Create Connection
        // Check if connection exists first to avoid unique constraint error
        const existingConnection = await prisma.connection.findFirst({
            where: {
                OR: [
                    { initiatorId: targetUserId, recipientId: friend.id },
                    { initiatorId: friend.id, recipientId: targetUserId }
                ]
            }
        });

        let connection;
        if (!existingConnection) {
            connection = await prisma.connection.create({
                data: {
                    initiatorId: targetUserId,
                    recipientId: friend.id,
                    status: 'ACCEPTED'
                }
            });
            console.log(`Created connection with ${firstName}`);
        } else {
            connection = existingConnection;
            console.log(`Connection with ${firstName} already exists`);
        }

        // Create Messenger
        const existingMessenger = await prisma.messenger.findUnique({
            where: { connectionId: connection.id }
        });

        if (!existingMessenger) {
            await prisma.messenger.create({
                data: {
                    connectionId: connection.id,
                    name: `${firstName}'s Messenger`,
                    skinId: 'default_messenger'
                }
            });
            console.log(`Created messenger for ${firstName}`);
        } else {
            console.log(`Messenger for ${firstName} already exists`);
        }
    }
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async e => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
