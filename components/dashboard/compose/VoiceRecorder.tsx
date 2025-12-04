import React, { useState, useEffect, useRef } from 'react';
import { X, Mic } from 'lucide-react';

interface VoiceRecorderProps {
    onSave: (item: any) => void;
    onCancel: () => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onSave, onCancel }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [duration, setDuration] = useState(0);
    const [hasRecording, setHasRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = e => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
                setHasRecording(true);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setDuration(0);
            timerRef.current = setInterval(() => setDuration(p => p + 1), 1000);
        } catch (err) {
            console.error('Error accessing microphone:', err);
            // Handle error (maybe show a toast)
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
        }
    };

    const handleToggleRecord = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    const handleSave = () => {
        if (audioBlob) {
            onSave({
                id: Date.now(),
                type: 'voice',
                name: 'Tape Recording',
                icon: <Mic />,
                detail: formatTime(duration),
                blob: audioBlob // Pass blob to parent to save to IDB
            });
        }
    };

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
            }
        };
    }, []);

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-[#2d2d2d] p-1 pixel-border w-full max-w-sm relative">
                <button
                    onClick={onCancel}
                    className="absolute -top-3 -right-3 bg-red-500 text-white p-1 pixel-border-sm hover:bg-red-600 z-10 hover:cursor-pointer"
                >
                    <X size={16} />
                </button>
                <div className="bg-[#e5e5e5] p-4 flex flex-col items-center gap-4 border-4 border-gray-700">
                    <div className="w-full bg-[#333] h-24 rounded-lg flex items-center justify-center gap-4 px-4 pixel-border-sm">
                        <div
                            className={`w-8 h-8 rounded-full border-2 border-white border-dashed ${
                                isRecording ? 'animate-spin' : ''
                            }`}
                        ></div>
                        <div className="flex-1 h-4 bg-white/20"></div>
                        <div
                            className={`w-8 h-8 rounded-full border-2 border-white border-dashed ${
                                isRecording ? 'animate-spin' : ''
                            }`}
                        ></div>
                    </div>
                    <div className="w-full bg-[#4a5d4a] p-2 pixel-border-sm font-handheld text-green-300 text-center text-xl flex justify-between">
                        <span className={isRecording ? 'animate-pulse text-red-400' : ''}>● REC</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                    <div className="flex gap-2 w-full">
                        {!hasRecording ? (
                            <button
                                onClick={handleToggleRecord}
                                className="flex-1 bg-red-500 text-white py-4 pixel-border-sm font-pixel text-[8px] hover:cursor-pointer"
                            >
                                {isRecording ? 'STOP' : 'RECORD'}
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={() => {
                                        setHasRecording(false);
                                        setDuration(0);
                                        setAudioBlob(null);
                                    }}
                                    className="flex-1 bg-gray-300 py-2 pixel-border-sm font-pixel text-[8px] hover:cursor-pointer"
                                >
                                    RETRY
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="flex-1 bg-green-500 text-white py-2 pixel-border-sm font-pixel text-[8px] hover:cursor-pointer"
                                >
                                    SAVE
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
