import React from 'react';
import { useStore } from '../../context/StoreContext';
import { Dumbbell, Clock, TrendingUp, Calendar, ArrowRight } from 'lucide-react';

const Dashboard = ({ onViewChange }) => {
    const { activeProfile, workouts = [], history = [] } = useStore();

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
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(today);
            d.setDate(d.getDate() - (6 - i));
            return d;
        });

        return last7Days.map(date => {
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
                <div className="lg:col-span-2 bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
                    <h3 className="text-lg font-bold text-white mb-6">Weekly Activity</h3>
                    <div className="flex items-end justify-between h-48 gap-2">
                        {weeklyActivity.map((day, i) => (
                            <div key={i} className="flex flex-col items-center gap-2 flex-1">
                                <div
                                    className={`w-full max-w-[40px] rounded-t-lg transition-all duration-500 ${day.count > 0 ? 'bg-sky-500' : 'bg-slate-800'}`}
                                    style={{ height: `${(day.count / maxActivity) * 100}%`, minHeight: '4px' }}
                                />
                                <span className="text-xs text-slate-500 font-medium">{day.day}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Quick Start (Safe Mode) */}
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-2xl border border-sky-500/20">
                        <h3 className="text-lg font-bold text-white mb-4">Quick Start</h3>
                        {lastWorkout ? (
                            <div className="text-center py-4">
                                <p className="text-slate-400 text-sm mb-4">Ready for your next session?</p>
                                <button
                                    onClick={() => onViewChange && onViewChange('workout', { initialWorkoutId: lastWorkout.id })}
                                    className="w-full btn btn-primary py-3 flex items-center justify-center gap-2"
                                >
                                    <ArrowRight size={20} /> Resume: {lastWorkout.name}
                                </button>
                            </div>
                        ) : (
                            <div className="text-center py-4">
                                <p className="text-slate-400 text-sm mb-4">No recent workouts.</p>
                                <button
                                    onClick={() => onViewChange && onViewChange('planner')}
                                    className="w-full btn btn-secondary py-2"
                                >
                                    Create Routine
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Recent History Section */}
                    <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
                        <h3 className="text-lg font-bold text-white mb-4">Recent History</h3>
                        <div className="space-y-4">
                            {recentHistory.map(h => (
                                <div key={h.id || Math.random()} className="flex items-center justify-between border-b border-slate-800 pb-3 last:border-0 last:pb-0">
                                    <div>
                                        <p className="font-medium text-white">{h.workoutName || 'Unknown Workout'}</p>
                                        <p className="text-xs text-slate-500">{new Date(h.date).toLocaleDateString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-sky-400 font-mono">{formatDuration(h.duration)}</p>
                                        <p className="text-xs text-slate-500">{h.completedSets || 0} sets</p>
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
