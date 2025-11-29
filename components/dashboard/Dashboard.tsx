'use client';

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Map } from './Map';
import { History } from './History';
import { Compose } from './Compose';
import { VoiceRecorder } from './VoiceRecorder';
import { DrawingPad } from './DrawingPad';
import { CHARACTERS, Character } from '@/lib/dashboard-data';

export default function Dashboard() {
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'compose', 'history'
  const [selectedChar, setSelectedChar] = useState<Character | null>(null);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  
  // Compose State
  const [composeMessage, setComposeMessage] = useState('');
  const [attachedItems, setAttachedItems] = useState<any[]>([]);
  const [isSealed, setIsSealed] = useState(false);

  // Sorting: Ready first, then others
  const sortedChars = [...CHARACTERS].sort((a, b) => {
      if (a.status === 'Ready' && b.status !== 'Ready') return -1;
      if (a.status !== 'Ready' && b.status === 'Ready') return 1;
      return 0;
  });

  const handleCharClick = (char: Character) => {
    setSelectedChar(char);
    if (char.status === 'Ready') {
        // If ready, go to quest menu (Compose)
        setCurrentView('compose');
    } else {
        // If not ready, just view details
        // If we are in compose mode and click a non-ready char, we should probably go back to dashboard or history
        if (currentView === 'compose') setCurrentView('dashboard');
    }
  };

  const handleComposeSend = () => {
      setIsSealed(true);
      setTimeout(() => {
          setComposeMessage('');
          setAttachedItems([]);
          setIsSealed(false);
          setCurrentView('dashboard');
      }, 2500);
  };

  return (
    <div className="min-h-screen bg-slate-800 flex items-center justify-center p-4 relative overflow-hidden font-sans select-none">
      
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10" 
           style={{ backgroundImage: 'radial-gradient(#ffffff 2px, transparent 2px)', backgroundSize: '32px 32px' }}>
      </div>

      {/* --- OVERLAYS (Modals) --- */}
      {activeTool === 'voice' && <VoiceRecorder onSave={(i)=>{setAttachedItems([...attachedItems, i]); setActiveTool(null)}} onCancel={()=>setActiveTool(null)} />}
      {activeTool === 'drawing' && <DrawingPad onSave={(i)=>{setAttachedItems([...attachedItems, i]); setActiveTool(null)}} onCancel={()=>setActiveTool(null)} />}

      {/* --- MAIN CONTAINER --- */}
      <div className="relative z-10 w-full max-w-5xl h-[85vh] flex flex-col md:flex-row bg-pixel-bg p-2 pixel-border pixel-corners gap-2">
        
        {/* --- LEFT SIDEBAR (Navigation & Roster) --- */}
        <Sidebar 
            currentView={currentView} 
            setCurrentView={setCurrentView} 
            sortedChars={sortedChars} 
            selectedChar={selectedChar} 
            handleCharClick={handleCharClick} 
        />

        {/* --- MAIN CONTENT AREA --- */}
        <div className="flex-1 bg-[#a08560] border-4 border-[#6d5a43] relative overflow-hidden flex flex-col">
            
            {/* VIEW: DASHBOARD (Map) */}
            {currentView === 'dashboard' && (
                <Map 
                    selectedChar={selectedChar} 
                    isSealed={isSealed} 
                    handleCharClick={handleCharClick} 
                    setCurrentView={setCurrentView} 
                />
            )}

            {/* VIEW: HISTORY (Logs) */}
            {currentView === 'history' && (
                <History selectedChar={selectedChar} />
            )}

            {/* VIEW: COMPOSE (Quest) */}
            {currentView === 'compose' && selectedChar && (
                <Compose 
                    selectedChar={selectedChar} 
                    setCurrentView={setCurrentView} 
                    setActiveTool={setActiveTool} 
                    attachedItems={attachedItems} 
                    setAttachedItems={setAttachedItems} 
                    isSealed={isSealed} 
                    handleComposeSend={handleComposeSend} 
                    composeMessage={composeMessage} 
                    setComposeMessage={setComposeMessage} 
                />
            )}

        </div>

        {/* --- DESK EDGES DECORATION --- */}
        <div className="absolute -bottom-1 left-4 w-32 h-1 bg-black/20 rounded-full blur-sm z-0"></div>
      </div>
      
      <div className="fixed bottom-2 right-2 font-pixel text-[8px] text-white opacity-30">
        V4.0 QUEST
      </div>
    </div>
  );
}
