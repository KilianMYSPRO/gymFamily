import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { Calendar, Clock, Dumbbell, Trash2, Share2 } from 'lucide-react';
import WorkoutSummaryCard from './WorkoutSummaryCard';
import Portal from '../common/Portal';
import { useLanguage } from '../../context/LanguageContext';

const History = () => {
    const { history, deleteLog } = useStore();
    const { t } = useLanguage();
    const [selectedSummary, setSelectedSummary] = useState(null);

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        return `${mins}m`;
    };

    // Sort history by date descending
    const sortedHistory = useMemo(() => {
        return [...history].sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [history]);

    return (
        <>
            {selectedSummary && (
                <Portal>
                    <WorkoutSummaryCard
                        workout={selectedSummary}
                        onClose={() => setSelectedSummary(null)}
                    />
                </Portal>
            )}

            <div className="space-y-6 animate-fade-in">

                <header>
                    <h2 className="text-3xl font-bold text-white mb-2">{t('history.title')}</h2>
                    <p className="text-slate-400">{t('history.subtitle')}</p>
                </header>

                <div className="space-y-4">
                    {sortedHistory.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-2xl">
                            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-500">
                                <Calendar size={32} />
                            </div>
                            <h3 className="text-lg font-medium text-white mb-2">{t('history.noHistory')}</h3>
                            <p className="text-slate-400">{t('history.noHistorySubtitle')}</p>
                        </div>
                    ) : (
                        sortedHistory.map((session) => (
                            <div key={session.id} className="glass-card group relative hover:border-slate-600 transition-colors">
                                <div className="absolute top-4 right-4 flex gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => setSelectedSummary(session)}
                                        className="p-2 text-slate-400 hover:text-sky-400 hover:bg-sky-400/10 rounded-lg transition-colors"
                                        title="View Summary"
                                    >
                                        <Share2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => deleteLog(session.id)}
                                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                        title="Delete Log"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>

                                <div className="flex items-start gap-4 pr-16 md:pr-24">
                                    <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-sky-400 shrink-0">
                                        <Dumbbell size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white mb-1">{session.name}</h3>
                                        <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                                            <span className="flex items-center gap-1">
                                                <Calendar size={14} /> {formatDate(session.date)}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock size={14} /> {formatTime(session.duration)}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Dumbbell size={14} /> {session.exercises ? session.exercises.reduce((acc, ex) => acc + (ex.sets ? ex.sets.length : 0), 0) : 0} {t('history.sets')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    );
};

export default History;
