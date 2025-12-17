'use client';

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { Character } from '@/lib/dashboard-data';
import { getPositionAlongPath, calculateETA, formatETA, calculateProgress, updateRouteStyles } from './utils/mapUtils';
import { useRouter } from 'next/navigation';
import { Progress } from '@/components/ui/progress';
import 'mapbox-gl/dist/mapbox-gl.css';
import greatCircle from '@turf/great-circle';

// Set Mapbox access token
if (!process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
    throw new Error('Missing Mapbox access token');
}
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

interface MapProps {
    selectedChar: Character | null;
    characters?: Character[];
    onSelectChar?: (char: Character) => void;
}

export const Map: React.FC<MapProps> = ({ selectedChar, characters = [], onSelectChar }) => {
    const router = useRouter();
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const markersRef = useRef<globalThis.Map<string | number, mapboxgl.Marker>>(new globalThis.Map());
    const pathsRef = useRef(
        new globalThis.Map<string | number, GeoJSON.Feature<GeoJSON.LineString | GeoJSON.MultiLineString>>()
    );
    const animationRef = useRef<number | undefined>(undefined);
    const charactersRef = useRef(characters);
    const eventHandlersRef = useRef<
        globalThis.Map<string, { mouseenter: () => void; mouseleave: () => void; click: () => void }>
    >(new globalThis.Map());

    // Keep characters ref in sync with props (no Effect needed - refs don't trigger re-renders)
    charactersRef.current = characters;

    const [mapLoaded, setMapLoaded] = useState(false);
    const [currentETA, setCurrentETA] = useState<string | null>(null);
    const [currentProgress, setCurrentProgress] = useState<number>(0);
    const [hoveredCharId, setHoveredCharId] = useState<string | number | null>(null);

    // Initialize map
    useEffect(() => {
        if (!mapContainer.current || map.current) return;

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            center: [0, 20], // Default center
            zoom: 1.5,
            attributionControl: false,
            projection: 'globe' as any // Use globe projection
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

        // Clear old markers and paths
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current.clear();
        pathsRef.current.clear();

        // Clean up event handlers and remove old path layers
        characters.forEach(char => {
            const sourceId = `path-${char.id}`;
            const hitAreaId = `${sourceId}-hitarea`;

            // Remove event listeners using stored handlers
            const handlers = eventHandlersRef.current.get(hitAreaId);
            if (handlers && map.current) {
                map.current.off('mouseenter', hitAreaId, handlers.mouseenter);
                map.current.off('mouseleave', hitAreaId, handlers.mouseleave);
                map.current.off('click', hitAreaId, handlers.click);
                eventHandlersRef.current.delete(hitAreaId);
            }

            if (map.current?.getSource(sourceId)) {
                if (map.current.getLayer(hitAreaId)) {
                    map.current.removeLayer(hitAreaId);
                }
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

                // Generate the path - this is the SAME path used for both visual and animation
                // Generate great circle arc with many points so marker follows the curved path
                const path = greatCircle(startCoords, endCoords, { npoints: 100 });
                pathsRef.current.set(char.id, path);
                const sourceId = `path-${char.id}`;

                const existingSource = map.current?.getSource(sourceId) as mapboxgl.GeoJSONSource | undefined;

                if (existingSource) {
                    // Update existing source with new path data to keep visual and animation in sync
                    existingSource.setData(path);
                } else {
                    // Create new source and layer
                    map.current?.addSource(sourceId, {
                        type: 'geojson',
                        data: path
                    });

                    map.current?.addLayer({
                        id: `${sourceId}-line`,
                        type: 'line',
                        source: sourceId,
                        paint: {
                            'line-color': char.status === 'Returning' ? '#fbbf24' : '#007cbf',
                            'line-width': 2,
                            'line-emissive-strength': 1
                        }
                    });

                    // Add invisible wider hit-area layer for easier hover/click
                    map.current?.addLayer({
                        id: `${sourceId}-hitarea`,
                        type: 'line',
                        source: sourceId,
                        paint: {
                            'line-color': 'transparent',
                            'line-width': 20,
                            'line-opacity': 0
                        }
                    });

                    const hitAreaId = `${sourceId}-hitarea`;

                    // Create named handlers for proper cleanup
                    const handleMouseEnter = () => {
                        if (map.current) {
                            map.current.getCanvas().style.cursor = 'pointer';
                        }
                        setHoveredCharId(char.id);
                        updateRouteStyles(map.current, charactersRef.current, char.id, selectedChar?.id);
                    };

                    const handleMouseLeave = () => {
                        if (map.current) {
                            map.current.getCanvas().style.cursor = '';
                        }
                        setHoveredCharId(null);
                        updateRouteStyles(map.current, charactersRef.current, null, selectedChar?.id);
                    };

                    const handleClick = () => {
                        if (onSelectChar) {
                            onSelectChar(char);
                        } else {
                            router.push(`/?charId=${char.id}`);
                        }
                    };

                    // Store handlers for cleanup
                    eventHandlersRef.current.set(hitAreaId, {
                        mouseenter: handleMouseEnter,
                        mouseleave: handleMouseLeave,
                        click: handleClick
                    });

                    // Add event listeners
                    map.current?.on('mouseenter', hitAreaId, handleMouseEnter);
                    map.current?.on('mouseleave', hitAreaId, handleMouseLeave);
                    map.current?.on('click', hitAreaId, handleClick);
                }

                // Calculate initial progress and position along the SAME path
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

            // Add hover event listeners for route highlighting
            markerEl.addEventListener('mouseenter', () => {
                setHoveredCharId(char.id);
                updateRouteStyles(map.current, charactersRef.current, char.id, selectedChar?.id);
            });

            markerEl.addEventListener('mouseleave', () => {
                setHoveredCharId(null);
                updateRouteStyles(map.current, charactersRef.current, null, selectedChar?.id);
            });

            const marker = new mapboxgl.Marker({
                element: markerEl,
                anchor: 'bottom'
            })
                .setLngLat(markerCoords)
                .addTo(map.current!);

            markersRef.current.set(char.id, marker);
        });
    }, [characters, mapLoaded, onSelectChar, router]);

    // Animation loop for moving markers
    useEffect(() => {
        const animate = () => {
            charactersRef.current.forEach(char => {
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
    }, []);

    // Pan to selected character
    useEffect(() => {
        if (!map.current || !selectedChar || !mapLoaded) return;

        let targetCenter: [number, number] = [selectedChar.coords.lng, selectedChar.coords.lat];
        const isMoving = selectedChar.status === 'En Route' || selectedChar.status === 'Returning';

        // If character is moving, calculate their current position
        if (isMoving && selectedChar.shipmentData && selectedChar.originCoords && selectedChar.destCoords) {
            let path = pathsRef.current.get(selectedChar.id);

            // Fallback: generate path if it doesn't exist in ref yet
            if (!path) {
                const startCoords: [number, number] = [selectedChar.originCoords.lng, selectedChar.originCoords.lat];
                const endCoords: [number, number] = [selectedChar.destCoords.lng, selectedChar.destCoords.lat];
                path = greatCircle(startCoords, endCoords, { npoints: 100 });
            }

            if (path) {
                const progress = calculateProgress(selectedChar);
                targetCenter = getPositionAlongPath(path, progress);
            }
        }

        map.current.flyTo({
            center: targetCenter,
            zoom: 8,
            duration: 1000
        });
    }, [selectedChar, mapLoaded]);

    // Update route styles when selected character changes
    useEffect(() => {
        if (!map.current || !mapLoaded) return;
        updateRouteStyles(map.current, charactersRef.current, hoveredCharId, selectedChar?.id);
    }, [selectedChar?.id, mapLoaded, hoveredCharId]);

    // Update ETA and progress for selected character (client-side only to avoid hydration mismatch)
    useEffect(() => {
        if (!selectedChar) {
            setCurrentETA(null);
            setCurrentProgress(0);
            return;
        }

        const isMoving = selectedChar.status === 'En Route' || selectedChar.status === 'Returning';

        // Update progress and ETA immediately and then every second
        const update = () => {
            setCurrentProgress(calculateProgress(selectedChar));
            if (isMoving) {
                const eta = calculateETA(selectedChar);
                setCurrentETA(eta !== null ? formatETA(eta) : null);
            } else {
                setCurrentETA(null);
            }
        };

        update();
        const interval = setInterval(update, 1000);

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
                            <Progress value={currentProgress} className="mt-2 h-2 bg-gray-200 border border-gray-400" />
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
