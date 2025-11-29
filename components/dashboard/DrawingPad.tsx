import React, { useState, useEffect, useRef } from 'react';
import { X, PenTool } from 'lucide-react';

interface DrawingPadProps {
    onSave: (item: any) => void;
    onCancel: () => void;
}

export const DrawingPad: React.FC<DrawingPadProps> = ({ onSave, onCancel }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [color, setColor] = useState('#000000');
    const isDrawing = useRef(false);
    
    useEffect(() => {
        const canvas = canvasRef.current;
        if(!canvas) return;
        canvas.width = 300; canvas.height = 300;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.fillStyle = '#ffffff'; 
            ctx.fillRect(0,0,300,300);
        }
    }, []);

    const start = (e: React.MouseEvent | React.TouchEvent) => { isDrawing.current = true; draw(e); };
    const stop = () => { isDrawing.current = false; };
    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if(!isDrawing.current || !canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;
        
        const rect = canvasRef.current.getBoundingClientRect();
        let clientX, clientY;
        
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }

        const x = clientX - rect.left;
        const y = clientY - rect.top;
        ctx.fillStyle = color; 
        ctx.fillRect(x,y,4,4); // Pixel brush
    };
    
    const handleSave = () => onSave({ id: Date.now(), type: 'drawing', name: 'Sketch', icon: <PenTool />, detail: 'Ink' });

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-pixel-card p-1 pixel-border w-full max-w-sm relative">
                <button onClick={onCancel} className="absolute -top-3 -right-3 bg-red-500 text-white p-1 pixel-border-sm hover:bg-red-600 z-10"><X size={16} /></button>
                <div className="bg-white border-4 border-pixel-bg p-2">
                    <canvas 
                        ref={canvasRef} 
                        className="bg-white w-full h-[300px] cursor-crosshair pixel-border-sm" 
                        onMouseDown={start} 
                        onMouseMove={draw} 
                        onMouseUp={stop} 
                        onMouseLeave={stop} 
                        onTouchStart={start} 
                        onTouchMove={draw} 
                        onTouchEnd={stop} 
                    />
                    <div className="flex justify-between mt-2">
                        <div className="flex gap-1">
                            {['#000000','#ef4444','#3b82f6'].map(c => <button key={c} onClick={()=>setColor(c)} className="w-6 h-6 border border-black" style={{backgroundColor:c}}/>)}
                        </div>
                        <button onClick={handleSave} className="bg-pixel-accent px-4 py-1 font-pixel text-[8px] pixel-border-sm">ATTACH</button>
                    </div>
                </div>
            </div>
        </div>
    );
};
