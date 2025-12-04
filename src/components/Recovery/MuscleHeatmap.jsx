import React, { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import clsx from 'clsx';
import Tooltip from '../common/Tooltip';

const MusclePath = ({ id, d, name, recovery = 100, onClick }) => {
    // Color scale: 0 (Red) -> 50 (Yellow) -> 100 (Green)
    const getColor = (score) => {
        if (score >= 90) return '#10b981'; // Emerald-500
        if (score >= 70) return '#34d399'; // Emerald-400
        if (score >= 50) return '#facc15'; // Yellow-400
        if (score >= 30) return '#fb923c'; // Orange-400
        return '#ef4444'; // Red-500
    };

    const color = getColor(recovery);

    return (
        <Tooltip content={`${name}: ${recovery}% Recovered`}>
            <path
                id={id}
                d={d}
                fill={color}
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="1"
                className="transition-all duration-500 hover:opacity-80 cursor-pointer hover:stroke-white"
                onClick={() => onClick && onClick(id)}
                style={{ filter: `drop-shadow(0 0 ${recovery < 50 ? '5px' : '0px'} ${color})` }}
            />
        </Tooltip>
    );
};

const MuscleHeatmap = ({ recoveryData = {} }) => {
    const [view, setView] = useState('front'); // 'front' or 'back'

    // Simplified SVG Paths (Abstract representation)
    // These are just placeholders. In a real app, we'd use a detailed SVG.
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
        <div className="flex flex-col items-center">
            <div className="flex gap-4 mb-4">
                <button
                    onClick={() => setView('front')}
                    className={clsx(
                        "px-4 py-1 rounded-full text-sm font-bold transition-all",
                        view === 'front' ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30" : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                    )}
                >
                    Front
                </button>
                <button
                    onClick={() => setView('back')}
                    className={clsx(
                        "px-4 py-1 rounded-full text-sm font-bold transition-all",
                        view === 'back' ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30" : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                    )}
                >
                    Back
                </button>
            </div>

            <div className="relative w-64 h-96 bg-slate-900/50 rounded-3xl border border-white/5 p-4 flex items-center justify-center">
                <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl">
                    {/* Silhouette / Body Outline */}
                    <g opacity="0.1" fill="currentColor" className="text-slate-400">
                        <path d="M100,20 C115,20 120,35 120,45 C120,55 135,60 145,65 C155,70 150,110 145,120 C140,130 135,125 135,140 C135,155 130,190 125,195 C120,200 110,195 110,180 C110,165 105,150 100,150 C95,150 90,165 90,180 C90,195 80,200 75,195 C70,190 65,155 65,140 C65,125 60,130 55,120 C50,110 45,70 55,65 C65,60 80,55 80,45 C80,35 85,20 100,20 Z" />
                    </g>

                    {/* Muscle Groups */}
                    {PATHS[view].map(muscle => (
                        <MusclePath
                            key={muscle.id}
                            {...muscle}
                            recovery={recoveryData[muscle.id] !== undefined ? recoveryData[muscle.id] : 100}
                        />
                    ))}
                </svg>

                {/* Legend */}
                <div className="absolute bottom-4 left-4 flex flex-col gap-1 text-[10px] text-slate-500 font-mono">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Fresh
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-yellow-400"></div> Recovering
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div> Fatigued
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MuscleHeatmap;
