import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { Dumbbell, Clock, TrendingUp, Calendar, ArrowRight, Trash2, CheckCircle2, Share2, Play } from 'lucide-react';
import clsx from 'clsx';
import WorkoutSummaryCard from '../History/WorkoutSummaryCard';
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

    const formatDuration = (seconds) => {
        if (!seconds) return '0m';
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    };

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
            } catch (e) {
                return { day: days[date.getDay()], count: 0, isToday: false };
            }
        });
    };

    const weeklyActivity = getWeeklyActivity();
    const maxActivity = Math.max(...weeklyActivity.map(d => d.count), 1);

    // Streak Calculation
    const weeklyGoal = (activeProfile && activeProfile.id && useStore().profileDetails[activeProfile.id]?.weeklyGoal) || 3;

    const calculateStreak = () => {
        if (!history || history.length === 0) return { streak: 0, currentWeekCount: 0 };

        // Helper to get week key (YYYY-Www)
        const getWeekKey = (date) => {
            const d = new Date(date);
            d.setHours(0, 0, 0, 0);
            d.setDate(d.getDate() + 4 - (d.getDay() || 7)); // Thursday of the week
            const yearStart = new Date(d.getFullYear(), 0, 1);
            const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
            return `${d.getFullYear()}-W${weekNo}`;
        };

        // Group history by week
        const historyByWeek = {};
        history.forEach(h => {
            if (h && h.date) {
                const key = getWeekKey(new Date(h.date));
                historyByWeek[key] = (historyByWeek[key] || 0) + 1;
            }
        });

        // Calculate current week count
        const today = new Date();
        const currentWeekKey = getWeekKey(today);
        const currentWeekCount = historyByWeek[currentWeekKey] || 0;

        // Calculate streak (going backwards from last week)
        let streak = 0;

        // If current week meets goal, it adds to streak
        if (currentWeekCount >= weeklyGoal) {
            streak++;
        }

        // Check previous weeks
        let checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - 7); // Start from last week

        while (true) {
            const weekKey = getWeekKey(checkDate);
            const count = historyByWeek[weekKey] || 0;

            if (count >= weeklyGoal) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 7); // Go back another week
            } else {
                break; // Streak broken
            }
        }

        return { streak, currentWeekCount };
    };

    const { streak, currentWeekCount } = calculateStreak();

    // Safe History Processing
    const recentHistory = Array.isArray(history) ? history
        .filter(h => h && h.date && !isNaN(new Date(h.date).getTime())) // Strict date check
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 3) : [];

    const lastWorkoutId = recentHistory[0]?.workoutId;
    const lastWorkout = Array.isArray(workouts) ? workouts.find(w => w.id === lastWorkoutId) : null;

    if (!activeProfile) return <div className="text-white p-8">{t('common.loading')}</div>;

    return (
        <div className="text-white p-6 space-y-8 pb-24 animate-enter">
            {selectedSummary && (
                <WorkoutSummaryCard
                    workout={selectedSummary}
                    onClose={() => setSelectedSummary(null)}
                />
            )}

            <header className="relative overflow-hidden p-6 -mx-6 -mt-6 mb-2 bg-gradient-to-b from-electric-500/10 to-transparent">
                <div className="absolute top-0 right-0 p-8 opacity-20 animate-pulse-fast">
                    <TrendingUp size={120} className="text-electric-500" />
                </div>
                <div className="relative z-10">
                    <h1 className="text-4xl font-black italic uppercase tracking-tighter mb-1 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                        {t('dashboard.letsCrushIt')} <br />
                        <span className="text-electric-400">{activeProfile.name}</span>
                    </h1>
                    <p className="text-slate-400 font-medium flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-acid-500 animate-pulse"></span>
                        {t('dashboard.readyForGains')}
                    </p>
                </div>
            </header>

            <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-2 relative overflow-hidden group hover:border-electric-500/30 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-br from-electric-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Dumbbell className="text-electric-400 group-hover:scale-110 transition-transform duration-300" size={28} />
                    <div className="text-center relative z-10">
                        <p className="text-3xl font-black italic text-white">{history.length}</p>
                        <h3 className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">{t('dashboard.workouts')}</h3>
                    </div>
                </div>
                <div className="p-4 bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-2 relative overflow-hidden group hover:border-neon-500/30 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-br from-neon-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Calendar className="text-neon-400 group-hover:scale-110 transition-transform duration-300" size={28} />
                    <div className="text-center relative z-10">
                        <p className="text-3xl font-black italic text-white">{workouts.length}</p>
                        <h3 className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">{t('dashboard.plans')}</h3>
                    </div>
                </div>

                {/* Weekly Progress & Streak */}
                <div className="col-span-2 grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-800 rounded-2xl flex flex-col justify-center gap-1 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-r from-acid-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <h3 className="text-slate-400 text-xs uppercase tracking-wider font-bold flex items-center gap-2">
                            <TrendingUp size={14} className="text-acid-400" /> {t('dashboard.weeklyGoal')}
                        </h3>
                        <div className="flex items-baseline gap-2 relative z-10">
                            <p className={clsx(
                                "text-3xl font-black italic",
                                currentWeekCount >= weeklyGoal ? "text-acid-400" : "text-white"
                            )}>{currentWeekCount}</p>
                            <span className="text-xs text-slate-500 font-mono">/ {weeklyGoal}</span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full h-1 bg-slate-800 rounded-full mt-2 overflow-hidden">
                            <div
                                className="h-full bg-acid-400 transition-all duration-500"
                                style={{ width: `${Math.min((currentWeekCount / weeklyGoal) * 100, 100)}%` }}
                            />
                        </div>
                    </div>

                    <div className="p-4 bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-800 rounded-2xl flex flex-col justify-center gap-1 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <h3 className="text-slate-400 text-xs uppercase tracking-wider font-bold flex items-center gap-2">
                            <span className="text-orange-500">🔥</span> {t('dashboard.streak')}
                        </h3>
                        <div className="flex items-baseline gap-2 relative z-10">
                            <p className="text-3xl font-black italic text-white">{streak}</p>
                            <span className="text-xs text-slate-500 font-mono">{t('dashboard.weeks')}</span>
                        </div>
                        {streak > 0 && (
                            <p className="text-[10px] text-orange-400 font-bold uppercase tracking-wider mt-1">{t('dashboard.keepItUp')}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Actions & Recent */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Weekly Activity Chart */}
                <div className="lg:col-span-2 bg-slate-900/40 backdrop-blur-md p-6 rounded-3xl border border-slate-800/50">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                        <Clock size={14} /> {t('dashboard.weeklySchedule')}
                    </h3>
                    <div className="flex justify-between items-center px-2">
                        {weeklyActivity.map((day, i) => (
                            <div key={i} className="flex flex-col items-center gap-3">
                                <div className={clsx(
                                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                                    day.count > 0
                                        ? "bg-electric-500/20 border-electric-400 text-electric-400 shadow-[0_0_15px_rgba(45,212,191,0.3)]"
                                        : "bg-slate-800/50 border-slate-700 text-slate-600"
                                )}>
                                    {day.count > 0 ? (
                                        <CheckCircle2 size={20} className="animate-enter" />
                                    ) : (
                                        <div className="w-2 h-2 rounded-full bg-slate-700" />
                                    )}
                                </div>
                                <span className={clsx(
                                    "text-[10px] font-bold uppercase tracking-wider",
                                    day.count > 0 ? "text-white" : "text-slate-600"
                                )}>{day.day}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Quick Start Section */}
                    <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-1 rounded-3xl relative group">
                        <div className="absolute inset-0 bg-gradient-to-br from-electric-500 to-neon-500 rounded-3xl opacity-20 blur-xl group-hover:opacity-30 transition-opacity duration-500" />
                        <div className="bg-slate-950/90 backdrop-blur-xl p-6 rounded-[22px] border border-white/5 relative z-10 h-full">
                            <h3 className="text-lg font-black italic text-white mb-6 flex items-center gap-2">
                                <span className="text-electric-400">⚡</span> {t('dashboard.quickStart')}
                            </h3>

                            <div className="space-y-3">
                                {/* Resume Option */}
                                {activeWorkout && (
                                    <button
                                        onClick={() => onViewChange && onViewChange('workout', { initialWorkoutId: activeWorkout.id })}
                                        className="w-full relative overflow-hidden group/btn rounded-2xl p-4 text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-electric-600 to-neon-600 animate-gradient-x" />
                                        <div className="absolute inset-0 bg-black/20" />
                                        <div className="relative z-10 flex items-center justify-between">
                                            <div>
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-white/80 mb-1 block">{t('dashboard.resumeSession')}</span>
                                                <span className="text-lg font-black italic text-white">{activeWorkout.name}</span>
                                            </div>
                                            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
                                                <Play size={20} className="fill-current ml-1" />
                                            </div>
                                        </div>
                                    </button>
                                )}

                                {/* Most Used Plans */}
                                {mostUsedWorkouts.length > 0 ? (
                                    <>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2 mt-4">{t('dashboard.mostUsed')}</p>
                                        <div className="grid grid-cols-1 gap-2">
                                            {mostUsedWorkouts.map(w => (
                                                <button
                                                    key={w.id}
                                                    onClick={() => onViewChange && onViewChange('workout', { initialWorkoutId: w.id })}
                                                    className="w-full p-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-electric-500/50 rounded-xl flex items-center justify-between group/item transition-all duration-300"
                                                >
                                                    <span className="font-bold text-slate-300 group-hover/item:text-white transition-colors">{w.name}</span>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[10px] font-mono text-slate-600 group-hover/item:text-electric-400 transition-colors">{w.count} {t('dashboard.plays')}</span>
                                                        <ArrowRight size={16} className="text-slate-600 group-hover/item:text-electric-400 -translate-x-2 opacity-0 group-hover/item:opacity-100 group-hover/item:translate-x-0 transition-all duration-300" />
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-8">
                                        <p className="text-slate-500 text-xs mb-4">{t('dashboard.noPlans')}</p>
                                        <button
                                            onClick={() => onViewChange && onViewChange('planner')}
                                            className="w-full btn btn-secondary py-3 text-sm"
                                        >
                                            {t('dashboard.createRoutine')}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Recent History Section */}
                    <div className="bg-slate-900/40 backdrop-blur-md p-6 rounded-3xl border border-slate-800/50">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">{t('dashboard.recentHistory')}</h3>
                        <div className="space-y-1">
                            {recentHistory.map(h => (
                                <div key={h.id || Math.random()} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-colors group">
                                    <div>
                                        <p className="font-bold text-slate-200 group-hover:text-white transition-colors">{h.workoutName || h.name || 'Unknown Workout'}</p>
                                        <p className="text-[10px] text-slate-500 font-mono uppercase">{new Date(h.date).toLocaleDateString()}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="text-right mr-2">
                                            <p className="text-sm text-electric-400 font-mono font-bold">{formatDuration(h.duration)}</p>
                                            <p className="text-[10px] text-slate-600">{h.completedSets || 0} {t('dashboard.sets')}</p>
                                        </div>
                                        <button
                                            onClick={() => setSelectedSummary(h)}
                                            className="p-2 text-slate-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                        >
                                            <Share2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => deleteLog(h.id)}
                                            className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {recentHistory.length === 0 && (
                                <p className="text-slate-500 text-xs text-center py-4 italic">{t('dashboard.noHistory')}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
