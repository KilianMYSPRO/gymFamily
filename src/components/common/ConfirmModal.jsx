import React from 'react';
import Portal from './Portal';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", cancelText = "Cancel", isDestructive = false }) => {
    if (!isOpen) return null;

    return (
        <Portal>
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                <div
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in"
                    onClick={onClose}
                />

                <div className="relative w-full max-w-sm bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl animate-scale-in overflow-hidden">
                    {/* Background Glow */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

                    <div className="relative z-10 flex flex-col items-center text-center">
                        <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-white/5 flex items-center justify-center mb-4 shadow-inner">
                            <AlertTriangle size={32} className={isDestructive ? "text-red-500" : "text-amber-500"} />
                        </div>

                        <h3 className="text-xl font-black italic text-white mb-2">{title}</h3>
                        <p className="text-slate-400 text-sm mb-6 leading-relaxed">{message}</p>

                        <div className="flex gap-3 w-full">
                            <button
                                onClick={onClose}
                                className="flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
                            >
                                {cancelText}
                            </button>
                            <button
                                onClick={() => {
                                    onConfirm();
                                    onClose();
                                }}
                                className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm text-white shadow-lg transition-all active:scale-95 ${isDestructive
                                        ? "bg-red-500 hover:bg-red-600 shadow-red-500/20"
                                        : "bg-electric-500 hover:bg-electric-600 shadow-electric-500/20 text-black"
                                    }`}
                            >
                                {confirmText}
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white transition-colors rounded-full hover:bg-white/5"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>
        </Portal>
    );
};

export default ConfirmModal;
