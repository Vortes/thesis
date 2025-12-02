import React from 'react';
import { Mic, Link as LinkIcon, Image as ImageIcon, PenTool } from 'lucide-react';

export interface Character {
    id: number | string;
    name: string;
    status: 'Ready' | 'En Route' | 'Delivered';
    destination: string;
    progress: number;
    color: string;
    coords: { x: number; y: number };
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
