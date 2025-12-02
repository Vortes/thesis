import React from 'react';
import { X } from 'lucide-react';

interface LetterAreaProps {
    message: string;
    setMessage: (msg: string) => void;
    attachedItems: any[];
    onRemoveItem: (id: number) => void;
    isSealed: boolean;
}

export const LetterArea: React.FC<LetterAreaProps> = ({
    message,
    setMessage,
    attachedItems,
    onRemoveItem,
    isSealed
}) => {
    return (
        <div
            className={`flex-1 bg-[#fdfbf7] p-6 relative flex flex-col transition-all duration-700 ${
                isSealed ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
            }`}
            style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.2)' }}
        >
            <div className="absolute top-0 left-0 right-0 h-8 bg-blue-100 opacity-20 pointer-events-none"></div>

            <div className="font-handheld text-3xl text-gray-800 mb-4 border-b-2 border-dashed border-gray-300 pb-2">
                Dear Friend,
            </div>

            <textarea
                className="w-full flex-grow bg-transparent border-none resize-none font-handheld text-2xl text-gray-700 focus:outline-none leading-relaxed custom-textarea min-h-[120px]"
                placeholder="Write your message here..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                autoFocus
            />

            {/* Attached Items Drop Zone */}
            <div className="mt-4 border-t-2 border-gray-200 pt-4">
                <div className="flex justify-between items-end mb-2">
                    <div className="font-pixel text-[10px] text-gray-400 uppercase tracking-wider">
                        Attachments ({attachedItems.length})
                    </div>
                </div>

                <div className="flex gap-2 min-h-[60px] bg-gray-50 p-2 border-2 border-dashed border-gray-200 rounded-lg items-center">
                    {attachedItems.length === 0 && (
                        <span className="font-handheld text-xl text-gray-400 italic w-full text-center">Empty...</span>
                    )}
                    {attachedItems.map(item => (
                        <div key={item.id} className="relative group animate-in zoom-in duration-300">
                            <button
                                onClick={() => onRemoveItem(item.id)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                            >
                                <X size={12} />
                            </button>
                            <div className="bg-white border-2 border-black p-2 flex flex-col items-center gap-1 shadow-md w-20 h-20 justify-center">
                                <span className="text-gray-800">{item.icon}</span>
                                <span className="font-pixel text-[8px] text-center leading-tight truncate w-full">
                                    {item.detail}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
