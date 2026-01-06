import React, { useState, useRef, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import clsx from 'clsx';

/**
 * PullToRefresh - A component that allows pulling down to trigger a refresh action
 * @param {React.ReactNode} children - The scrollable content
 * @param {function} onRefresh - Async callback when refresh is triggered
 * @param {string} className - Additional classes for the container
 */
const PullToRefresh = ({ children, onRefresh, className = '' }) => {
    const [pullDistance, setPullDistance] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isPulling, setIsPulling] = useState(false);
    const startY = useRef(0);
    const containerRef = useRef(null);

    const PULL_THRESHOLD = 80; // px to pull before triggering refresh
    const MAX_PULL = 120;

    const handleTouchStart = useCallback((e) => {
        // Only start pull if at the top of scroll
        if (containerRef.current?.scrollTop === 0) {
            startY.current = e.touches[0].clientY;
            setIsPulling(true);
        }
    }, []);

    const handleTouchMove = useCallback((e) => {
        if (!isPulling || isRefreshing) return;

        const currentY = e.touches[0].clientY;
        const diff = currentY - startY.current;

        // Only allow pulling down
        if (diff > 0 && containerRef.current?.scrollTop === 0) {
            // Apply resistance to make pull feel natural
            const resistance = 0.5;
            const constrainedDiff = Math.min(diff * resistance, MAX_PULL);
            setPullDistance(constrainedDiff);

            // Prevent default scroll if pulling
            if (constrainedDiff > 10) {
                e.preventDefault();
            }
        }
    }, [isPulling, isRefreshing]);

    const handleTouchEnd = useCallback(async () => {
        if (!isPulling) return;
        setIsPulling(false);

        if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
            setIsRefreshing(true);
            if (navigator.vibrate) navigator.vibrate(20);

            try {
                await onRefresh?.();
            } finally {
                // Small delay for visual feedback
                setTimeout(() => {
                    setIsRefreshing(false);
                    setPullDistance(0);
                }, 300);
            }
        } else {
            setPullDistance(0);
        }
    }, [isPulling, pullDistance, isRefreshing, onRefresh]);

    const refreshProgress = Math.min(pullDistance / PULL_THRESHOLD, 1);
    const shouldTrigger = pullDistance >= PULL_THRESHOLD;

    return (
        <div className={clsx("relative overflow-hidden", className)}>
            {/* Pull indicator */}
            <div
                className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center justify-center transition-opacity z-10"
                style={{
                    top: Math.max(0, pullDistance - 50),
                    opacity: Math.min(refreshProgress * 2, 1)
                }}
            >
                <div
                    className={clsx(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                        shouldTrigger || isRefreshing
                            ? "bg-sky-500 text-white"
                            : "bg-slate-700 text-slate-400"
                    )}
                >
                    <RefreshCw
                        size={20}
                        className={clsx(isRefreshing && "animate-spin")}
                        style={{
                            transform: isRefreshing ? 'none' : `rotate(${refreshProgress * 180}deg)`,
                            transition: isPulling ? 'none' : 'transform 0.2s'
                        }}
                    />
                </div>
                <span className="text-xs text-slate-400 mt-1">
                    {isRefreshing ? 'Refreshing...' : shouldTrigger ? 'Release to refresh' : 'Pull to refresh'}
                </span>
            </div>

            {/* Content container */}
            <div
                ref={containerRef}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className="h-full overflow-y-auto"
                style={{
                    transform: `translateY(${pullDistance}px)`,
                    transition: isPulling ? 'none' : 'transform 0.2s ease-out'
                }}
            >
                {children}
            </div>
        </div>
    );
};

export default PullToRefresh;
