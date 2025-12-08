import React, { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import clsx from 'clsx';
import { useLanguage } from '../../context/LanguageContext';

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
    const { t } = useLanguage();
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

    // Detailed Organic SVG Paths
    const PATHS = {
        front: [
            // Neck
            { id: 'neck', name: 'Neck', d: 'M 94 42 Q 100 45 106 42 L 106 50 Q 100 52 94 50 Z' },
            // Traps (Front view)
            { id: 'traps', name: 'Traps', d: 'M 94 45 L 80 52 L 85 55 L 94 50 Z M 106 45 L 120 52 L 115 55 L 106 50 Z' },
            // Shoulders (Delts)
            { id: 'shoulders', name: 'Shoulders', d: 'M 80 52 Q 65 52 65 65 Q 65 75 75 75 L 82 68 Z M 120 52 Q 135 52 135 65 Q 135 75 125 75 L 118 68 Z' },
            // Chest (Pecs)
            { id: 'chest', name: 'Chest', d: 'M 85 58 Q 100 65 115 58 L 115 75 Q 100 85 85 75 Z' },
            // Biceps
            { id: 'biceps', name: 'Biceps', d: 'M 75 75 Q 68 85 70 95 L 80 95 Q 82 85 82 75 Z M 125 75 Q 132 85 130 95 L 120 95 Q 118 85 118 75 Z' },
            // Forearms
            { id: 'forearms', name: 'Forearms', d: 'M 70 95 Q 60 105 62 120 L 75 120 Q 78 105 80 95 Z M 130 95 Q 140 105 138 120 L 125 120 Q 122 105 120 95 Z' },
            // Abs
            { id: 'abs', name: 'Abs', d: 'M 88 78 L 112 78 L 110 105 Q 100 110 90 105 Z' },
            // Obliques (part of abs/core)
            { id: 'abs', name: 'Obliques', d: 'M 88 78 Q 82 90 85 105 L 90 105 L 88 78 Z M 112 78 Q 118 90 115 105 L 110 105 L 112 78 Z' },
            // Quads
            { id: 'quads', name: 'Quads', d: 'M 85 110 Q 70 130 75 155 L 92 160 L 95 115 Z M 115 110 Q 130 130 125 155 L 108 160 L 105 115 Z' },
            // Adductors
            { id: 'legs_inner', name: 'Adductors', d: 'M 95 115 L 92 145 L 100 140 L 108 145 L 105 115 Z' },
            // Calves (Front)
            { id: 'calves', name: 'Calves', d: 'M 78 165 Q 72 175 75 190 L 88 190 L 90 165 Z M 122 165 Q 128 175 125 190 L 112 190 L 110 165 Z' },
        ],
        back: [
            // Traps
            { id: 'traps', name: 'Traps', d: 'M 92 45 L 108 45 L 115 55 L 100 75 L 85 55 Z' },
            // Shoulders (Rear Delts)
            { id: 'shoulders', name: 'Rear Delts', d: 'M 75 55 L 85 55 L 85 65 L 70 62 Z M 125 55 L 115 55 L 115 65 L 130 62 Z' },
            // Lats
            { id: 'lats', name: 'Lats', d: 'M 85 60 L 75 80 L 90 95 L 95 75 Z M 115 60 L 125 80 L 110 95 L 105 75 Z' },
            // Triceps
            { id: 'triceps', name: 'Triceps', d: 'M 70 65 Q 62 75 65 90 L 75 90 Q 78 75 80 65 Z M 130 65 Q 138 75 135 90 L 125 90 Q 122 75 120 65 Z' },
            // Forearms (Back)
            { id: 'forearms', name: 'Forearms', d: 'M 65 90 Q 58 105 60 120 L 72 120 Q 75 105 75 90 Z M 135 90 Q 142 105 140 120 L 128 120 Q 125 105 125 90 Z' },
            // Lower Back
            { id: 'lower_back', name: 'Lower Back', d: 'M 90 95 L 110 95 L 108 110 L 92 110 Z' },
            // Glutes
            { id: 'glutes', name: 'Glutes', d: 'M 85 110 Q 75 120 85 130 L 100 130 L 100 110 Z M 115 110 Q 125 120 115 130 L 100 130 L 100 110 Z' },
            // Hamstrings
            { id: 'hamstrings', name: 'Hamstrings', d: 'M 85 130 L 82 160 L 95 160 L 98 130 Z M 115 130 L 118 160 L 105 160 L 102 130 Z' },
            // Calves (Back)
            { id: 'calves', name: 'Calves', d: 'M 82 165 Q 75 175 82 190 L 92 190 Q 95 175 95 165 Z M 118 165 Q 125 175 118 190 L 108 190 Q 105 175 105 165 Z' },
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
                            parseInt(tooltip.content.split(': ')[1]) === 100 ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" :
                                parseInt(tooltip.content.split(': ')[1]) > 50 ? "bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.8)]" :
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
                    {t('heatmap.front')}
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
                    {t('heatmap.back')}
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

                    {/* Silhouette / Body Outline - Refined */}
                    <g opacity="0.1" fill="currentColor" className="text-slate-300">
                        <path d="M100,35 C105,35 108,38 108,42 L115,45 L135,50 C145,52 145,65 140,75 L135,100 L140,120 L130,120 L125,100 L125,150 L115,190 L105,190 L102,150 L100,140 L98,150 L95,190 L85,190 L75,150 L75,100 L70,120 L60,120 L65,100 L60,75 C55,65 55,52 65,50 L85,45 L92,42 C92,38 95,35 100,35 Z" />
                    </g>

                    {/* Muscle Groups */}
                    {PATHS[view].map((muscle, idx) => (
                        <MusclePath
                            key={`${muscle.id}-${idx}`} // Use index to allow duplicate IDs (e.g. split abs)
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
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.5)]"></div> {t('heatmap.fresh')}
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 shadow-[0_0_5px_rgba(250,204,21,0.5)]"></div> {t('heatmap.recovering')}
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)] animate-pulse"></div> {t('heatmap.fatigued')}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MuscleHeatmap;
