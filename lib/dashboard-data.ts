import React from 'react';
import { Mic, Link as LinkIcon, Image as ImageIcon, PenTool } from 'lucide-react';

export interface Character {
    id: number | string;
    recipientId: string;
    name: string;
    status: 'Ready' | 'En Route' | 'Waiting' | 'Returning' | 'Loading';
    destination: string;
    holderName?: string; // Name of the person who currently has the messenger
    progress: number; // Deprecated: will be calculated on frontend
    color: string;
    skinId?: string; // Messenger sprite/icon identifier
    coords: { lng: number; lat: number }; // Geographic coordinates (current position or holder's location)
    destCoords?: { lng: number; lat: number }; // Destination coordinates (for En Route/Returning)
    originCoords?: { lng: number; lat: number }; // Origin coordinates (for En Route/Returning)
    canSend: boolean; // Whether current user can send with this messenger
    revealed: boolean; // Whether user has seen the Hau reveal experience
    friendName: string; // The friend's first name (for reveal flow)
    shipmentData?: {
        shipmentId: string;
        dispatchedAt: number; // Unix timestamp
        recalledAt?: number; // Unix timestamp if recalled
        distanceInKm: number | null;
    };
    history: {
        id: number;
        date: string;
        to: string;
        location: string;
        items: string[];
    }[];
}

export interface Tool {
    id: string;
    name: string;
    icon: React.ReactNode;
    type: string;
    desc: string;
}

// Note: We can't store React components directly in JSON-like data if we want it to be pure data,
// but for this refactor we will keep the structure as is for simplicity,
// or we can just store the icon name and render it in the component.
// For now, I'll keep it as is since it's a .ts file.
// Wait, I need to import the icons. I'll use a function or just export the array.

export const TOOLS = [
    { id: 'voice', name: 'Voice Memo', icon: Mic, type: 'audio', desc: 'Record audio' },
    { id: 'link', name: 'Link', icon: LinkIcon, type: 'web', desc: 'Share a URL' },
    { id: 'photo', name: 'Photo', icon: ImageIcon, type: 'image', desc: 'Camera roll' },
    { id: 'drawing', name: 'Drawing', icon: PenTool, type: 'art', desc: 'Sketch pad' }
];
