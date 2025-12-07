'use client';

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import * as turf from '@turf/turf';
import { Character } from '@/lib/dashboard-data';
import { useRouter } from 'next/navigation';
import { Progress } from '@/components/ui/progress';
import 'mapbox-gl/dist/mapbox-gl.css';

// Set Mapbox access token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

interface MapProps {
    selectedChar: Character | null;
    characters?: Character[];
    onSelectChar?: (char: Character) => void;
}

// Retro map style with muted colors matching the app's pixel aesthetic
const RETRO_MAP_STYLE: mapboxgl.Style = {
    version: 8,
    name: 'Retro Pixel Style',
    sources: {
        'osm-tiles': {
            type: 'raster',
            tiles: [
                'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
                'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
                'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
            ],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors'
        }
    },
    layers: [
        {
            id: 'background',
            type: 'background',
            paint: {
                'background-color': '#e0d5c1' // --pixel-card
            }
        },
        {
            id: 'osm-tiles-layer',
            type: 'raster',
            source: 'osm-tiles',
            paint: {
                'raster-saturation': -0.7, // Desaturate for retro feel
                'raster-brightness-min': 0.1,
                'raster-brightness-max': 0.9,
                'raster-contrast': 0.1,
                'raster-hue-rotate': 30 // Warm sepia shift
            }
        }
    ]
};

// Generate a bezier curve path between two points
function generateBezierPath(start: [number, number], end: [number, number]): GeoJSON.Feature<GeoJSON.LineString> {
    // Create control points for a nice arc
    const midLng = (start[0] + end[0]) / 2;
    const midLat = (start[1] + end[1]) / 2;

    // Offset the midpoint to create a curve
    const distance = turf.distance(turf.point(start), turf.point(end));
    const bearing = turf.bearing(turf.point(start), turf.point(end));

    // Create a control point perpendicular to the line
    const controlPoint = turf.destination(turf.point([midLng, midLat]), distance * 0.2, bearing + 90);

    // Create a line with the control point for the bezier
    const line = turf.lineString([start, controlPoint.geometry.coordinates as [number, number], end]);

    // Create bezier curve
    const bezier = turf.bezierSpline(line, { resolution: 50 });
    return bezier;
}

// Get position along a path based on progress (0-100)
function getPositionAlongPath(path: GeoJSON.Feature<GeoJSON.LineString>, progress: number): [number, number] {
    const length = turf.length(path);
    const distance = (progress / 100) * length;
    const point = turf.along(path, distance);
    return point.geometry.coordinates as [number, number];
}

export const Map: React.FC<MapProps> = ({ selectedChar, characters = [], onSelectChar }) => {
    const router = useRouter();
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const markersRef = useRef<globalThis.Map<string | number, mapboxgl.Marker>>(new globalThis.Map());
    const pathsRef = useRef(new globalThis.Map<string | number, GeoJSON.Feature<GeoJSON.LineString>>());
    const animationRef = useRef<number | undefined>(undefined);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [currentETA, setCurrentETA] = useState<string | null>(null);

    // Travel time: 1km = 1 minute (60000ms)
    const TRAVEL_SPEED_MS_PER_KM = 3000;

    // Calculate ETA (remaining time in ms) for a character
    const calculateETA = (char: Character): number | null => {
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

    // Format milliseconds to human-readable time (e.g., "5m 30s" or "2h 15m")
    const formatETA = (ms: number): string => {
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

    // Initialize map
    useEffect(() => {
        if (!mapContainer.current || map.current) return;

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: RETRO_MAP_STYLE,
            center: [0, 20], // Default center
            zoom: 1.5,
            attributionControl: false
        });

        map.current.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right');

        map.current.on('load', () => {
            setMapLoaded(true);
        });

        return () => {
            map.current?.remove();
            map.current = null;
        };
    }, []);

    // Update markers when characters change
    useEffect(() => {
        if (!map.current || !mapLoaded) return;

        // Clear old markers
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current.clear();

        // Remove old path layers
        characters.forEach(char => {
            const sourceId = `path-${char.id}`;
            if (map.current?.getSource(sourceId)) {
                map.current.removeLayer(`${sourceId}-line`);
                map.current.removeSource(sourceId);
            }
        });

        // Add markers and paths for each character
        characters.forEach(char => {
            // Determine if this character is moving (needs animation)
            const isMoving = char.status === 'En Route' || char.status === 'Returning';

            // Calculate initial marker position
            let markerCoords: [number, number];

            if (isMoving && char.originCoords && char.destCoords) {
                const startCoords: [number, number] = [char.originCoords.lng, char.originCoords.lat];
                const endCoords: [number, number] = [char.destCoords.lng, char.destCoords.lat];

                // Generate and draw the path
                const path = generateBezierPath(startCoords, endCoords);
                pathsRef.current.set(char.id, path);
                const sourceId = `path-${char.id}`;

                if (!map.current?.getSource(sourceId)) {
                    map.current?.addSource(sourceId, {
                        type: 'geojson',
                        data: path
                    });

                    map.current?.addLayer({
                        id: `${sourceId}-line`,
                        type: 'line',
                        source: sourceId,
                        paint: {
                            'line-color': char.status === 'Returning' ? '#fbbf24' : char.color,
                            'line-width': 3,
                            'line-dasharray': [2, 2],
                            'line-opacity': 0.7
                        }
                    });
                }

                // Calculate initial progress
                const progress = calculateProgress(char);
                markerCoords = getPositionAlongPath(path, progress);
            } else {
                markerCoords = [char.coords.lng, char.coords.lat];
            }

            // Create custom marker element
            const markerEl = document.createElement('div');
            markerEl.className = 'messenger-marker';
            markerEl.innerHTML = `
                <div class="relative cursor-pointer group">
                    ${
                        char.status === 'Ready' || char.status === 'Waiting'
                            ? `
                        <div class="absolute -top-6 left-1/2 -translate-x-1/2 animate-bounce">
                            <div class="bg-${
                                char.status === 'Waiting' ? 'yellow' : 'red'
                            }-500 text-white font-pixel text-[10px] w-4 h-4 flex items-center justify-center" style="box-shadow: -2px 0 0 0 black, 2px 0 0 0 black, 0 -2px 0 0 black, 0 2px 0 0 black;">${
                                  char.status === 'Waiting' ? '?' : '!'
                              }</div>
                        </div>
                    `
                            : ''
                    }
                    ${
                        char.status === 'En Route' || char.status === 'Returning'
                            ? `
                        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 ${
                            char.status === 'Returning' ? 'bg-yellow-400' : 'bg-white'
                        } rounded-full animate-ping opacity-50 -z-10"></div>
                    `
                            : ''
                    }
                    <div class="w-10 h-10 bg-white p-1 relative z-10 transition-transform duration-200 hover:scale-110" style="box-shadow: -2px 0 0 0 black, 2px 0 0 0 black, 0 -2px 0 0 black, 0 2px 0 0 black;">
                        <div class="w-full h-full relative" style="background-color: ${char.color};">
                            <div class="absolute top-3 left-2 w-1 h-2 bg-black"></div>
                            <div class="absolute top-3 right-2 w-1 h-2 bg-black"></div>
                        </div>
                    </div>
                    <div class="w-0.5 h-4 bg-black mx-auto"></div>
                    <div class="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-black text-white px-2 py-1 font-pixel text-[8px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20" style="box-shadow: -2px 0 0 0 black, 2px 0 0 0 black, 0 -2px 0 0 black, 0 2px 0 0 black;">
                        ${char.name} (${char.status})
                    </div>
                </div>
            `;

            markerEl.addEventListener('click', () => {
                if (onSelectChar) {
                    onSelectChar(char);
                } else {
                    // Default behavior: navigate to select this character
                    router.push(`/?charId=${char.id}`);
                }
            });

            const marker = new mapboxgl.Marker({
                element: markerEl,
                anchor: 'bottom'
            })
                .setLngLat(markerCoords)
                .addTo(map.current!);

            markersRef.current.set(char.id, marker);
        });

        // Fit map to show all markers
        if (characters.length > 0) {
            const bounds = new mapboxgl.LngLatBounds();
            characters.forEach(char => {
                bounds.extend([char.coords.lng, char.coords.lat]);
                if (char.destCoords) {
                    bounds.extend([char.destCoords.lng, char.destCoords.lat]);
                }
            });
            map.current?.fitBounds(bounds, { padding: 80, maxZoom: 4 });
        }
    }, [characters, mapLoaded, onSelectChar, router]);

    // Calculate progress based on shipment data
    const calculateProgress = (char: Character): number => {
        if (!char.shipmentData) return 0;

        const { dispatchedAt, recalledAt, distanceInKm } = char.shipmentData;
        const travelTimeMs = (distanceInKm ?? 1000) * TRAVEL_SPEED_MS_PER_KM;

        if (char.status === 'Returning' && recalledAt) {
            // Return trip is 1/4 of time already traveled
            const timeOutMs = recalledAt - dispatchedAt;
            const returnTimeMs = timeOutMs / 4;
            const returnElapsedMs = Date.now() - recalledAt;
            // Progress inverts (100% at recall point, 0% at origin)
            const progressOut = Math.min(100, (timeOutMs / travelTimeMs) * 100);
            const returnProgress = Math.min(100, (returnElapsedMs / returnTimeMs) * 100);
            return Math.max(0, progressOut * (1 - returnProgress / 100));
        } else {
            // Normal transit
            const elapsedMs = Date.now() - dispatchedAt;
            return Math.min(100, (elapsedMs / travelTimeMs) * 100);
        }
    };

    // Animation loop for moving markers
    useEffect(() => {
        if (!mapLoaded) return;

        const animate = () => {
            characters.forEach(char => {
                const isMoving = char.status === 'En Route' || char.status === 'Returning';
                if (!isMoving || !char.shipmentData) return;

                const marker = markersRef.current.get(char.id);
                const path = pathsRef.current.get(char.id);
                if (!marker || !path) return;

                const progress = calculateProgress(char);
                const newPos = getPositionAlongPath(path, progress);
                marker.setLngLat(newPos);
            });

            animationRef.current = requestAnimationFrame(animate);
        };

        animate();
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [characters, mapLoaded]);

    // Pan to selected character
    useEffect(() => {
        if (!map.current || !selectedChar || !mapLoaded) return;

        map.current.flyTo({
            center: [selectedChar.coords.lng, selectedChar.coords.lat],
            zoom: 4,
            duration: 1000
        });
    }, [selectedChar, mapLoaded]);

    // Update ETA for selected character
    useEffect(() => {
        if (!selectedChar) {
            setCurrentETA(null);
            return;
        }

        const isMoving = selectedChar.status === 'En Route' || selectedChar.status === 'Returning';
        if (!isMoving) {
            setCurrentETA(null);
            return;
        }

        // Update ETA immediately and then every second
        const updateETA = () => {
            const eta = calculateETA(selectedChar);
            setCurrentETA(eta !== null ? formatETA(eta) : null);
        };

        updateETA();
        const interval = setInterval(updateETA, 1000);

        return () => clearInterval(interval);
    }, [selectedChar]);

    return (
        <div className="absolute inset-0 bg-[#e5e7eb] flex flex-col animate-in fade-in duration-300">
            {/* Map Container */}
            <div ref={mapContainer} className="flex-1 relative overflow-hidden">
                {/* Map Label Overlay */}
                <div className="absolute top-4 left-4 bg-white/80 p-2 pixel-border-sm z-20 pointer-events-none">
                    <div className="font-pixel text-[8px] text-gray-500">GLOBAL MAP</div>
                </div>
            </div>

            {/* Selected Character Detail Panel (Bottom Overlay) */}
            {selectedChar && (
                <div className="bg-white p-4 border-t-4 border-[#6d5a43] flex items-center gap-4 animate-in slide-in-from-bottom duration-300">
                    <div
                        className="w-16 h-16 border-2 border-black relative"
                        style={{ backgroundColor: selectedChar.color }}
                    >
                        <div className="absolute top-4 left-2 w-2 h-4 bg-black"></div>
                        <div className="absolute top-4 right-2 w-2 h-4 bg-black"></div>
                    </div>
                    <div className="flex-1">
                        <h3 className="font-pixel text-sm flex items-center gap-2">
                            {selectedChar.name}
                            {selectedChar.status === 'Ready' && (
                                <span className="bg-red-500 text-white text-[8px] px-1 py-0.5 rounded">READY!</span>
                            )}
                        </h3>
                        <p className="font-handheld text-lg text-gray-600">
                            {selectedChar.status === 'Ready'
                                ? 'Waiting for orders at base.'
                                : selectedChar.status === 'Waiting'
                                ? 'Waiting for a reply...'
                                : `Currently traveling to ${selectedChar.destination}.`}
                        </p>
                        {/* ETA Display */}
                        {currentETA && (selectedChar.status === 'En Route' || selectedChar.status === 'Returning') && (
                            <div className="flex items-center gap-2 mt-1">
                                <span className="font-pixel text-[10px] text-gray-500">ETA:</span>
                                <span className="font-pixel text-[10px] text-pixel-accent">{currentETA}</span>
                            </div>
                        )}
                        {selectedChar.status !== 'Ready' && (
                            <Progress
                                value={selectedChar.progress}
                                className="mt-2 h-2 bg-gray-200 border border-gray-400"
                            />
                        )}
                    </div>

                    {/* Action Button */}
                    <button
                        onClick={() => router.push(`/${selectedChar.id}/history`)}
                        className="bg-gray-200 text-gray-600 px-4 py-2 font-pixel text-[10px] pixel-border-sm hover:bg-gray-300 hover:cursor-pointer"
                    >
                        VIEW HISTORY
                    </button>
                    {selectedChar.canSend && (
                        <button
                            onClick={() => router.push(`/${selectedChar.id}/compose`)}
                            className="bg-[#ef4444] text-white px-4 py-2 font-pixel text-[10px] pixel-border-sm animate-bounce-sm hover:cursor-pointer hover:bg-[#ef2222]"
                        >
                            CREATE GIFT
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};
