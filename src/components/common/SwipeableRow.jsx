import React, { useState, useRef } from 'react';
import { Trash2 } from 'lucide-react';
import clsx from 'clsx';

/**
 * SwipeableRow - A component that allows swiping left to reveal a delete action
 * @param {React.ReactNode} children - The content of the row
 * @param {function} onDelete - Callback when delete is triggered
 * @param {string} className - Additional classes for the container
 */
const SwipeableRow = ({ children, onDelete, className = '' }) => {
    const [translateX, setTranslateX] = useState(0);
    const [isSwiping, setIsSwiping] = useState(false);
    const startX = useRef(0);
    const currentX = useRef(0);
    const containerRef = useRef(null);

    const DELETE_THRESHOLD = -80; // px to swipe before triggering delete
    const MAX_SWIPE = -100;

    const handleTouchStart = (e) => {
        startX.current = e.touches[0].clientX;
        currentX.current = startX.current;
        setIsSwiping(true);
    };

    const handleTouchMove = (e) => {
        if (!isSwiping) return;

        currentX.current = e.touches[0].clientX;
        const diff = currentX.current - startX.current;

        // Only allow swiping left (negative values)
        if (diff < 0) {
            const constrainedDiff = Math.max(diff, MAX_SWIPE);
            setTranslateX(constrainedDiff);
        } else if (translateX < 0) {
            // Allow swiping back to original position
            setTranslateX(Math.min(0, translateX + diff));
        }
    };

    const handleTouchEnd = () => {
        setIsSwiping(false);

        if (translateX <= DELETE_THRESHOLD) {
            // Keep the delete button visible
            setTranslateX(MAX_SWIPE);
        } else {
            // Snap back to original position
            setTranslateX(0);
        }
    };

    const handleDelete = () => {
        if (navigator.vibrate) navigator.vibrate([10, 30, 20]);
        // Animate out then delete
        setTranslateX(-300);
        setTimeout(() => {
            onDelete();
        }, 200);
    };

    const resetPosition = () => {
        setTranslateX(0);
    };

    return (
        <div className={clsx("relative overflow-hidden rounded-xl", className)}>
            {/* Delete action background */}
            <div
                className="absolute inset-y-0 right-0 flex items-center justify-end bg-red-500 px-4"
                style={{ width: Math.abs(translateX) + 20 }}
            >
                <button
                    onClick={handleDelete}
                    className="flex flex-col items-center gap-1 text-white active:scale-90 transition-all"
                >
                    <Trash2 size={24} strokeWidth={2.5} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Delete</span>
                </button>
            </div>

            {/* Swipeable content */}
            <div
                ref={containerRef}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onClick={translateX < 0 ? resetPosition : undefined}
                className="relative bg-slate-900 transition-transform duration-200 ease-out"
                style={{
                    transform: `translateX(${translateX}px)`,
                    transitionDuration: isSwiping ? '0ms' : '200ms'
                }}
            >
                {children}
            </div>
        </div>
    );
};

export default SwipeableRow;
