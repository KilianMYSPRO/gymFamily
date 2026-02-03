import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Dumbbell, Clock, TrendingUp, Calendar, ArrowRight, Trash2, CheckCircle2, Share2, Play, Zap, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import StreakCard from '../Gamification/StreakCard';
import WorkoutSummaryCard from '../History/WorkoutSummaryCard';
import MuscleHeatmap from '../Recovery/MuscleHeatmap';
import { calculateGamificationStats } from '../../utils/gamification';
import { calculateRecovery } from '../../utils/recovery';
import { useLanguage } from '../../context/LanguageContext';

const Dashboard = ({ onViewChange }) => {
    const { t } = useLanguage();
    const { activeProfile, workouts = [], history = [], deleteLog, activeWorkout } = useStore();
    const [selectedSummary, setSelectedSummary] = useState(null);

    // Calculate Most Used Plans
    const mostUsedWorkouts = React.useMemo(() => {
        if (!history || !workouts) return [];

        const frequency = {};
        history.forEach(h => {
            if (h.workoutId) {
                frequency[h.workoutId] = (frequency[h.workoutId] || 0) + 1;
            }
        });

        return workouts
            .map(w => ({ ...w, count: frequency[w.id] || 0 }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 3);
    }, [history, workouts]);

    const recoveryData = React.useMemo(() => calculateRecovery(history), [history]);
    const gamificationStats = React.useMemo(() => calculateGamificationStats(history), [history]);
    // Safe Weekly Activity Data
    const getWeeklyActivity = () => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const today = new Date();
        const currentDay = today.getDay(); // 0-6
        const diff = today.getDate() - currentDay + (currentDay === 0 ? -6 : 1); // adjust when day is sunday
        const monday = new Date(today);
        monday.setDate(diff);

        const weekDays = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(monday);
            d.setDate(d.getDate() + i);
            return d;
        });

        return weekDays.map(date => {
            try {
                const dayStr = date.toISOString().split('T')[0];
                const count = Array.isArray(history) ? history.filter(h =>
                    h && h.date && h.date.startsWith(dayStr)
                ).length : 0;
                return { day: days[date.getDay()], count, isToday: false };
            } catch {
                return { day: days[date.getDay()], count: 0, isToday: false };
            }
        });
    };

    const weeklyActivity = getWeeklyActivity();


    // Safe History Processing
    const recentHistory = Array.isArray(history) ? history
        .filter(h => h && h.date && !isNaN(new Date(h.date).getTime())) // Strict date check
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 3) : [];




    if (!activeProfile) return <div className="text-white p-8">{t('common.loading')}</div>;

    return (
        <div className="text-white p-4 md:p-6 space-y-6 pb-24 animate-enter">
            {selectedSummary && (
                <WorkoutSummaryCard
                    workout={selectedSummary}
                    onClose={() => setSelectedSummary(null)}
                />
            )}

            <header className="relative overflow-hidden pt-safe pb-4 px-2 -mx-4 -mt-4 mb-2 bg-gradient-to-b from-sky-500/10 to-transparent">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                    <TrendingUp size={100} className="text-sky-500" />
                </div>
                <div className="relative z-10">
                    <h1 className="text-2xl md:text-4xl font-black italic uppercase tracking-tight mb-1">
                        {t('dashboard.letsCrushIt')} <span className="text-sky-400">{activeProfile.name}</span>
                    </h1>
                    <p className="text-xs md:text-sm text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        {t('dashboard.readyForGains')}
                    </p>
                </div>
            </header>

            <div className="grid grid-cols-2 gap-3">
                <div className="p-5 bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-3xl flex flex-col items-center justify-center gap-2 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-sky-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Dumbbell className="text-sky-400 mb-1" size={24} />
                    <div className="text-center relative z-10">
                        <p className="text-2xl font-black italic text-white">{history.length}</p>
                        <h3 className="text-slate-600 text-[9px] uppercase tracking-[0.2em] font-black">{t('dashboard.workouts')}</h3>
                    </div>
                </div>
                <div className="p-5 bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-3xl flex flex-col items-center justify-center gap-2 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Calendar className="text-indigo-400 mb-1" size={24} />
                    <div className="text-center relative z-10">
                        <p className="text-2xl font-black italic text-white">{workouts.length}</p>
                        <h3 className="text-slate-600 text-[9px] uppercase tracking-[0.2em] font-black">{t('dashboard.plans')}</h3>
                    </div>
                </div>

                <div className="col-span-2">
                    <StreakCard stats={gamificationStats} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-slate-900/40 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/5">
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            <Clock size={12} /> {t('dashboard.weeklySchedule')}
                        </h3>
                        <div className="flex justify-between items-center">
                            {weeklyActivity.map((day, i) => (
                                <div key={i} className="flex flex-col items-center gap-3">
                                    <div className={clsx(
                                        "w-9 h-9 rounded-2xl flex items-center justify-center border transition-all duration-500",
                                        day.count > 0
                                            ? "bg-sky-500/20 border-sky-500/50 text-sky-400 shadow-[0_0_15px_rgba(14,165,233,0.2)]"
                                            : "bg-slate-800/30 border-white/5 text-slate-700"
                                    )}>
                                        {day.count > 0 ? (
                                            <CheckCircle2 size={18} className="animate-enter" />
                                        ) : (
                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                                        )}
                                    </div>
                                    <span className={clsx(
                                        "text-[9px] font-black uppercase tracking-tighter",
                                        day.count > 0 ? "text-white" : "text-slate-700"
                                    )}>{day.day}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-slate-900/40 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/5 relative overflow-hidden">
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2 relative z-10">
                            <Zap size={12} className="text-emerald-400" /> {t('dashboard.recovery')}
                        </h3>
                        <div className="relative z-10">
                            <MuscleHeatmap recoveryData={recoveryData} />
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-slate-900/40 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/5">
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            <Play size={12} className="text-sky-400" /> {t('dashboard.quickStart')}
                        </h3>

                        <div className="space-y-3">
                            {activeWorkout && (
                                <button
                                    onClick={() => onViewChange && onViewChange('workout', { initialWorkoutId: activeWorkout.id })}
                                    className="w-full relative overflow-hidden group rounded-2xl p-4 text-left transition-all active:scale-[0.98] border border-sky-500/30 shadow-lg shadow-sky-500/10"
                                >
                                    <div className="absolute inset-0 bg-sky-500/10" />
                                    <div className="relative z-10 flex items-center justify-between">
                                        <div>
                                            <span className="text-[9px] font-black uppercase tracking-widest text-sky-400 mb-1 block">{t('dashboard.resumeSession')}</span>
                                            <span className="text-lg font-black italic text-white uppercase truncate block max-w-[180px]">{activeWorkout.name}</span>
                                        </div>
                                        <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center shadow-lg shadow-sky-500/40">
                                            <Play size={20} className="fill-current ml-0.5" />
                                        </div>
                                    </div>
                                </button>
                            )}

                            {mostUsedWorkouts.length > 0 ? (
                                <div className="space-y-2">
                                    {mostUsedWorkouts.map(w => (
                                        <button
                                            key={w.id}
                                            onClick={() => onViewChange && onViewChange('workout', { initialWorkoutId: w.id })}
                                            className="w-full p-4 bg-slate-800/30 hover:bg-slate-800/50 border border-white/5 rounded-2xl flex items-center justify-between group transition-all"
                                        >
                                            <span className="font-bold text-slate-200 group-hover:text-white transition-colors truncate pr-2">{w.name}</span>
                                            <div className="flex items-center gap-3 shrink-0">
                                                <span className="text-[10px] font-mono text-slate-600 font-bold">{w.count} {t('dashboard.plays')}</span>
                                                <ChevronRight size={16} className="text-slate-600 group-hover:text-sky-400 transition-all" />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <button
                                        onClick={() => onViewChange && onViewChange('planner')}
                                        className="w-full btn bg-slate-800 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs border border-white/5"
                                    >
                                        {t('dashboard.createRoutine')}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-slate-900/40 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/5">
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            <Clock size={12} /> {t('dashboard.recentHistory')}
                        </h3>
                        <div className="space-y-2">
                            {recentHistory.map((h, i) => (
                                <div key={h.id || i} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-2xl transition-colors group border border-transparent hover:border-white/5">
                                    <div className="min-w-0">
                                        <p className="font-bold text-slate-200 group-hover:text-white transition-colors truncate">{h.workoutName || h.name}</p>
                                        <p className="text-[9px] text-slate-600 font-black uppercase tracking-tighter">{new Date(h.date).toLocaleDateString()}</p>
                                    </div>
                                    <div className="flex items-center gap-1 ml-2">
                                        <button
                                            onClick={() => setSelectedSummary(h)}
                                            className="p-2 text-slate-600 hover:text-sky-400 transition-colors"
                                        >
                                            <Share2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => deleteLog(h.id)}
                                            className="p-2 text-slate-600 hover:text-red-400 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {recentHistory.length === 0 && (
                                <p className="text-slate-600 text-[10px] font-bold uppercase text-center py-4 tracking-widest">{t('dashboard.noHistory')}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
