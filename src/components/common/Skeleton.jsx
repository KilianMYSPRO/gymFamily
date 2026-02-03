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
    const variants = {
        text: "h-4 rounded-lg",
        circular: "rounded-full",
        rectangular: "rounded-2xl",
        card: "rounded-[2rem]"
    };

    return (
        <div
            className={clsx("bg-slate-800/50 animate-pulse", variants[variant], className)}
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
    <div className="bg-slate-900/40 p-6 rounded-[2.5rem] border border-white/5 space-y-4">
        <div className="flex items-start gap-4">
            <Skeleton variant="rectangular" className="w-12 h-12 shrink-0 rounded-2xl" />
            <div className="flex-1 space-y-3">
                <Skeleton variant="text" className="w-3/4 h-5" />
                <Skeleton variant="text" className="w-1/2 h-3" />
            </div>
        </div>
    </div>
);

/**
 * SkeletonExercise - A pre-built skeleton for exercise items
 */
export const SkeletonExercise = () => (
    <div className="bg-slate-900/40 p-6 rounded-[2.5rem] border border-white/5 space-y-6">
        <div className="flex items-center gap-4">
            <Skeleton variant="rectangular" className="w-10 h-10 shrink-0 rounded-xl" />
            <div className="flex-1 space-y-2">
                <Skeleton variant="text" className="w-2/3 h-4" />
                <Skeleton variant="text" className="w-1/3 h-3" />
            </div>
        </div>
        <div className="flex gap-3">
            <Skeleton variant="rectangular" className="flex-1 h-14 rounded-2xl" />
            <Skeleton variant="rectangular" className="flex-1 h-14 rounded-2xl" />
            <Skeleton variant="rectangular" className="w-16 h-14 rounded-2xl" />
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
    <div className="space-y-8">
        {/* Header skeleton */}
        <div className="space-y-2">
            <Skeleton variant="text" className="w-1/2 h-8" />
            <Skeleton variant="text" className="w-1/3 h-4" />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-4">
            {[1, 2].map((i) => (
                <Skeleton key={i} variant="rectangular" className="h-32 rounded-[2.5rem]" />
            ))}
        </div>

        {/* Streak card skeleton */}
        <Skeleton variant="rectangular" className="h-48 rounded-[2.5rem]" />

        {/* Content cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton variant="rectangular" className="h-64 rounded-[2.5rem]" />
            <Skeleton variant="rectangular" className="h-64 rounded-[2.5rem]" />
        </div>
    </div>
);

export default Skeleton;
