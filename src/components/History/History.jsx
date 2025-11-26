import React from 'react';
import { useStore } from '../../context/StoreContext';
import { Clock, Calendar, Trash2, Dumbbell } from 'lucide-react';

const History = () => {
    const { history, deleteLog } = useStore();

    const formatDuration = (seconds) => {
        if (!seconds) return '0m';
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    };

    // Sort history by date descending
    const sortedHistory = [...history].sort((a, b) => new Date(b.date) - new Date(a.date));

    return (
        <div className="space-y-6">
            <header>
                <h2 className="text-3xl font-bold text-white mb-2">Workout History</h2>
                <p className="text-slate-400">Review your past training sessions.</p>
            </header>

            <div className="space-y-4">
                {sortedHistory.map(h => (
                    <div key={h.id} className="glass-card group hover:border-sky-500/30 transition-all">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-sky-400 shrink-0">
                                    <Dumbbell size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">{h.workoutName || 'Unknown Workout'}</h3>
                                    <div className="flex items-center gap-4 text-sm text-slate-400 mt-1">
                                        <span className="flex items-center gap-1">
                                            <Calendar size={14} />
                                            {new Date(h.date).toLocaleDateString()}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock size={14} />
                                            {new Date(h.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between md:justify-end gap-6 pl-16 md:pl-0">
                                <div className="text-right">
                                    <p className="text-sm text-sky-400 font-mono font-bold">{formatDuration(h.duration)}</p>
                                    <p className="text-xs text-slate-500">Duration</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-white font-mono font-bold">{h.completedSets || 0}</p>
                                    <p className="text-xs text-slate-500">Sets</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-white font-mono font-bold">{h.totalSets || 0}</p>
                                    <p className="text-xs text-slate-500">Total</p>
                                </div>

                                <button
                                    onClick={() => deleteLog(h.id)}
                                    className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors ml-2"
                                    title="Delete Log"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {sortedHistory.length === 0 && (
                    <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-2xl">
                        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-500">
                            <Clock size={32} />
                        </div>
                        <h3 className="text-lg font-medium text-white mb-2">No history yet</h3>
                        <p className="text-slate-400">Complete a workout to see it here.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default History;
