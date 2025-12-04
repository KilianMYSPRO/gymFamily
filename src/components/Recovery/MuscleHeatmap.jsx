import React, { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import clsx from 'clsx';

const MusclePath = ({ id, d, name, recovery = 100, onHover, onLeave, onClick }) => {
    // Determine color state
    let fillId = "url(#grad-green)";
    let filterId = "";
    let className = "transition-all duration-500 cursor-pointer hover:stroke-white hover:opacity-100 opacity-90";

    if (recovery < 50) {
        fillId = "url(#grad-red)";
        filterId = "url(#glow-red)";
        className += " animate-pulse-slow"; // Custom slow pulse
    } else if (recovery < 90) {
        fillId = "url(#grad-yellow)";
    }

    return (
        <path
            id={id}
            d={d}
            fill={fillId}
            filter={filterId}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="0.5"
            className={className}
            onMouseEnter={(e) => onHover && onHover(e, name, recovery)}
            onMouseLeave={onLeave}
            onClick={() => onClick && onClick(id)}
        />
    );
};

const MuscleHeatmap = ({ recoveryData = {} }) => {
    const [view, setView] = useState('front'); // 'front' or 'back'
    const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, content: '' });

    const handleHover = (e, name, recovery) => {
        const rect = e.target.getBoundingClientRect();
        setTooltip({
            visible: true,
            x: rect.left + rect.width / 2,
            y: rect.top, // Position above the element
            content: `${name}: ${recovery}%`
        });
    };

    const handleLeave = () => {
        setTooltip({ ...tooltip, visible: false });
    };

    // Simplified SVG Paths (Abstract representation)
    const PATHS = {
        front: [
            { id: 'chest', name: 'Chest', d: 'M 85 60 Q 100 70 115 60 L 115 80 Q 100 90 85 80 Z' }, // Chest
            { id: 'abs', name: 'Abs', d: 'M 90 80 L 110 80 L 108 110 L 92 110 Z' }, // Abs
            { id: 'shoulders', name: 'Shoulders', d: 'M 70 60 Q 80 55 85 60 L 85 75 Q 75 75 70 60 Z M 130 60 Q 120 55 115 60 L 115 75 Q 125 75 130 60 Z' }, // Delts
            { id: 'biceps', name: 'Biceps', d: 'M 70 75 L 65 95 L 75 95 L 80 75 Z M 130 75 L 135 95 L 125 95 L 120 75 Z' }, // Biceps
            { id: 'forearms', name: 'Forearms', d: 'M 65 95 L 60 115 L 70 115 L 75 95 Z M 135 95 L 140 115 L 130 115 L 125 95 Z' }, // Forearms
            { id: 'quads', name: 'Quads', d: 'M 85 115 L 115 115 L 112 150 L 100 155 L 88 150 Z' }, // Quads (merged for simplicity)
            { id: 'legs_inner', name: 'Adductors', d: 'M 98 115 L 102 115 L 101 140 L 99 140 Z' }, // Inner Thighs
            { id: 'neck', name: 'Neck', d: 'M 95 45 L 105 45 L 105 55 L 95 55 Z' }, // Neck
        ],
        back: [
            { id: 'traps', name: 'Traps', d: 'M 90 55 L 110 55 L 115 65 L 85 65 Z' }, // Traps
            { id: 'lats', name: 'Lats', d: 'M 85 65 L 115 65 L 110 90 L 90 90 Z' }, // Lats
            { id: 'lower_back', name: 'Lower Back', d: 'M 90 90 L 110 90 L 110 100 L 90 100 Z' }, // Lower Back
            { id: 'glutes', name: 'Glutes', d: 'M 85 100 L 115 100 L 115 115 L 85 115 Z' }, // Glutes
            { id: 'hamstrings', name: 'Hamstrings', d: 'M 88 115 L 112 115 L 110 145 L 90 145 Z' }, // Hams
            { id: 'calves', name: 'Calves', d: 'M 90 145 L 110 145 L 108 170 L 92 170 Z' }, // Calves
            { id: 'triceps', name: 'Triceps', d: 'M 70 65 L 80 65 L 78 85 L 72 85 Z M 130 65 L 120 65 L 122 85 L 128 85 Z' }, // Triceps
            { id: 'shoulders', name: 'Rear Delts', d: 'M 70 60 Q 80 55 85 60 L 85 70 L 70 65 Z M 130 60 Q 120 55 115 60 L 115 70 L 130 65 Z' }, // Rear Delts
        ]
    };

    return (
        <div className="flex flex-col items-center relative w-full">
            {/* Custom Tooltip Portal/Overlay */}
            {tooltip.visible && (
                <div
                    className="fixed z-50 px-3 py-1.5 text-xs font-bold text-white bg-slate-900/90 backdrop-blur-md border border-white/10 rounded-lg shadow-xl pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2 transition-all duration-200"
                    style={{ left: tooltip.x, top: tooltip.y }}
                >
                    <div className="flex items-center gap-2">
                        <div className={clsx("w-2 h-2 rounded-full",
                            tooltip.content.includes("100%") ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" :
                                tooltip.content.includes("Recovering") ? "bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.8)]" :
                                    "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"
                        )} />
                        {tooltip.content}
                    </div>
                </div>
            )}

            <div className="flex gap-2 mb-6 bg-slate-900/50 p-1 rounded-full border border-white/5 backdrop-blur-sm">
                <button
                    onClick={() => setView('front')}
                    className={clsx(
                        "px-6 py-1.5 rounded-full text-xs font-bold transition-all duration-300",
                        view === 'front'
                            ? "bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                            : "text-slate-400 hover:text-white hover:bg-white/5"
                    )}
                >
                    FRONT
                </button>
                <button
                    onClick={() => setView('back')}
                    className={clsx(
                        "px-6 py-1.5 rounded-full text-xs font-bold transition-all duration-300",
                        view === 'back'
                            ? "bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                            : "text-slate-400 hover:text-white hover:bg-white/5"
                    )}
                >
                    BACK
                </button>
            </div>

            <div className="relative w-full max-w-[280px] aspect-[3/4] flex items-center justify-center">
                {/* Background Glow */}
                <div className="absolute inset-0 bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none" />

                <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl z-10">
                    <defs>
                        {/* Gradients */}
                        <linearGradient id="grad-green" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#34d399" />
                            <stop offset="100%" stopColor="#059669" />
                        </linearGradient>
                        <linearGradient id="grad-yellow" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#facc15" />
                            <stop offset="100%" stopColor="#ca8a04" />
                        </linearGradient>
                        <linearGradient id="grad-red" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#ef4444" />
                            <stop offset="100%" stopColor="#b91c1c" />
                        </linearGradient>

                        {/* Glow Filters */}
                        <filter id="glow-red" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    {/* Tech/Grid Background Elements */}
                    <g opacity="0.05" stroke="currentColor" strokeWidth="0.5" className="text-indigo-200">
                        <circle cx="100" cy="100" r="80" fill="none" strokeDasharray="4 4" />
                        <circle cx="100" cy="100" r="60" fill="none" />
                        <path d="M100,20 L100,180" />
                        <path d="M20,100 L180,100" />
                    </g>

                    {/* Silhouette / Body Outline */}
                    <g opacity="0.1" fill="currentColor" className="text-slate-300">
                        <path d="M100,20 C115,20 120,35 120,45 C120,55 135,60 145,65 C155,70 150,110 145,120 C140,130 135,125 135,140 C135,155 130,190 125,195 C120,200 110,195 110,180 C110,165 105,150 100,150 C95,150 90,165 90,180 C90,195 80,200 75,195 C70,190 65,155 65,140 C65,125 60,130 55,120 C50,110 45,70 55,65 C65,60 80,55 80,45 C80,35 85,20 100,20 Z" />
                    </g>

                    {/* Muscle Groups */}
                    {PATHS[view].map(muscle => (
                        <MusclePath
                            key={muscle.id}
                            {...muscle}
                            recovery={recoveryData[muscle.id] !== undefined ? recoveryData[muscle.id] : 100}
                            onHover={handleHover}
                            onLeave={handleLeave}
                        />
                    ))}
                </svg>

                {/* Legend */}
                <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-4 text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.5)]"></div> Fresh
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 shadow-[0_0_5px_rgba(250,204,21,0.5)]"></div> Recov
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)] animate-pulse"></div> Tired
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MuscleHeatmap;
