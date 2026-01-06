import React from 'react';
import clsx from 'clsx';

/**
 * Skeleton - A loading placeholder component
 * @param {string} variant - 'text', 'circular', 'rectangular', 'card'
 * @param {string} width - Width of the skeleton (Tailwind class or CSS value)
 * @param {string} height - Height of the skeleton (Tailwind class or CSS value)
 * @param {string} className - Additional classes
 */
const Skeleton = ({ variant = 'rectangular', width, height, className = '' }) => {
    const baseClasses = "bg-slate-800 animate-pulse";

    const variants = {
        text: "h-4 rounded",
        circular: "rounded-full",
        rectangular: "rounded-xl",
        card: "rounded-2xl"
    };

    return (
        <div
            className={clsx(baseClasses, variants[variant], className)}
            style={{
                width: width || undefined,
                height: height || undefined
            }}
        />
    );
};

/**
 * SkeletonCard - A pre-built skeleton for workout/history cards
 */
export const SkeletonCard = () => (
    <div className="glass-card space-y-4">
        <div className="flex items-start gap-4">
            <Skeleton variant="rectangular" className="w-12 h-12 shrink-0" />
            <div className="flex-1 space-y-2">
                <Skeleton variant="text" className="w-3/4" />
                <Skeleton variant="text" className="w-1/2" />
            </div>
        </div>
    </div>
);

/**
 * SkeletonExercise - A pre-built skeleton for exercise items
 */
export const SkeletonExercise = () => (
    <div className="glass-card space-y-3">
        <div className="flex items-center gap-3">
            <Skeleton variant="circular" className="w-10 h-10 shrink-0" />
            <div className="flex-1 space-y-2">
                <Skeleton variant="text" className="w-2/3" />
                <Skeleton variant="text" className="w-1/3 h-3" />
            </div>
        </div>
        <div className="flex gap-2">
            <Skeleton variant="rectangular" className="flex-1 h-12" />
            <Skeleton variant="rectangular" className="flex-1 h-12" />
            <Skeleton variant="rectangular" className="flex-1 h-12" />
        </div>
    </div>
);

/**
 * SkeletonList - Renders a list of skeleton items
 */
export const SkeletonList = ({ count = 3, type = 'card' }) => {
    const SkeletonComponent = type === 'exercise' ? SkeletonExercise : SkeletonCard;

    return (
        <div className="space-y-4">
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonComponent key={i} />
            ))}
        </div>
    );
};

/**
 * SkeletonDashboard - Pre-built skeleton for dashboard stats
 */
export const SkeletonDashboard = () => (
    <div className="space-y-6">
        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} variant="card" className="h-24" />
            ))}
        </div>

        {/* Content cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton variant="card" className="h-48" />
            <Skeleton variant="card" className="h-48" />
        </div>
    </div>
);

export default Skeleton;
