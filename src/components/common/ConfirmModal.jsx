import React, { useEffect } from 'react';
import Portal from './Portal';
import { AlertTriangle, X } from 'lucide-react';
import clsx from 'clsx';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", cancelText = "Cancel", isDestructive = false }) => {
    // Prevent body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <Portal>
            <div className="fixed inset-0 z-[120] flex items-end md:items-center justify-center">
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in"
                    onClick={onClose}
                />

                {/* Modal - Bottom sheet on mobile, centered on desktop */}
                <div className={clsx(
                    "relative w-full max-w-sm bg-slate-900 border border-white/10 shadow-2xl overflow-hidden",
                    // Mobile: bottom sheet style with slide-up animation
                    "rounded-t-3xl md:rounded-3xl",
                    "animate-slide-up md:animate-scale-in"
                )}>
                    {/* Handle bar (mobile only) */}
                    <div className="md:hidden flex justify-center pt-3 pb-1">
                        <div className="w-10 h-1 bg-slate-600 rounded-full" />
                    </div>

                    {/* Background Glow */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

                    <div className="relative z-10 flex flex-col items-center text-center p-6 pt-4 md:pt-6 pb-safe">
                        <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-white/5 flex items-center justify-center mb-4 shadow-inner">
                            <AlertTriangle size={32} className={isDestructive ? "text-red-500" : "text-amber-500"} />
                        </div>

                        <h3 className="text-xl font-black italic text-white mb-2">{title}</h3>
                        <p className="text-slate-400 text-sm mb-6 leading-relaxed">{message}</p>

                        <div className="flex gap-3 w-full">
                            <button
                                onClick={onClose}
                                className="flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors active:scale-95"
                            >
                                {cancelText}
                            </button>
                            <button
                                onClick={() => {
                                    onConfirm();
                                    onClose();
                                }}
                                className={clsx(
                                    "flex-1 py-3 px-4 rounded-xl font-bold text-sm text-white shadow-lg transition-all active:scale-95",
                                    isDestructive
                                        ? "bg-red-500 hover:bg-red-600 shadow-red-500/20"
                                        : "bg-electric-500 hover:bg-electric-600 shadow-electric-500/20 text-black"
                                )}
                            >
                                {confirmText}
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white transition-colors rounded-full hover:bg-white/5 active:scale-95 hidden md:block"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>
        </Portal>
    );
};

export default ConfirmModal;
