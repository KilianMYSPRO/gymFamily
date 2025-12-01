import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { TrendingUp, Calendar, ArrowUpRight, Weight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import clsx from 'clsx';
import { useLanguage } from '../../context/LanguageContext';

const Analytics = () => {
    const { t } = useLanguage();
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
                    weight: maxWeight,
                    originalId: exerciseDef.originalId || null
                };
            })
            .filter(item => item && item.weight > 0) // Filter out sessions with no weight logged
            .sort((a, b) => a.date - b.date);

        return data;
    }, [history, selectedExercise]);

    // Custom Tooltip Component
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-800 text-white text-xs rounded px-2 py-1 text-center shadow-lg border border-slate-700">
                    <p className="font-bold">{payload[0].value} {metric === 'weight' ? 'kg' : (payload[0].unit || 'kg')}</p>
                    <p className="text-[10px] text-slate-400">{new Date(label).toLocaleDateString()}</p>
                </div>
            );
        }
        return null;
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
                    <Weight className="text-sky-400" /> {t('analytics.bodyWeight')}
                </h3>

                {weightChartData.length > 1 ? (
                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                        <div className="flex justify-between items-end mb-8">
                            <div>
                                <p className="text-slate-400 text-sm mb-1">{t('analytics.currentWeight')}</p>
                                <p className="text-3xl font-bold text-white font-mono">{latestBodyWeight} <span className="text-sm text-slate-500 font-sans">kg</span></p>
                            </div>
                            <div className={clsx("text-right", weightChange <= 0 ? "text-emerald-400" : "text-red-400")}>
                                <p className="text-sm font-medium flex items-center justify-end gap-1">
                                    {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)} kg
                                    <ArrowUpRight size={16} className={weightChange < 0 ? "rotate-180" : ""} />
                                </p>
                                <p className="text-xs text-slate-500">{t('analytics.totalChange')}</p>
                            </div>
                        </div>

                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={weightChartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={(date) => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        stroke="#64748b"
                                        tick={{ fontSize: 10 }}
                                        tickLine={false}
                                        axisLine={false}
                                        minTickGap={30}
                                    />
                                    <YAxis
                                        domain={['auto', 'auto']}
                                        stroke="#64748b"
                                        tick={{ fontSize: 10 }}
                                        tickLine={false}
                                        axisLine={false}
                                        width={30}
                                    />
                                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#38bdf8', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                    <Line
                                        type="monotone"
                                        dataKey="weight"
                                        stroke="#0ea5e9"
                                        strokeWidth={3}
                                        dot={{ fill: '#020617', stroke: '#0ea5e9', strokeWidth: 2, r: 4 }}
                                        activeDot={{ r: 6, fill: '#0ea5e9' }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="flex justify-between mt-4 text-xs text-slate-500 font-medium uppercase tracking-wider">
                            <span>{weightChartData[0].date.toLocaleDateString()}</span>
                            <span>{weightChartData[weightChartData.length - 1].date.toLocaleDateString()}</span>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8 border-2 border-dashed border-slate-800 rounded-2xl">
                        <p className="text-slate-400">{t('analytics.notEnoughWeightData')}</p>
                        <p className="text-sm text-slate-500">{t('analytics.logWeightHint')}</p>
                    </div>
                )}
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <TrendingUp className="text-sky-400" /> {t('analytics.progressTracker')}
                    </h3>
                    <p className="text-slate-400 text-sm">{t('analytics.visualizeGains')}</p>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    <select
                        value={metric}
                        onChange={(e) => setMetric(e.target.value)}
                        className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block w-1/3 md:w-32 p-2.5"
                    >
                        <option value="weight">{t('analytics.maxWeight')}</option>
                        <option value="volume">{t('analytics.maxVolume')}</option>
                    </select>

                    <select
                        value={selectedExercise}
                        onChange={(e) => setSelectedExercise(e.target.value)}
                        className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block w-2/3 md:w-64 p-2.5"
                    >
                        <option value="">{t('analytics.selectExercise')}</option>
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
                                <p className="text-slate-400 text-sm mb-1">{t('analytics.currentMax')}</p>
                                <p className="text-3xl font-bold text-white font-mono">{latestWeight} <span className="text-sm text-slate-500 font-sans">{metric === 'weight' ? 'kg' : 'kg·reps'}</span></p>
                            </div>
                            <div className={clsx("text-right", progress >= 0 ? "text-emerald-400" : "text-red-400")}>
                                <p className="text-sm font-medium flex items-center justify-end gap-1">
                                    {progress >= 0 ? '+' : ''}{progress} {metric === 'weight' ? 'kg' : 'vol'}
                                    <ArrowUpRight size={16} className={progress < 0 ? "rotate-180" : ""} />
                                </p>
                                <p className="text-xs text-slate-500">{t('analytics.sinceFirstLog')}</p>
                            </div>
                        </div>

                        {/* Chart Area */}
                        {/* Chart Area */}
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={(date) => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        stroke="#64748b"
                                        tick={{ fontSize: 10 }}
                                        tickLine={false}
                                        axisLine={false}
                                        minTickGap={30}
                                    />
                                    <YAxis
                                        domain={['auto', 'auto']}
                                        stroke="#64748b"
                                        tick={{ fontSize: 10 }}
                                        tickLine={false}
                                        axisLine={false}
                                        width={30}
                                    />
                                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#38bdf8', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                    <Line
                                        type="monotone"
                                        dataKey="weight"
                                        stroke="#0ea5e9"
                                        strokeWidth={3}
                                        dot={{ fill: '#020617', stroke: '#0ea5e9', strokeWidth: 2, r: 4 }}
                                        activeDot={{ r: 6, fill: '#0ea5e9' }}
                                        unit={metric === 'weight' ? 'kg' : ' vol'}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="flex justify-between mt-4 text-xs text-slate-500 font-medium uppercase tracking-wider">
                            <span>{chartData[0].date.toLocaleDateString()}</span>
                            <span>{chartData[chartData.length - 1].date.toLocaleDateString()}</span>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-2xl">
                        <TrendingUp className="mx-auto text-slate-600 mb-4" size={32} />
                        <p className="text-slate-400">{t('analytics.notEnoughData')}</p>
                        <p className="text-sm text-slate-500">{t('analytics.completeWorkoutsHint')}</p>
                    </div>
                )
            ) : (
                <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-2xl">
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-500">
                        <TrendingUp size={32} />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">{t('analytics.selectExerciseTitle')}</h3>
                    <p className="text-slate-400">{t('analytics.selectExerciseSubtitle')}</p>
                </div>
            )}
        </div >
    );
};

export default Analytics;
