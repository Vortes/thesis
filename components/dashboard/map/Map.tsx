'use client';

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import * as turf from '@turf/turf';
import { Character } from '@/lib/dashboard-data';
import { useRouter } from 'next/navigation';
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
    const [mapLoaded, setMapLoaded] = useState(false);

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
            // For "En Route" characters, calculate position along path
            let markerCoords: [number, number];

            if (char.status === 'En Route' && char.destCoords) {
                const startCoords: [number, number] = [char.coords.lng, char.coords.lat];
                const endCoords: [number, number] = [char.destCoords.lng, char.destCoords.lat];

                // Generate and draw the path
                const path = generateBezierPath(startCoords, endCoords);
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
                            'line-color': char.color,
                            'line-width': 3,
                            'line-dasharray': [2, 2],
                            'line-opacity': 0.7
                        }
                    });
                }

                // Get position along path based on progress
                markerCoords = getPositionAlongPath(path, char.progress);
            } else {
                markerCoords = [char.coords.lng, char.coords.lat];
            }

            // Create custom marker element
            const markerEl = document.createElement('div');
            markerEl.className = 'messenger-marker';
            markerEl.innerHTML = `
                <div class="relative cursor-pointer group">
                    ${
                        char.status === 'Ready'
                            ? `
                        <div class="absolute -top-6 left-1/2 -translate-x-1/2 animate-bounce">
                            <div class="bg-red-500 text-white font-pixel text-[10px] w-4 h-4 flex items-center justify-center" style="box-shadow: -2px 0 0 0 black, 2px 0 0 0 black, 0 -2px 0 0 black, 0 2px 0 0 black;">!</div>
                        </div>
                    `
                            : ''
                    }
                    ${
                        char.status === 'En Route'
                            ? `
                        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full animate-ping opacity-50 -z-10"></div>
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
                onSelectChar?.(char);
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
    }, [characters, mapLoaded, onSelectChar]);

    // Pan to selected character
    useEffect(() => {
        if (!map.current || !selectedChar || !mapLoaded) return;

        map.current.flyTo({
            center: [selectedChar.coords.lng, selectedChar.coords.lat],
            zoom: 4,
            duration: 1000
        });
    }, [selectedChar, mapLoaded]);

    return (
        <div className="absolute inset-0 bg-[#e5e7eb] flex flex-col animate-in fade-in duration-300">
            {/* Map Container */}
            <div ref={mapContainer} className="flex-1 relative overflow-hidden">
                {/* Map Label Overlay */}
                <div className="absolute top-4 left-4 bg-white/80 p-2 pixel-border-sm z-20 pointer-events-none">
                    <div className="font-pixel text-[8px] text-gray-500">GLOBAL TRACKER</div>
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
                                : `Currently traveling to ${selectedChar.destination}.`}
                        </p>
                        {selectedChar.status !== 'Ready' && (
                            <div className="w-full bg-gray-200 h-2 mt-2 border border-gray-400 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-pixel-accent"
                                    style={{ width: `${selectedChar.progress}%` }}
                                ></div>
                            </div>
                        )}
                    </div>

                    {/* Action Button */}
                    <button
                        onClick={() => router.push(`/${selectedChar.id}/history`)}
                        className="bg-gray-200 text-gray-600 px-4 py-2 font-pixel text-[10px] pixel-border-sm hover:bg-gray-300 hover:cursor-pointer"
                    >
                        VIEW HISTORY
                    </button>
                    <button
                        onClick={() => router.push(`/${selectedChar.id}/compose`)}
                        className="bg-[#ef4444] text-white px-4 py-2 font-pixel text-[10px] pixel-border-sm hover:translate-y-[-2px] hover:shadow-lg animate-bounce-sm hover:cursor-pointer"
                    >
                        START QUEST
                    </button>
                </div>
            )}
        </div>
    );
};
