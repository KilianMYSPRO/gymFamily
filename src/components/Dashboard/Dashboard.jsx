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
        <div className="text-white p-8 space-y-8">
            {selectedSummary && (
                <WorkoutSummaryCard
                    workout={selectedSummary}
                    onClose={() => setSelectedSummary(null)}
                />
            )}

            <header>
                <h1 className="text-3xl font-bold">Welcome, {activeProfile.name}</h1>
                <p className="text-slate-400">Here's your activity overview.</p>
            </header>

            <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-800 rounded-lg flex items-center gap-4">
                    <Dumbbell className="text-sky-400" size={24} />
                    <div>
                        <h3 className="text-slate-400 text-sm">Workouts</h3>
                        <p className="text-2xl font-bold">{history.length}</p>
                    </div>
                </div>
                <div className="p-4 bg-slate-800 rounded-lg flex items-center gap-4">
                    <Calendar className="text-purple-400" size={24} />
                    <div>
                        <h3 className="text-slate-400 text-sm">Plans</h3>
                        <p className="text-2xl font-bold">{workouts.length}</p>
                    </div>
                </div>
                <div className="p-4 bg-slate-800 rounded-lg flex items-center gap-4 col-span-2">
                    <TrendingUp className="text-emerald-400" size={24} />
                    <div>
                        <h3 className="text-slate-400 text-sm">Week Streak</h3>
                        <div className="flex items-baseline gap-2">
                            <p className="text-2xl font-bold">{streak}</p>
                            <span className="text-xs text-slate-500">({currentWeekCount}/{weeklyGoal})</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions & Recent */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Weekly Activity Chart */}
                <div className="lg:col-span-2 bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                    <h3 className="text-md font-bold text-white mb-4">Weekly Schedule</h3>
                    <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
                        {weeklyActivity.map((day, i) => (
                            <div key={i} className="flex flex-col items-center gap-2 flex-1">
                                <span className="text-xs text-slate-500 font-medium uppercase">{day.day}</span>
                                <div
                                    className={clsx(
                                        "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                                        day.count > 0
                                            ? "bg-sky-500 text-white shadow-[0_0_15px_rgba(14,165,233,0.4)]"
                                            : "bg-slate-800/50 text-slate-600 border border-slate-700/50"
                                    )}
                                >
                                    {day.count > 0 ? <CheckCircle2 size={20} /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Quick Start (Safe Mode) */}
                    {/* Quick Start Section */}
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-2xl border border-sky-500/20">
                        <h3 className="text-lg font-bold text-white mb-4">Quick Start</h3>

                        <div className="space-y-3">
                            {/* Resume Option */}
                            {resumeWorkout && (
                                <button
                                    onClick={() => onViewChange && onViewChange('workout', { initialWorkoutId: resumeWorkout.id })}
                                    className="w-full btn btn-primary py-3 flex items-center justify-center gap-3 mb-4 animate-pulse-slow shadow-lg shadow-sky-500/20"
                                >
                                    <Play size={20} className="fill-current" />
                                    <div className="flex flex-col items-start">
                                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Resume Session</span>
                                        <span className="text-sm font-bold">{resumeWorkout.name}</span>
                                    </div>
                                </button>
                            )}

                            {/* Most Used Plans */}
                            {mostUsedWorkouts.length > 0 ? (
                                <>
                                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Most Used</p>
                                    <div className="grid grid-cols-1 gap-2">
                                        {mostUsedWorkouts.map(w => (
                                            <button
                                                key={w.id}
                                                onClick={() => onViewChange && onViewChange('workout', { initialWorkoutId: w.id })}
                                                className="w-full p-3 bg-slate-800/50 hover:bg-slate-700 border border-slate-700/50 hover:border-sky-500/50 rounded-xl flex items-center justify-between group transition-all"
                                            >
                                                <span className="font-medium text-slate-200 group-hover:text-white">{w.name}</span>
                                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                                    <span>{w.count} plays</span>
                                                    <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-sky-400" />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-4">
                                    <p className="text-slate-400 text-sm mb-4">No plans yet.</p>
                                    <button
                                        onClick={() => onViewChange && onViewChange('planner')}
                                        className="w-full btn btn-secondary py-2"
                                    >
                                        Create Routine
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent History Section */}
                    <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
                        <h3 className="text-lg font-bold text-white mb-4">Recent History</h3>
                        <div className="space-y-4">
                            {recentHistory.map(h => (
                                <div key={h.id || Math.random()} className="flex items-center justify-between border-b border-slate-800 pb-3 last:border-0 last:pb-0 group">
                                    <div>
                                        <p className="font-medium text-white">{h.workoutName || 'Unknown Workout'}</p>
                                        <p className="text-xs text-slate-500">{new Date(h.date).toLocaleDateString()}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="text-right mr-2">
                                            <p className="text-sm text-sky-400 font-mono">{formatDuration(h.duration)}</p>
                                            <p className="text-xs text-slate-500">{h.completedSets || 0} sets</p>
                                        </div>
                                        <button
                                            onClick={() => setSelectedSummary(h)}
                                            className="p-2 text-slate-400 hover:text-sky-400 hover:bg-sky-400/10 rounded-lg transition-colors"
                                            title="Share Summary"
                                        >
                                            <Share2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => deleteLog(h.id)}
                                            className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                            title="Delete Log"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {recentHistory.length === 0 && (
                                <p className="text-slate-500 text-sm text-center py-2">No history yet.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
