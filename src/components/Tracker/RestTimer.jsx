import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, SkipForward } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import Portal from '../common/Portal';

const RestTimer = ({ isOpen, onClose, defaultDuration = 90 }) => {
    const { t } = useLanguage();
    const [timeLeft, setTimeLeft] = useState(defaultDuration);

    useEffect(() => {
        if (isOpen) {
            setTimeLeft(defaultDuration);
        }
    }, [isOpen, defaultDuration]);

    useEffect(() => {
        if (!isOpen) return;

        const interval = setInterval(() => {
            setTimeLeft((prev) => {
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
        setTimeLeft((prev) => Math.max(0, prev + seconds));
    };

    if (!isOpen) return null;

    return (
        <Portal>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 w-full max-w-sm mx-4 shadow-2xl relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>

                    <div className="text-center space-y-8">
                        <div>
                            <h3 className="text-slate-400 font-medium uppercase tracking-wider mb-2">{t('tracker.restTimer')}</h3>
                            <div className="text-7xl font-black text-white font-mono tabular-nums tracking-tight">
                                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                            </div>
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
