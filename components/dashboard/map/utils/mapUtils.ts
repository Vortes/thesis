import { Character } from '@/lib/dashboard-data';
import along from '@turf/along';
import length from '@turf/length';

const TRAVEL_SPEED_MS_PER_KM = 1000;

/**
 * Get position along a path based on progress (0-100)
 * Uses Turf's along() to interpolate the exact position on the path
 * Handles both LineString and MultiLineString (for paths crossing antimeridian)
 */
export function getPositionAlongPath(
    path: GeoJSON.Feature<GeoJSON.LineString | GeoJSON.MultiLineString>,
    progress: number
): [number, number] {
    const clampedProgress = Math.max(0, Math.min(100, progress));

    // Handle MultiLineString by using the first segment (most common case)
    let lineStringPath: GeoJSON.Feature<GeoJSON.LineString>;
    if (path.geometry.type === 'MultiLineString') {
        // Flatten MultiLineString coordinates into a single LineString
        const allCoords = path.geometry.coordinates.flat();
        lineStringPath = {
            type: 'Feature',
            properties: path.properties,
            geometry: {
                type: 'LineString',
                coordinates: allCoords
            }
        };
    } else {
        lineStringPath = path as GeoJSON.Feature<GeoJSON.LineString>;
    }

    const totalLength = length(lineStringPath, { units: 'kilometers' });
    const distanceAlong = (clampedProgress / 100) * totalLength;
    const point = along(lineStringPath, distanceAlong, { units: 'kilometers' });
    return point.geometry.coordinates as [number, number];
}

/**
 * Calculate ETA (remaining time in ms) for a character
 */
export const calculateETA = (char: Character): number | null => {
    if (!char.shipmentData) return null;
    if (char.status !== 'En Route' && char.status !== 'Returning') return null;

    const { dispatchedAt, recalledAt, distanceInKm } = char.shipmentData;
    const travelTimeMs = (distanceInKm ?? 1000) * TRAVEL_SPEED_MS_PER_KM;
    const now = Date.now();

    if (char.status === 'Returning' && recalledAt) {
        // Return trip is 1/4 of time already traveled
        const timeOutMs = recalledAt - dispatchedAt;
        const returnTimeMs = timeOutMs / 4;
        const returnEndTime = recalledAt + returnTimeMs;
        return Math.max(0, returnEndTime - now);
    } else {
        // Normal transit
        const arrivalTime = dispatchedAt + travelTimeMs;
        return Math.max(0, arrivalTime - now);
    }
};

/**
 * Format milliseconds to human-readable time (e.g., "5m 30s" or "2h 15m")
 */
export const formatETA = (ms: number): string => {
    if (ms <= 0) return 'Arriving...';

    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
        const remainingHours = hours % 24;
        return `${days}d ${remainingHours}h`;
    } else if (hours > 0) {
        const remainingMinutes = minutes % 60;
        return `${hours}h ${remainingMinutes}m`;
    } else if (minutes > 0) {
        const remainingSeconds = seconds % 60;
        return `${minutes}m ${remainingSeconds}s`;
    } else {
        return `${seconds}s`;
    }
};

/**
 * Calculate progress based on shipment data
 */
export const calculateProgress = (char: Character): number => {
    if (!char.shipmentData) return 0;

    const { dispatchedAt, recalledAt, distanceInKm } = char.shipmentData;
    const travelTimeMs = (distanceInKm ?? 1000) * TRAVEL_SPEED_MS_PER_KM;

    if (char.status === 'Returning' && recalledAt) {
        // Return trip: progress goes from 0% (at recall point/dest) to 100% (at origin)
        const timeOutMs = recalledAt - dispatchedAt;
        const returnTimeMs = timeOutMs / 4; // Return takes 1/4 of the outbound time
        const returnElapsedMs = Date.now() - recalledAt;
        return Math.min(100, Math.max(0, (returnElapsedMs / returnTimeMs) * 100));
    } else {
        // Normal transit: 0% at origin, 100% at destination
        const elapsedMs = Date.now() - dispatchedAt;
        return Math.min(100, (elapsedMs / travelTimeMs) * 100);
    }
};
