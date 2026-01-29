'use client';

import React, { useState, useEffect } from 'react';
import { Globe, HelpCircle, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { getHauCharacterByIdOrDefault, HAU_CHARACTERS } from '@/lib/hau-characters';
import { markHauRevealed } from '@/app/actions/hau-reveal';
import { useRouter } from 'next/navigation';

interface HauRevealFlowProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    messengerId: string;
    hauSkinId: string;
    userName: string;
    friendName: string;
}

type Step = 'matching' | 'ready' | 'reveal';

export const HauRevealFlow: React.FC<HauRevealFlowProps> = ({
    open,
    onOpenChange,
    messengerId,
    hauSkinId,
    userName,
    friendName
}) => {
    const router = useRouter();
    const [step, setStep] = useState<Step>('matching');
    const [carouselIndex, setCarouselIndex] = useState(0);
    const [isSpinning, setIsSpinning] = useState(true);

    const hau = getHauCharacterByIdOrDefault(hauSkinId);

    // Carousel animation for matching screen
    useEffect(() => {
        if (step !== 'matching' || !isSpinning) return;

        const interval = setInterval(() => {
            setCarouselIndex(prev => (prev + 1) % HAU_CHARACTERS.length);
        }, 150);

        // Stop spinning after 2 seconds
        const timeout = setTimeout(() => {
            setIsSpinning(false);
            // Land on the actual hau
            const actualIndex = HAU_CHARACTERS.findIndex(h => h.id === hauSkinId);
            setCarouselIndex(actualIndex >= 0 ? actualIndex : 0);
        }, 2000);

        return () => {
            clearInterval(interval);
            clearTimeout(timeout);
        };
    }, [step, isSpinning, hauSkinId]);

    const handleRevealClick = () => {
        setStep('ready');
    };

    const handleReadyClick = () => {
        setStep('reveal');
    };

    const handleFinish = async () => {
        await markHauRevealed(messengerId);
        onOpenChange(false);
        router.refresh();
    };

    const currentCarouselHau = HAU_CHARACTERS[carouselIndex];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="bg-[#c4a574] border-none p-0 pixel-border max-w-lg gap-0 rounded-none"
                showCloseButton={false}
            >
                <VisuallyHidden.Root>
                    <DialogTitle>Meet Your Hau</DialogTitle>
                </VisuallyHidden.Root>

                {/* Header */}
                <div className="bg-[#5e4c35] p-4 flex items-center justify-center gap-2">
                    <Globe className="w-5 h-5 text-[#e0d5c1]" />
                    <span className="font-pixel text-sm text-[#e0d5c1]">HAUMAIL</span>
                </div>

                {/* Content */}
                <div className="p-8 flex flex-col items-center">
                    {step === 'matching' && (
                        <>
                            <h2 className="font-handheld text-2xl text-[#4a3b2a] text-center mb-8 leading-relaxed">
                                The Hau distribution system is<br />working to make the perfect match...
                            </h2>

                            {/* Carousel Area */}
                            <div
                                className="w-48 h-48 bg-[#e0d5c1] pixel-border-sm flex items-center justify-center mb-8 cursor-pointer hover:bg-[#d4c9b5] transition-colors"
                                onClick={!isSpinning ? handleRevealClick : undefined}
                            >
                                {isSpinning ? (
                                    <div className="text-center">
                                        <div
                                            className="w-20 h-20 rounded-full mb-2 mx-auto flex items-center justify-center"
                                            style={{ backgroundColor: currentCarouselHau.color }}
                                        >
                                            <HelpCircle className="w-10 h-10 text-white opacity-70" />
                                        </div>
                                        <span className="font-pixel text-[8px] text-[#6d5a43]">
                                            {currentCarouselHau.name}
                                        </span>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <div
                                            className="w-20 h-20 rounded-full mb-2 mx-auto flex items-center justify-center animate-pulse"
                                            style={{ backgroundColor: hau.color }}
                                        >
                                            <HelpCircle className="w-10 h-10 text-white" />
                                        </div>
                                        <span className="font-pixel text-[8px] text-[#4a3b2a]">
                                            TAP TO REVEAL
                                        </span>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={handleRevealClick}
                                disabled={isSpinning}
                                className="w-full max-w-xs py-3 bg-[#5e4c35] text-[#e0d5c1] font-handheld text-xl pixel-border-sm hover:bg-[#4a3b2a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {isSpinning ? 'Matching...' : 'Who is this?'}
                            </button>
                        </>
                    )}

                    {step === 'ready' && (
                        <>
                            <h2 className="font-handheld text-2xl text-[#4a3b2a] text-center mb-2 leading-relaxed">
                                {userName} and {friendName}
                            </h2>
                            <p className="font-handheld text-xl text-[#6d5a43] text-center mb-8">
                                Are you ready to meet your Hau?
                            </p>

                            {/* Mystery Hau Shadow */}
                            <div className="w-48 h-48 bg-[#e0d5c1] pixel-border-sm flex items-center justify-center mb-8">
                                <div className="text-center">
                                    <div
                                        className="w-24 h-24 rounded-full mb-2 mx-auto flex items-center justify-center opacity-30"
                                        style={{ backgroundColor: '#4a3b2a' }}
                                    >
                                        <HelpCircle className="w-12 h-12 text-white" />
                                    </div>
                                    <span className="font-pixel text-[10px] text-[#6d5a43]">???</span>
                                </div>
                            </div>

                            <button
                                onClick={handleReadyClick}
                                className="w-full max-w-xs py-3 bg-[#5e4c35] text-[#e0d5c1] font-handheld text-xl pixel-border-sm hover:bg-[#4a3b2a] transition-colors"
                            >
                                I&apos;m ready
                            </button>
                        </>
                    )}

                    {step === 'reveal' && (
                        <>
                            <h2 className="font-handheld text-xl text-[#4a3b2a] text-center mb-8 leading-relaxed px-4">
                                Meet {hau.name}, {hau.description.toLowerCase()}
                            </h2>

                            {/* Revealed Hau */}
                            <div className="w-48 h-48 bg-[#e0d5c1] pixel-border-sm flex items-center justify-center mb-4 relative">
                                <div className="text-center">
                                    <div
                                        className="w-24 h-24 rounded-full mb-2 mx-auto flex items-center justify-center"
                                        style={{ backgroundColor: hau.color }}
                                    >
                                        <Sparkles className="w-10 h-10 text-white" />
                                    </div>
                                    <span className="font-pixel text-xs text-[#4a3b2a]">{hau.name}</span>
                                </div>

                                {/* Speech bubble */}
                                <div className="absolute -right-4 -top-4 bg-white p-3 pixel-border-sm max-w-[140px] transform rotate-3">
                                    <p className="font-handheld text-sm text-[#4a3b2a] leading-tight">
                                        {hau.greeting.length > 60
                                            ? hau.greeting.slice(0, 60) + '...'
                                            : hau.greeting}
                                    </p>
                                </div>
                            </div>

                            <p className="font-handheld text-sm text-[#6d5a43] text-center mb-6 italic">
                                {hau.personality}
                            </p>

                            <button
                                onClick={handleFinish}
                                className="w-full max-w-xs py-3 bg-[#5e4c35] text-[#e0d5c1] font-handheld text-xl pixel-border-sm hover:bg-[#4a3b2a] transition-colors"
                            >
                                What&apos;s next?
                            </button>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
