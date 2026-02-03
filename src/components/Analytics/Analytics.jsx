import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { TrendingUp, Calendar, ArrowUpRight, Weight, ChevronDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import clsx from 'clsx';
import { useLanguage } from '../../context/LanguageContext';

import { normalizeExercise } from '../../utils/exerciseNormalization';

const CustomTooltip = ({ active, payload, label, metric }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl">
                <p className="text-slate-400 text-xs mb-1">{new Date(label).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-sky-500"></div>
                    <p className="text-white font-mono font-bold">
                        {payload[0].value}
                        <span className="text-slate-500 text-xs ml-1 font-sans">
                            {metric === 'weight' ? 'kg' : 'vol'}
                        </span>
                    </p>
                </div>
            </div>
        );
    }
    return null;
};

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
                session.exercises.forEach(ex => {
                    const normalizedName = normalizeExercise(ex.name, ex.originalId);
                    names.add(normalizedName);
                });
            }
        });
        return Array.from(names).sort();
    }, [history]);

    // 2. Process data for the selected exercise
    const chartData = useMemo(() => {
        if (!selectedExercise) return [];

        const data = history
            // Filter sessions that contain the selected exercise (normalized)
            .filter(session => session.exercises && session.exercises.some(ex => normalizeExercise(ex.name, ex.originalId) === selectedExercise))
            .map(session => {
                // Find all exercise instances in this session that match the selected normalized name
                const exerciseDefs = session.exercises.filter(ex => normalizeExercise(ex.name, ex.originalId) === selectedExercise);

                if (exerciseDefs.length === 0) return null;

                // Find max weight/volume across all matching exercises in this session
                let maxVal = 0;

                exerciseDefs.forEach(exerciseDef => {
                    Object.keys(session.detailedSets || {}).forEach(key => {
                        if (key.startsWith(exerciseDef.id) && session.detailedSets[key].completed) {
                            const weight = parseFloat(session.detailedSets[key].weight);
                            const reps = parseFloat(session.detailedSets[key].reps || 0);

                            if (!isNaN(weight)) {
                                if (metric === 'weight') {
                                    if (weight > maxVal) maxVal = weight;
                                } else {
                                    // Volume = Weight * Reps
                                    const volume = weight * reps;
                                    if (volume > maxVal) maxVal = volume;
                                }
                            }
                        }
                    });
                });

                return {
                    date: new Date(session.date),
                    weight: maxVal,
                    // We don't strictly need originalId for the chart points
                };
            })
            .filter(item => item && item.weight > 0) // Filter out sessions with no weight logged
            .sort((a, b) => a.date - b.date);

        return data;
    }, [history, selectedExercise, metric]);


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
        <div className="space-y-10 animate-fade-in pb-12">
            {/* Body Weight Section */}
            <div className="bg-slate-900/40 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/5 shadow-xl">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-sky-400 shadow-inner">
                        <Weight size={20} />
                    </div>
                    <h3 className="text-xl font-black italic text-white uppercase tracking-tight">
                        {t('analytics.bodyWeight')}
                    </h3>
                </div>

                {weightChartData.length > 1 ? (
                    <div className="space-y-8">
                        <div className="flex justify-between items-end px-2">
                            <div>
                                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">{t('analytics.currentWeight')}</p>
                                <p className="text-4xl font-black italic text-white leading-none">
                                    {latestBodyWeight} <span className="text-sm not-italic text-slate-600 uppercase font-bold ml-1">kg</span>
                                </p>
                            </div>
                            <div className={clsx("text-right px-3 py-2 rounded-2xl border", 
                                weightChange <= 0 ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : "text-red-400 bg-red-500/10 border-red-500/20")}>
                                <p className="text-sm font-black flex items-center justify-end gap-1">
                                    {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)}
                                    <ArrowUpRight size={16} className={weightChange < 0 ? "rotate-180" : ""} />
                                </p>
                                <p className="text-[8px] font-black uppercase tracking-tighter opacity-60">{t('analytics.totalChange')}</p>
                            </div>
                        </div>

                        <div className="h-64 w-full" style={{ height: 256 }}>
                            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                <LineChart data={weightChartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={(date) => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        stroke="#475569"
                                        tick={{ fontSize: 9, fontWeight: 900 }}
                                        tickLine={false}
                                        axisLine={false}
                                        minTickGap={30}
                                    />
                                    <YAxis
                                        domain={['auto', 'auto']}
                                        stroke="#475569"
                                        tick={{ fontSize: 9, fontWeight: 900 }}
                                        tickLine={false}
                                        axisLine={false}
                                        width={30}
                                    />
                                    <Tooltip content={<CustomTooltip metric="weight" />} cursor={{ stroke: '#0ea5e9', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                    <Line
                                        type="monotone"
                                        dataKey="weight"
                                        stroke="#0ea5e9"
                                        strokeWidth={4}
                                        dot={{ fill: '#020617', stroke: '#0ea5e9', strokeWidth: 2, r: 4 }}
                                        activeDot={{ r: 6, fill: '#0ea5e9', stroke: '#fff', strokeWidth: 2 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-3xl">
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-2">{t('analytics.notEnoughWeightData')}</p>
                        <p className="text-[10px] text-slate-600 font-medium">{t('analytics.logWeightHint')}</p>
                    </div>
                )}
            </div>

            {/* Performance Progress Section */}
            <div className="bg-slate-900/40 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/5 shadow-xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-sky-400 shadow-inner">
                            <TrendingUp size={20} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black italic text-white uppercase tracking-tight">
                                {t('analytics.progressTracker')}
                            </h3>
                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mt-0.5">{t('analytics.visualizeGains')}</p>
                        </div>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto">
                        <div className="relative flex-1 md:w-32">
                            <select
                                value={metric}
                                onChange={(e) => setMetric(e.target.value)}
                                className="w-full bg-slate-950/50 border border-slate-800 text-white text-[10px] font-black uppercase tracking-widest rounded-xl p-3 focus:border-sky-500 transition-all appearance-none"
                            >
                                <option value="weight">{t('analytics.maxWeight')}</option>
                                <option value="volume">{t('analytics.maxVolume')}</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" size={14} />
                        </div>

                        <div className="relative flex-[2] md:w-64">
                            <select
                                value={selectedExercise}
                                onChange={(e) => setSelectedExercise(e.target.value)}
                                className="w-full bg-slate-950/50 border border-slate-800 text-white text-[10px] font-black uppercase tracking-widest rounded-xl p-3 focus:border-sky-500 transition-all appearance-none"
                            >
                                <option value="">{t('analytics.selectExercise')}</option>
                                {uniqueExercises.map(name => (
                                    <option key={name} value={name}>{name}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" size={14} />
                        </div>
                    </div>
                </div>

                {selectedExercise ? (
                    chartData.length > 1 ? (
                        <div className="space-y-8">
                            <div className="flex justify-between items-end px-2">
                                <div>
                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">{t('analytics.currentMax')}</p>
                                    <p className="text-4xl font-black italic text-white leading-none">
                                        {latestWeight} <span className="text-sm not-italic text-slate-600 uppercase font-bold ml-1">{metric === 'weight' ? 'kg' : 'vol'}</span>
                                    </p>
                                </div>
                                <div className={clsx("text-right px-3 py-2 rounded-2xl border", 
                                    progress >= 0 ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : "text-red-400 bg-red-500/10 border-red-500/20")}>
                                    <p className="text-sm font-black flex items-center justify-end gap-1">
                                        {progress >= 0 ? '+' : ''}{progress}
                                        <ArrowUpRight size={16} className={progress < 0 ? "rotate-180" : ""} />
                                    </p>
                                    <p className="text-[8px] font-black uppercase tracking-tighter opacity-60">{t('analytics.sinceFirstLog')}</p>
                                </div>
                            </div>

                            <div className="h-64 w-full" style={{ height: 256 }}>
                                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                        <XAxis
                                            dataKey="date"
                                            tickFormatter={(date) => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            stroke="#475569"
                                            tick={{ fontSize: 9, fontWeight: 900 }}
                                            tickLine={false}
                                            axisLine={false}
                                            minTickGap={30}
                                        />
                                        <YAxis
                                            domain={['auto', 'auto']}
                                            stroke="#475569"
                                            tick={{ fontSize: 9, fontWeight: 900 }}
                                            tickLine={false}
                                            axisLine={false}
                                            width={30}
                                        />
                                        <Tooltip content={<CustomTooltip metric={metric} />} cursor={{ stroke: '#0ea5e9', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                        <Line
                                            type="monotone"
                                            dataKey="weight"
                                            stroke="#0ea5e9"
                                            strokeWidth={4}
                                            dot={{ fill: '#020617', stroke: '#0ea5e9', strokeWidth: 2, r: 4 }}
                                            activeDot={{ r: 6, fill: '#0ea5e9', stroke: '#fff', strokeWidth: 2 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-16 border-2 border-dashed border-white/5 rounded-[2.5rem]">
                            <TrendingUp className="mx-auto text-slate-800 mb-4" size={40} />
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-2">{t('analytics.notEnoughData')}</p>
                            <p className="text-[10px] text-slate-600 font-medium">{t('analytics.completeWorkoutsHint')}</p>
                        </div>
                    )
                ) : (
                    <div className="text-center py-16 border-2 border-dashed border-white/5 rounded-[2.5rem]">
                        <div className="w-16 h-16 bg-slate-800/50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-slate-600 shadow-inner">
                            <TrendingUp size={32} />
                        </div>
                        <h3 className="text-lg font-black italic text-white uppercase tracking-tight mb-2">{t('analytics.selectExerciseTitle')}</h3>
                        <p className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em]">{t('analytics.selectExerciseSubtitle')}</p>
                    </div>
                )}
            </div>
        </div >
    );
};

export default Analytics;
