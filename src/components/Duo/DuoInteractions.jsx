import React from 'react';
import { useDuo } from '../../context/DuoContext';
import clsx from 'clsx';

export const NudgeOverlay = () => {
    const { lastNudge } = useDuo();

    if (!lastNudge) return null;

    return (
        <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center overflow-hidden">
            <div className="relative">
                <div className="text-9xl animate-bounce drop-shadow-[0_0_30px_rgba(255,255,255,0.5)]">
                    {lastNudge.emoji}
                </div>
                <div className="absolute inset-0 animate-ping opacity-25 text-9xl">
                    {lastNudge.emoji}
                </div>
            </div>
            {/* Ambient Background Flash */}
            <div className="absolute inset-0 bg-white/5 animate-pulse" />
        </div>
    );
};

export const NudgeControls = () => {
    const { sendNudge, partner, isConnected } = useDuo();

    if (!isConnected || !partner) return null;

    const emojis = ['🔥', '👏', '💪', '⚡', '👊', '🚀'];

    return (
        <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-3xl p-4 mt-4">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 text-center">Nudge your partner</p>
            <div className="flex justify-between gap-2">
                {emojis.map(emoji => (
                    <button
                        key={emoji}
                        onClick={() => sendNudge(emoji)}
                        className="w-10 h-10 flex items-center justify-center text-xl bg-slate-800 hover:bg-slate-700 active:scale-90 transition-all rounded-xl"
                    >
                        {emoji}
                    </button>
                ))}
            </div>
        </div>
    );
};
