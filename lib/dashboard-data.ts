import React from 'react';
import { Mic, Link as LinkIcon, Image as ImageIcon, PenTool } from 'lucide-react';

export interface Character {
  id: number;
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

export const CHARACTERS: Character[] = [
  { 
    id: 2, 
    name: 'Fuzz', 
    status: 'Ready', // At Home, Ready for Quest
    destination: 'Home Base', 
    progress: 0, 
    color: '#fca5a5', 
    coords: { x: 25, y: 60 },
    history: [
      { id: 101, date: 'Oct 12', to: 'Sarah', location: 'Paris', items: ['Photo', 'Croissant'] },
      { id: 102, date: 'Sep 05', to: 'Mom', location: 'Home', items: ['Voice Memo'] },
    ]
  },
  { 
    id: 1, 
    name: 'Sprout', 
    status: 'En Route', 
    destination: 'Tokyo', 
    progress: 65, 
    color: '#a3e635', 
    coords: { x: 60, y: 40 },
    history: [
      { id: 201, date: 'Nov 01', to: 'Kenji', location: 'Tokyo', items: ['Link', 'Drawing'] },
    ]
  },
  { 
    id: 3, 
    name: 'Glip', 
    status: 'Delivered', 
    destination: 'London', 
    progress: 100, 
    color: '#60a5fa', 
    coords: { x: 45, y: 30 },
    history: [
      { id: 301, date: 'Nov 28', to: 'James', location: 'London', items: ['Raindrop', 'Tea'] },
      { id: 302, date: 'Oct 30', to: 'James', location: 'London', items: ['Drawing'] },
      { id: 303, date: 'Sep 15', to: 'Anna', location: 'Berlin', items: ['Techno Beat'] },
    ]
  },
];

// Note: We can't store React components directly in JSON-like data if we want it to be pure data,
// but for this refactor we will keep the structure as is for simplicity, 
// or we can just store the icon name and render it in the component.
// For now, I'll keep it as is since it's a .ts file.
// Wait, I need to import the icons. I'll use a function or just export the array.

export const TOOLS = [
  { id: 'voice', name: 'Voice Memo', icon: Mic, type: 'audio', desc: 'Record audio' },
  { id: 'link', name: 'Link', icon: LinkIcon, type: 'web', desc: 'Share a URL' },
  { id: 'photo', name: 'Photo', icon: ImageIcon, type: 'image', desc: 'Camera roll' },
  { id: 'drawing', name: 'Drawing', icon: PenTool, type: 'art', desc: 'Sketch pad' },
];
