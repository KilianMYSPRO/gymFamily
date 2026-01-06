import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import clsx from 'clsx';
import Portal from './Portal';

/**
 * BottomSheet - A mobile-friendly modal that slides up from the bottom
 * Falls back to centered modal on desktop
 * @param {boolean} isOpen - Whether the sheet is open
 * @param {function} onClose - Callback when sheet is closed
 * @param {string} title - Optional title for the sheet
 * @param {React.ReactNode} children - Content of the sheet
 * @param {string} className - Additional classes for the content container
 */
const BottomSheet = ({ isOpen, onClose, title, children, className = '' }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            // Small delay for mount animation
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setIsAnimating(true);
                });
            });
        } else {
            setIsAnimating(false);
            const timer = setTimeout(() => setIsVisible(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    // Close on escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    // Prevent body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isVisible) return null;

    return (
        <Portal>
            {/* Backdrop */}
            <div
                className={clsx(
                    "fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300",
                    isAnimating ? "opacity-100" : "opacity-0"
                )}
                onClick={onClose}
            />

            {/* Bottom Sheet (Mobile) / Centered Modal (Desktop) */}
            <div
                className={clsx(
                    "fixed z-50 transition-all duration-300 ease-out",
                    // Mobile: bottom sheet
                    "inset-x-0 bottom-0 md:inset-auto",
                    // Desktop: centered
                    "md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-lg md:w-full",
                    // Animation
                    isAnimating
                        ? "translate-y-0 md:translate-y-0 md:opacity-100 md:scale-100"
                        : "translate-y-full md:translate-y-8 md:opacity-0 md:scale-95"
                )}
            >
                <div className={clsx(
                    "bg-slate-900 border border-slate-700 shadow-2xl",
                    // Mobile: rounded top corners only, max height
                    "rounded-t-3xl md:rounded-2xl max-h-[85vh] md:max-h-[80vh] overflow-hidden",
                    "flex flex-col",
                    className
                )}>
                    {/* Handle bar (mobile only) */}
                    <div className="md:hidden flex justify-center pt-3 pb-2">
                        <div className="w-10 h-1 bg-slate-600 rounded-full" />
                    </div>

                    {/* Header */}
                    {title && (
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
                            <h3 className="text-lg font-bold text-white">{title}</h3>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors active:scale-95"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto px-6 py-4 pb-safe">
                        {children}
                    </div>
                </div>
            </div>
        </Portal>
    );
};

export default BottomSheet;
