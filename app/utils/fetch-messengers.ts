// TODO: users are getting user not found error bc this is called everywhere without type checking first

import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Character } from '@/lib/dashboard-data';
import { MessengerStatus } from '@prisma/client';

// Map MessengerStatus to Character status
function mapStatus(status: MessengerStatus): Character['status'] {
    switch (status) {
        case MessengerStatus.AVAILABLE:
            return 'Ready';
        case MessengerStatus.LOADING:
            return 'Loading';
        case MessengerStatus.IN_TRANSIT:
            return 'En Route';
        case MessengerStatus.WAITING:
            return 'Waiting';
        case MessengerStatus.RETURNING:
            return 'Returning';
        default:
            return 'Ready';
    }
}

export const fetchMessengers = async () => {
    const user = await currentUser();

    if (!user) {
        redirect('/sign-in');
    }

    const dbUser = await prisma.user.findUnique({
        where: { email: user.emailAddresses[0].emailAddress },
        include: {
            onboarding: true
        }
    });

    if (!dbUser) {
        console.error('User not found');
        return [];
    }

    // Fetch connections with messenger, both users, and current shipment
    const connections = await prisma.connection.findMany({
        where: {
            OR: [{ initiatorId: dbUser.id }, { recipientId: dbUser.id }],
            messenger: {
                isNot: null
            }
        },
        include: {
            messenger: {
                include: {
                    currentShipment: true
                }
            },
            initiator: true,
            recipient: true
        }
    });

    const characters: Character[] = connections
        .filter(c => c.messenger !== null)
        .map(c => {
            const m = c.messenger!;
            const friendId = c.initiatorId === dbUser.id ? c.recipientId : c.initiatorId;
            const friend = c.initiatorId === dbUser.id ? c.recipient : c.initiator;

            // Determine if current user can send with this messenger
            // They can send if messenger is AVAILABLE and either:
            // - currentHolderId is null (first time) or matches current user
            // - OR messenger has no currentHolderId set (initial state)
            const canSend =
                m.status === MessengerStatus.AVAILABLE &&
                (m.currentHolderId === null || m.currentHolderId === dbUser.id);

            // Determine coordinates based on messenger status
            let coords: { lng: number; lat: number };
            let destCoords: { lng: number; lat: number } | undefined;
            let originCoords: { lng: number; lat: number } | undefined;

            const shipment = m.currentShipment;

            switch (m.status) {
                case MessengerStatus.AVAILABLE:
                case MessengerStatus.LOADING:
                    // Messenger is at the current holder's location
                    // If no holder set, assume at current user or friend based on connection
                    if (m.currentHolderId === dbUser.id) {
                        coords = { lng: dbUser.longitude ?? 0, lat: dbUser.latitude ?? 0 };
                    } else if (m.currentHolderId === friendId) {
                        coords = { lng: friend.longitude ?? 0, lat: friend.latitude ?? 0 };
                    } else {
                        // Initial state: messenger at initiator's location
                        coords = { lng: c.initiator.longitude ?? 0, lat: c.initiator.latitude ?? 0 };
                    }
                    break;

                case MessengerStatus.IN_TRANSIT:
                    // Use shipment's origin/destination coordinates
                    if (shipment) {
                        originCoords = {
                            lng: shipment.originLng ?? 0,
                            lat: shipment.originLat ?? 0
                        };
                        destCoords = {
                            lng: shipment.destLng ?? 0,
                            lat: shipment.destLat ?? 0
                        };
                        // coords will be calculated on frontend based on progress
                        coords = originCoords;
                    } else {
                        coords = { lng: 0, lat: 0 };
                    }
                    break;

                case MessengerStatus.WAITING:
                    // Messenger is at recipient's location (destination)
                    if (shipment) {
                        coords = {
                            lng: shipment.destLng ?? 0,
                            lat: shipment.destLat ?? 0
                        };
                    } else {
                        coords = { lng: friend.longitude ?? 0, lat: friend.latitude ?? 0 };
                    }
                    break;

                case MessengerStatus.RETURNING:
                    // Messenger is returning from current position to origin
                    if (shipment) {
                        originCoords = {
                            lng: shipment.originLng ?? 0,
                            lat: shipment.originLat ?? 0
                        };
                        destCoords = originCoords; // Returning TO origin
                        // Current position calculated on frontend based on recall progress
                        coords = {
                            lng: shipment.destLng ?? 0,
                            lat: shipment.destLat ?? 0
                        };
                    } else {
                        coords = { lng: 0, lat: 0 };
                    }
                    break;

                default:
                    coords = { lng: 0, lat: 0 };
            }

            // Build shipment data for frontend progress calculation
            let shipmentData: Character['shipmentData'];
            if (shipment && (m.status === MessengerStatus.IN_TRANSIT || m.status === MessengerStatus.RETURNING)) {
                shipmentData = {
                    shipmentId: shipment.id,
                    dispatchedAt: shipment.dispatchedAt?.getTime() ?? Date.now(),
                    recalledAt: shipment.recalledAt?.getTime(),
                    distanceInKm: shipment.distanceInKm
                };
            }

            return {
                id: m.id,
                recipientId: friendId,
                name: m.name,
                status: mapStatus(m.status),
                destination: friend.first_name ?? 'Unknown',
                progress: 0, // Calculated on frontend
                color: '#fca5a5',
                skinId: m.skinId,
                coords,
                destCoords,
                originCoords,
                canSend,
                shipmentData,
                history: []
            } as Character;
        });

    return characters;
};
