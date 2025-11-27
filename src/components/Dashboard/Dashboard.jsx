import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { Dumbbell, Clock, TrendingUp, Calendar, ArrowRight, Trash2, CheckCircle2, Share2, Play } from 'lucide-react';
import clsx from 'clsx';
import WorkoutSummaryCard from '../History/WorkoutSummaryCard';

const Dashboard = ({ onViewChange }) => {
    const { activeProfile, workouts = [], history = [], deleteLog } = useStore();
    const [selectedSummary, setSelectedSummary] = useState(null);
    const [resumeWorkout, setResumeWorkout] = useState(null);

    // Check for unfinished workout
    useEffect(() => {
        const saved = localStorage.getItem('duogym-active-workout');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed && parsed.activeWorkout) {
                    setResumeWorkout(parsed.activeWorkout);
                }
            } catch (e) {
                console.error("Failed to parse saved workout", e);
            }
        }
    }, []);

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
        let streak = 0;
        let currentWeekCount = weeklyActivity.reduce((acc, day) => acc + day.count, 0);

        // Simple logic: If current week meets goal, streak is at least 1. 
        // For a real app, we'd need to check past weeks in history.
        // For now, we'll just check if the current week meets the goal.
        if (currentWeekCount >= weeklyGoal) {
            streak = 1;
            // TODO: Expand this to check previous weeks from history
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

    if (!activeProfile) return <div className="text-white p-8">Loading profile...</div>;

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
                        Let's Crush It, <br />
                        <span className="text-electric-400">{activeProfile.name}</span>
                    </h1>
                    <p className="text-slate-400 font-medium flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-acid-500 animate-pulse"></span>
                        Ready for gains?
                    </p>
                </div>
            </header>

            <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-2 relative overflow-hidden group hover:border-electric-500/30 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-br from-electric-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Dumbbell className="text-electric-400 group-hover:scale-110 transition-transform duration-300" size={28} />
                    <div className="text-center relative z-10">
                        <p className="text-3xl font-black italic text-white">{history.length}</p>
                        <h3 className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">Workouts</h3>
                    </div>
                </div>
                <div className="p-4 bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-2 relative overflow-hidden group hover:border-neon-500/30 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-br from-neon-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Calendar className="text-neon-400 group-hover:scale-110 transition-transform duration-300" size={28} />
                    <div className="text-center relative z-10">
                        <p className="text-3xl font-black italic text-white">{workouts.length}</p>
                        <h3 className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">Plans</h3>
                    </div>
                </div>
                <div className="p-4 bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-800 rounded-2xl flex items-center justify-between gap-4 col-span-2 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-acid-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                            <TrendingUp className="text-acid-400" size={24} />
                        </div>
                        <div>
                            <h3 className="text-slate-400 text-xs uppercase tracking-wider font-bold">Week Streak</h3>
                            <div className="flex items-baseline gap-2">
                                <p className="text-3xl font-black italic text-white">{streak}</p>
                                <span className="text-xs text-slate-500 font-mono">/ {weeklyGoal} goal</span>
                            </div>
                        </div>
                    </div>
                    {streak >= weeklyGoal && (
                        <div className="pr-4">
                            <Trophy className="text-yellow-400 animate-bounce" size={32} />
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Actions & Recent */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Weekly Activity Chart */}
                <div className="lg:col-span-2 bg-slate-900/40 backdrop-blur-md p-6 rounded-3xl border border-slate-800/50">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                        <Clock size={14} /> Weekly Schedule
                    </h3>
                    <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
                        {weeklyActivity.map((day, i) => (
                            <div key={i} className="flex flex-col items-center gap-3 flex-1 min-w-[40px]">
                                <div className="h-24 w-full flex items-end justify-center relative">
                                    <div
                                        className={clsx(
                                            "w-2 rounded-full transition-all duration-500",
                                            day.count > 0
                                                ? "bg-gradient-to-t from-electric-500 to-neon-400 shadow-[0_0_10px_rgba(0,242,234,0.3)]"
                                                : "bg-slate-800"
                                        )}
                                        style={{ height: day.count > 0 ? `${Math.min((day.count / maxActivity) * 100, 100)}%` : '4px' }}
                                    />
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
                                <span className="text-electric-400">⚡</span> Quick Start
                            </h3>

                            <div className="space-y-3">
                                {/* Resume Option */}
                                {resumeWorkout && (
                                    <button
                                        onClick={() => onViewChange && onViewChange('workout', { initialWorkoutId: resumeWorkout.id })}
                                        className="w-full relative overflow-hidden group/btn rounded-2xl p-4 text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-electric-600 to-neon-600 animate-gradient-x" />
                                        <div className="absolute inset-0 bg-black/20" />
                                        <div className="relative z-10 flex items-center justify-between">
                                            <div>
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-white/80 mb-1 block">Resume Session</span>
                                                <span className="text-lg font-black italic text-white">{resumeWorkout.name}</span>
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
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2 mt-4">Most Used</p>
                                        <div className="grid grid-cols-1 gap-2">
                                            {mostUsedWorkouts.map(w => (
                                                <button
                                                    key={w.id}
                                                    onClick={() => onViewChange && onViewChange('workout', { initialWorkoutId: w.id })}
                                                    className="w-full p-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-electric-500/50 rounded-xl flex items-center justify-between group/item transition-all duration-300"
                                                >
                                                    <span className="font-bold text-slate-300 group-hover/item:text-white transition-colors">{w.name}</span>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[10px] font-mono text-slate-600 group-hover/item:text-electric-400 transition-colors">{w.count} plays</span>
                                                        <ArrowRight size={16} className="text-slate-600 group-hover/item:text-electric-400 -translate-x-2 opacity-0 group-hover/item:opacity-100 group-hover/item:translate-x-0 transition-all duration-300" />
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-8">
                                        <p className="text-slate-500 text-xs mb-4">No plans yet.</p>
                                        <button
                                            onClick={() => onViewChange && onViewChange('planner')}
                                            className="w-full btn btn-secondary py-3 text-sm"
                                        >
                                            Create Routine
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Recent History Section */}
                    <div className="bg-slate-900/40 backdrop-blur-md p-6 rounded-3xl border border-slate-800/50">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Recent History</h3>
                        <div className="space-y-1">
                            {recentHistory.map(h => (
                                <div key={h.id || Math.random()} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-colors group">
                                    <div>
                                        <p className="font-bold text-slate-200 group-hover:text-white transition-colors">{h.workoutName || 'Unknown Workout'}</p>
                                        <p className="text-[10px] text-slate-500 font-mono uppercase">{new Date(h.date).toLocaleDateString()}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="text-right mr-2">
                                            <p className="text-sm text-electric-400 font-mono font-bold">{formatDuration(h.duration)}</p>
                                            <p className="text-[10px] text-slate-600">{h.completedSets || 0} sets</p>
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
                                <p className="text-slate-500 text-xs text-center py-4 italic">No history yet. Go lift something!</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
