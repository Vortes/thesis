import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface AttachmentItemProps {
    item: any;
    onRemove: (id: number) => void;
}

export const AttachmentItem: React.FC<AttachmentItemProps> = ({ item, onRemove }) => {
    const [audioUrl, setAudioUrl] = useState<string | null>(null);

    useEffect(() => {
        if (item.type === 'voice' && item.blob) {
            const url = URL.createObjectURL(item.blob);
            setAudioUrl(url);
            return () => URL.revokeObjectURL(url);
        }
    }, [item]);

    const handleClick = () => {
        if (item.type === 'voice' && audioUrl) {
            const audio = new Audio(audioUrl);
            audio.play();
        }
    };

    return (
        <div className="relative group animate-in zoom-in duration-300">
            <button
                onClick={e => {
                    e.stopPropagation();
                    onRemove(item.id);
                }}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:cursor-pointer shadow-sm"
            >
                <X size={12} />
            </button>
            <div
                onClick={handleClick}
                className={`bg-white border-2 border-black p-2 flex flex-col items-center gap-1 shadow-md w-20 h-20 justify-center overflow-hidden relative ${
                    item.type === 'voice'
                        ? 'hover:bg-gray-100 hover:cursor-pointer active:scale-95 transition-transform'
                        : ''
                }`}
            >
                {item.type === 'photo' && (item.previewUrl || item.content) ? (
                    <img
                        src={item.previewUrl || item.content}
                        alt="Attachment"
                        className="w-full h-full object-cover absolute inset-0"
                    />
                ) : (
                    <>
                        <span className="text-gray-800 relative z-10">{item.icon}</span>
                        <span className="font-pixel text-[8px] text-center leading-tight truncate w-full relative z-10">
                            {item.detail}
                        </span>
                    </>
                )}
            </div>
        </div>
    );
};
