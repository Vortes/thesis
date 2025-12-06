'use client';
import { useState, useRef } from 'react';
import { Play } from 'lucide-react';

interface AudioPlayerProps {
    src: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ src }) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            const current = audioRef.current.currentTime;
            const dur = audioRef.current.duration;
            setCurrentTime(current);
            setProgress((current / dur) * 100);
        }
    };

    const handleLoadedMetadata = () => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration);
        }
    };

    const handleEnded = () => {
        setIsPlaying(false);
        setProgress(0);
        setCurrentTime(0);
    };

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex items-center gap-3 bg-[#2d2d2d] p-2 rounded w-full">
            <audio
                ref={audioRef}
                src={src}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={handleEnded}
            />
            <button
                onClick={togglePlay}
                className="w-8 h-8 bg-[#4a5d4a] rounded flex items-center justify-center hover:bg-[#5a6d5a] transition-colors shrink-0"
            >
                {isPlaying ? (
                    <div className="flex gap-1">
                        <div className="w-1 h-3 bg-white" />
                        <div className="w-1 h-3 bg-white" />
                    </div>
                ) : (
                    <Play size={14} className="text-white ml-0.5" fill="white" />
                )}
            </button>
            <div className="flex-1 h-2 bg-[#1a1a1a] rounded overflow-hidden">
                <div
                    className="h-full bg-[#a3e635] rounded transition-all duration-100 ease-linear"
                    style={{ width: `${progress}%` }}
                />
            </div>
            <span className="font-handheld text-[#a3e635] text-sm tabular-nums w-10 text-right">
                {formatTime(currentTime)}
            </span>
        </div>
    );
};
