import { PrismaClient, MessengerStatus } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const targetUserId = 'user_36V5TUZuhfeAtMHpkRE8PBVBOcV';

    console.log(`Seeding for user: ${targetUserId}`);

    // Upsert target user to ensure they exist (with coordinates)
    await prisma.user.upsert({
        where: { id: targetUserId },
        update: {
            latitude: 40.7128, // New York
            longitude: -74.006
        },
        create: {
            id: targetUserId,
            email: 'alan@test.com',
            first_name: 'Alan',
            last_name: 'Main',
            latitude: 40.7128,
            longitude: -74.006
        }
    });

    const friends = [
        { name: 'Alice', lat: 51.5074, lng: -0.1278 }, // London
        { name: 'Bob', lat: 48.8566, lng: 2.3522 }, // Paris
        { name: 'Charlie', lat: 35.6762, lng: 139.6503 }, // Tokyo
        { name: 'David', lat: -33.8688, lng: 151.2093 }, // Sydney
        { name: 'Eve', lat: 52.52, lng: 13.405 }, // Berlin
        { name: 'Frank', lat: 55.7558, lng: 37.6173 }, // Moscow
        { name: 'Grace', lat: 37.7749, lng: -122.4194 }, // San Francisco
        { name: 'Heidi', lat: 19.4326, lng: -99.1332 }, // Mexico City
        { name: 'Ivan', lat: -22.9068, lng: -43.1729 }, // Rio de Janeiro
        { name: 'Judy', lat: 1.3521, lng: 103.8198 } // Singapore
    ];

    for (const friend of friends) {
        const email = `${friend.name.toLowerCase()}@example.com`;

        // Create Friend with coordinates
        const friendUser = await prisma.user.upsert({
            where: { email },
            update: {
                latitude: friend.lat,
                longitude: friend.lng
            },
            create: {
                email,
                first_name: friend.name,
                last_name: 'Doe',
                latitude: friend.lat,
                longitude: friend.lng
            }
        });

        console.log(`Created user: ${friend.name} at (${friend.lat}, ${friend.lng})`);

        // Create Connection
        const existingConnection = await prisma.connection.findFirst({
            where: {
                OR: [
                    { initiatorId: targetUserId, recipientId: friendUser.id },
                    { initiatorId: friendUser.id, recipientId: targetUserId }
                ]
            }
        });

        let connection;
        if (!existingConnection) {
            connection = await prisma.connection.create({
                data: {
                    initiatorId: targetUserId,
                    recipientId: friendUser.id,
                    status: 'ACCEPTED'
                }
            });
            console.log(`Created connection with ${friend.name}`);
        } else {
            connection = existingConnection;
            console.log(`Connection with ${friend.name} already exists`);
        }

        // Create Messenger with new fields
        const existingMessenger = await prisma.messenger.findUnique({
            where: { connectionId: connection.id }
        });

        if (!existingMessenger) {
            await prisma.messenger.create({
                data: {
                    connectionId: connection.id,
                    name: `${friend.name}'s Messenger`,
                    skinId: 'default_messenger',
                    status: MessengerStatus.AVAILABLE,
                    // Messenger starts with the initiator (targetUser)
                    currentHolderId: targetUserId
                }
            });
            console.log(`Created messenger for ${friend.name} (holder: targetUser)`);
        } else {
            // Update existing messenger with new fields if needed
            await prisma.messenger.update({
                where: { id: existingMessenger.id },
                data: {
                    status: MessengerStatus.AVAILABLE,
                    currentHolderId: existingMessenger.currentHolderId ?? targetUserId
                }
            });
            console.log(`Updated messenger for ${friend.name}`);
        }
    }

    console.log('Seeding complete!');
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
