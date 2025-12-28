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
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 w-full max-w-sm mx-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>

                    <div className="text-center space-y-6 md:space-y-8">
                        <div>
                            <h3 className="text-slate-400 font-medium uppercase tracking-wider mb-2">{t('tracker.restTimer')}</h3>
                            <div className="text-6xl md:text-7xl font-black text-white font-mono tabular-nums tracking-tight">
                                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                            </div>
                            {nextExercise && (
                                <div className="mt-2 animate-fade-in">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{t('tracker.upNext') || 'Up Next'}</p>
                                    <p className="text-lg font-bold text-electric-400">{nextExercise}</p>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-center gap-4">
                            <button
                                onClick={() => adjustTime(-10)}
                                className="p-4 rounded-2xl bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-all active:scale-95"
                            >
                                <Minus size={24} />
                            </button>
                            <button
                                onClick={() => adjustTime(30)}
                                className="p-4 rounded-2xl bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-all active:scale-95"
                            >
                                <Plus size={24} />
                            </button>
                        </div>

                        <button
                            onClick={onClose}
                            className="w-full py-4 rounded-2xl bg-sky-500/10 text-sky-400 hover:bg-sky-500 hover:text-white border border-sky-500/20 transition-all font-bold uppercase tracking-wider flex items-center justify-center gap-2"
                        >
                            <SkipForward size={20} />
                            {t('tracker.skipRest')}
                        </button>
                    </div>
                </div>
            </div>
        </Portal>
    );
};

export default RestTimer;
