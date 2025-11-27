import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { TrendingUp, Calendar, ArrowUpRight, Weight } from 'lucide-react';
import clsx from 'clsx';

const Analytics = () => {
    const { history, weightHistory } = useStore();
    const [selectedExercise, setSelectedExercise] = useState('');
    const [metric, setMetric] = useState('weight'); // 'weight' or 'volume'

    // 1. Extract all unique exercise names from history
    const uniqueExercises = useMemo(() => {
        const names = new Set();
        history.forEach(session => {
            if (session.exercises) {
                session.exercises.forEach(ex => names.add(ex.name));
            }
        });
        return Array.from(names).sort();
    }, [history]);

    // 2. Process data for the selected exercise
    const chartData = useMemo(() => {
        if (!selectedExercise) return [];

        const data = history
            .filter(session => session.exercises && session.exercises.some(ex => ex.name === selectedExercise))
            .map(session => {
                // Find the exercise ID in this session
                const exerciseDef = session.exercises.find(ex => ex.name === selectedExercise);
                if (!exerciseDef) return null;

                // Find max weight lifted for this exercise in this session
                let maxWeight = 0;
                Object.keys(session.detailedSets || {}).forEach(key => {
                    if (key.startsWith(exerciseDef.id) && session.detailedSets[key].completed) {
                        const weight = parseFloat(session.detailedSets[key].weight);
                        const reps = parseFloat(session.detailedSets[key].reps || 0); // Default to 0 if missing

                        if (!isNaN(weight)) {
                            if (metric === 'weight') {
                                if (weight > maxWeight) maxWeight = weight;
                            } else {
                                // Volume = Weight * Reps
                                const volume = weight * reps;
                                if (volume > maxWeight) maxWeight = volume;
                            }
                        }
                    }
                });

                return {
                    date: new Date(session.date),
                    weight: maxWeight
                };
            })
            .filter(item => item && item.weight > 0) // Filter out sessions with no weight logged
            .sort((a, b) => a.date - b.date);

        return data;
    }, [history, selectedExercise]);

    // 3. Helper to generate SVG path
    const getPath = (data, width, height) => {
        if (data.length < 2) return '';

        const maxVal = Math.max(...data.map(d => d.weight)) * 1.1; // Add 10% headroom
        const minVal = Math.min(...data.map(d => d.weight)) * 0.9;
        const range = maxVal - minVal || 1;

        const points = data.map((d, i) => {
            const x = (i / (data.length - 1)) * width;
            const y = height - ((d.weight - minVal) / range) * height;
            return `${x},${y}`;
        });

        return `M ${points.join(' L ')}`;
    };

    const maxWeight = chartData.length > 0 ? Math.max(...chartData.map(d => d.weight)) : 0;
    const latestWeight = chartData.length > 0 ? chartData[chartData.length - 1].weight : 0;
    const firstWeight = chartData.length > 0 ? chartData[0].weight : 0;
    const progress = latestWeight - firstWeight;

    // 4. Process weight history data
    const weightChartData = useMemo(() => {
        if (!weightHistory || weightHistory.length === 0) return [];
        return weightHistory
            .map(entry => ({
                date: new Date(entry.date),
                weight: parseFloat(entry.weight)
            }))
            .sort((a, b) => a.date - b.date);
    }, [weightHistory]);

    const latestBodyWeight = weightChartData.length > 0 ? weightChartData[weightChartData.length - 1].weight : 0;
    const startBodyWeight = weightChartData.length > 0 ? weightChartData[0].weight : 0;
    const weightChange = latestBodyWeight - startBodyWeight;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Weight Section */}
            <div className="mb-12">
                <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
                    <Weight className="text-sky-400" /> Body Weight
                </h3>

                {weightChartData.length > 1 ? (
                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                        <div className="flex justify-between items-end mb-8">
                            <div>
                                <p className="text-slate-400 text-sm mb-1">Current Weight</p>
                                <p className="text-3xl font-bold text-white font-mono">{latestBodyWeight} <span className="text-sm text-slate-500 font-sans">kg</span></p>
                            </div>
                            <div className={clsx("text-right", weightChange <= 0 ? "text-emerald-400" : "text-red-400")}>
                                <p className="text-sm font-medium flex items-center justify-end gap-1">
                                    {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)} kg
                                    <ArrowUpRight size={16} className={weightChange < 0 ? "rotate-180" : ""} />
                                </p>
                                <p className="text-xs text-slate-500">Total Change</p>
                            </div>
                        </div>

                        <div className="h-64 w-full relative">
                            <svg viewBox="0 0 800 300" className="w-full h-full overflow-visible">
                                <line x1="0" y1="0" x2="800" y2="0" stroke="#1e293b" strokeDasharray="4" />
                                <line x1="0" y1="150" x2="800" y2="150" stroke="#1e293b" strokeDasharray="4" />
                                <line x1="0" y1="300" x2="800" y2="300" stroke="#1e293b" strokeDasharray="4" />

                                <path
                                    d={getPath(weightChartData, 800, 300)}
                                    fill="none"
                                    stroke="#0ea5e9"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="drop-shadow-[0_0_10px_rgba(14,165,233,0.3)]"
                                />

                                {weightChartData.map((d, i) => {
                                    const maxVal = Math.max(...weightChartData.map(d => d.weight)) * 1.1;
                                    const minVal = Math.min(...weightChartData.map(d => d.weight)) * 0.9;
                                    const range = maxVal - minVal || 1;
                                    const x = (i / (weightChartData.length - 1)) * 800;
                                    const y = 300 - ((d.weight - minVal) / range) * 300;

                                    return (
                                        <g key={i} className="group">
                                            <circle cx={x} cy={y} r="4" className="fill-slate-950 stroke-sky-400 stroke-2 group-hover:r-6 transition-all" />
                                            <foreignObject x={x - 50} y={y - 50} width="100" height="40" className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                <div className="bg-slate-800 text-white text-xs rounded px-2 py-1 text-center shadow-lg border border-slate-700">
                                                    {d.weight}kg
                                                    <div className="text-[10px] text-slate-400">{d.date.toLocaleDateString()}</div>
                                                </div>
                                            </foreignObject>
                                        </g>
                                    );
                                })}
                            </svg>
                        </div>

                        <div className="flex justify-between mt-4 text-xs text-slate-500 font-medium uppercase tracking-wider">
                            <span>{weightChartData[0].date.toLocaleDateString()}</span>
                            <span>{weightChartData[weightChartData.length - 1].date.toLocaleDateString()}</span>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8 border-2 border-dashed border-slate-800 rounded-2xl">
                        <p className="text-slate-400">Not enough weight data.</p>
                        <p className="text-sm text-slate-500">Log your weight in the Profile tab to see your progress.</p>
                    </div>
                )}
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <TrendingUp className="text-sky-400" /> Progress Tracker
                    </h3>
                    <p className="text-slate-400 text-sm">Visualize your strength gains over time.</p>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    <select
                        value={metric}
                        onChange={(e) => setMetric(e.target.value)}
                        className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block w-1/3 md:w-32 p-2.5"
                    >
                        <option value="weight">Max Weight</option>
                        <option value="volume">Max Volume</option>
                    </select>

                    <select
                        value={selectedExercise}
                        onChange={(e) => setSelectedExercise(e.target.value)}
                        className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block w-2/3 md:w-64 p-2.5"
                    >
                        <option value="">Select Exercise...</option>
                        {uniqueExercises.map(name => (
                            <option key={name} value={name}>{name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {selectedExercise ? (
                chartData.length > 1 ? (
                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                        <div className="flex justify-between items-end mb-8">
                            <div>
                                <p className="text-slate-400 text-sm mb-1">Current Max</p>
                                <p className="text-3xl font-bold text-white font-mono">{latestWeight} <span className="text-sm text-slate-500 font-sans">{metric === 'weight' ? 'kg' : 'kg·reps'}</span></p>
                            </div>
                            <div className={clsx("text-right", progress >= 0 ? "text-emerald-400" : "text-red-400")}>
                                <p className="text-sm font-medium flex items-center justify-end gap-1">
                                    {progress >= 0 ? '+' : ''}{progress} {metric === 'weight' ? 'kg' : 'vol'}
                                    <ArrowUpRight size={16} className={progress < 0 ? "rotate-180" : ""} />
                                </p>
                                <p className="text-xs text-slate-500">Since first log</p>
                            </div>
                        </div>

                        {/* Chart Area */}
                        <div className="h-64 w-full relative">
                            <svg viewBox="0 0 800 300" className="w-full h-full overflow-visible">
                                {/* Grid Lines */}
                                <line x1="0" y1="0" x2="800" y2="0" stroke="#1e293b" strokeDasharray="4" />
                                <line x1="0" y1="150" x2="800" y2="150" stroke="#1e293b" strokeDasharray="4" />
                                <line x1="0" y1="300" x2="800" y2="300" stroke="#1e293b" strokeDasharray="4" />

                                {/* Line Path */}
                                <path
                                    d={getPath(chartData, 800, 300)}
                                    fill="none"
                                    stroke="#0ea5e9"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="drop-shadow-[0_0_10px_rgba(14,165,233,0.3)]"
                                />

                                {/* Data Points */}
                                {chartData.map((d, i) => {
                                    const maxVal = Math.max(...chartData.map(d => d.weight)) * 1.1;
                                    const minVal = Math.min(...chartData.map(d => d.weight)) * 0.9;
                                    const range = maxVal - minVal || 1;
                                    const x = (i / (chartData.length - 1)) * 800;
                                    const y = 300 - ((d.weight - minVal) / range) * 300;

                                    return (
                                        <g key={i} className="group">
                                            <circle cx={x} cy={y} r="4" className="fill-slate-950 stroke-sky-400 stroke-2 group-hover:r-6 transition-all" />
                                            {/* Tooltip */}
                                            <foreignObject x={x - 50} y={y - 50} width="100" height="40" className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                <div className="bg-slate-800 text-white text-xs rounded px-2 py-1 text-center shadow-lg border border-slate-700">
                                                    {d.weight}{metric === 'weight' ? 'kg' : ' vol'}
                                                    <div className="text-[10px] text-slate-400">{d.date.toLocaleDateString()}</div>
                                                </div>
                                            </foreignObject>
                                        </g>
                                    );
                                })}
                            </svg>
                        </div>

                        <div className="flex justify-between mt-4 text-xs text-slate-500 font-medium uppercase tracking-wider">
                            <span>{chartData[0].date.toLocaleDateString()}</span>
                            <span>{chartData[chartData.length - 1].date.toLocaleDateString()}</span>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-2xl">
                        <TrendingUp className="mx-auto text-slate-600 mb-4" size={32} />
                        <p className="text-slate-400">Not enough data to chart.</p>
                        <p className="text-sm text-slate-500">Complete at least 2 workouts with this exercise.</p>
                    </div>
                )
            ) : (
                <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-2xl">
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-500">
                        <TrendingUp size={32} />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">Select an Exercise</h3>
                    <p className="text-slate-400">Choose an exercise above to see your progress.</p>
                </div>
            )}
        </div>
    );
};

export default Analytics;
