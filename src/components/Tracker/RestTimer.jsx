import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, SkipForward } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import Portal from '../common/Portal';

const RestTimer = ({ isOpen, onClose, defaultDuration = 90, nextExercise }) => {
    const { t } = useLanguage();
    const [timeLeft, setTimeLeft] = useState(defaultDuration);

    useEffect(() => {
        if (isOpen) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setTimeLeft(defaultDuration);
        }
    }, [isOpen, defaultDuration]);

    // Audio context ref to reuse context if preferred, or create fresh for simplicity in strict mode
    const playBeep = (freq = 800, type = 'sine') => {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;

            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(freq, ctx.currentTime);

            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.5);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + 0.5);
        } catch (e) {
            console.error("Audio play failed", e);
        }
    };

    useEffect(() => {
        if (!isOpen) return;

        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                // Audio Alert Logic
                if (prev <= 6 && prev > 1) {
                    // Play normal beep for 5, 4, 3, 2, 1 seconds left
                    playBeep(800);
                    // Haptic pulse for countdown
                    if (navigator.vibrate) navigator.vibrate(50);
                } else if (prev === 1) {
                    // Play high beep for completion
                    playBeep(1200);
                    // Strong haptic for finish
                    if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 200]);
                }

                if (prev <= 1) {
                    clearInterval(interval);
                    onClose();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isOpen, onClose]);

    const adjustTime = (seconds) => {
        if (navigator.vibrate) navigator.vibrate(10);
        setTimeLeft((prev) => Math.max(0, prev + seconds));
    };

    if (!isOpen) return null;

    return (
        <Portal>
            <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/90 backdrop-blur-md animate-fade-in p-4">
                <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl relative overflow-hidden">
                    {/* Background Glow */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-sky-500/10 blur-[80px] rounded-full pointer-events-none" />
                    
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 text-slate-500 hover:text-white transition-all active:scale-90 z-10"
                    >
                        <X size={24} />
                    </button>

                    <div className="text-center space-y-10 relative z-10">
                        <div>
                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">{t('tracker.restTimer')}</h3>
                            <div className="text-7xl md:text-8xl font-black italic text-white font-mono tabular-nums tracking-tighter drop-shadow-[0_0_20px_rgba(14,165,233,0.3)]">
                                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                            </div>
                            {nextExercise && (
                                <div className="mt-6 animate-fade-in px-4">
                                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.2em] mb-1">{t('tracker.upNext') || 'Up Next'}</p>
                                    <p className="text-lg font-black italic text-sky-400 uppercase truncate">{nextExercise}</p>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-center gap-6">
                            <button
                                onClick={() => adjustTime(-10)}
                                className="w-16 h-16 rounded-[1.5rem] bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-all active:scale-90 border border-white/5 flex items-center justify-center font-black text-2xl shadow-xl"
                            >
                                −
                            </button>
                            <button
                                onClick={() => adjustTime(30)}
                                className="w-16 h-16 rounded-[1.5rem] bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-all active:scale-90 border border-white/5 flex items-center justify-center font-black text-2xl shadow-xl"
                            >
                                +
                            </button>
                        </div>

                        <button
                            onClick={onClose}
                            className="w-full py-5 rounded-[1.25rem] bg-sky-500 text-white hover:bg-sky-400 transition-all font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 shadow-lg shadow-sky-500/20 active:scale-95"
                        >
                            <SkipForward size={20} strokeWidth={3} />
                            {t('tracker.skipRest')}
                        </button>
                    </div>
                </div>
            </div>
        </Portal>
    );
};

export default RestTimer;
