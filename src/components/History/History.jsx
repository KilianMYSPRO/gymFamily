import React, { useState, useMemo, useCallback } from 'react';
import { useStore } from '../../context/StoreContext';
import { Calendar, Clock, Dumbbell, Trash2, Share2 } from 'lucide-react';
import WorkoutSummaryCard from './WorkoutSummaryCard';
import Portal from '../common/Portal';
import SwipeableRow from '../common/SwipeableRow';
import PullToRefresh from '../common/PullToRefresh';
import { useLanguage } from '../../context/LanguageContext';

const History = () => {
    const { history, deleteLog, syncData } = useStore();
    const { t } = useLanguage();
    const [selectedSummary, setSelectedSummary] = useState(null);

    const handleRefresh = useCallback(async () => {
        try {
            await syncData();
        } catch (error) {
            console.error('Failed to refresh history:', error);
        }
    }, [syncData]);

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
        if (!Array.isArray(history)) return [];
        return [...history].sort((a, b) => {
            const dateA = new Date(a.date || 0);
            const dateB = new Date(b.date || 0);
            return dateB - dateA;
        });
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

            {/* Mobile: Pull to refresh wrapper */}
            <div className="md:hidden">
                <PullToRefresh onRefresh={handleRefresh}>
                    <div className="space-y-6 animate-fade-in">
                        <header>
                            <h2 className="text-3xl font-bold text-white mb-2">{t('history.title')}</h2>
                            <p className="text-slate-400">{t('history.subtitle')}</p>
                            <p className="text-xs text-slate-500 mt-1">{t('history.swipeHint') || 'Swipe left to delete'}</p>
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
                                    <SwipeableRow
                                        key={session.id}
                                        onDelete={() => deleteLog(session.id)}
                                        className="md:hidden"
                                    >
                                        <div className="bg-slate-900/40 backdrop-blur-md p-5 rounded-[2rem] border border-white/5 relative group transition-all">
                                            <div className="absolute top-4 right-4 flex gap-2">
                                                <button
                                                    onClick={() => setSelectedSummary(session)}
                                                    className="p-2 text-slate-500 hover:text-sky-400 transition-colors"
                                                    title="View Summary"
                                                >
                                                    <Share2 size={18} />
                                                </button>
                                            </div>

                                            <div className="flex items-start gap-4 pr-12">
                                                <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-sky-400 shrink-0 shadow-inner">
                                                    <Dumbbell size={24} />
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="text-lg font-black italic text-white uppercase tracking-tight truncate leading-tight mb-1">{session.name}</h3>
                                                    <div className="flex flex-col gap-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                                        <span className="flex items-center gap-1.5">
                                                            <Calendar size={12} /> {formatDate(session.date)}
                                                        </span>
                                                        <div className="flex gap-3">
                                                            <span className="flex items-center gap-1.5">
                                                                <Clock size={12} /> {formatTime(session.duration)}
                                                            </span>
                                                            <span className="flex items-center gap-1.5">
                                                                <Dumbbell size={12} /> {session.exercises ? session.exercises.reduce((acc, ex) => acc + (ex.sets ? ex.sets.length : 0), 0) : 0} {t('history.sets')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </SwipeableRow>
                                ))
                            )}
                        </div>
                    </div>
                </PullToRefresh>
            </div>

            {/* Desktop: Standard layout without pull to refresh */}
            <div className="hidden md:block space-y-6 animate-fade-in">
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
                            <div key={session.id} className="bg-slate-900/40 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/5 relative group hover:border-sky-500/30 transition-all duration-500 shadow-xl overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all">
                                    <button
                                        onClick={() => setSelectedSummary(session)}
                                        className="p-2 bg-slate-800 hover:bg-sky-500 text-slate-400 hover:text-white rounded-xl transition-all"
                                        title="View Summary"
                                    >
                                        <Share2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => deleteLog(session.id)}
                                        className="p-2 bg-slate-800 hover:bg-red-500 text-slate-400 hover:text-white rounded-xl transition-all"
                                        title="Delete Log"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>

                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-[1.25rem] bg-slate-800 flex items-center justify-center text-sky-400 shrink-0 shadow-inner group-hover:bg-sky-500 group-hover:text-white transition-all duration-500">
                                        <Dumbbell size={32} />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-2xl font-black italic text-white uppercase tracking-tight truncate leading-tight mb-2">{session.name}</h3>
                                        <div className="flex flex-wrap gap-6 text-xs font-bold text-slate-500 uppercase tracking-[0.15em]">
                                            <span className="flex items-center gap-2">
                                                <Calendar size={14} /> {formatDate(session.date)}
                                            </span>
                                            <span className="flex items-center gap-2">
                                                <Clock size={14} /> {formatTime(session.duration)}
                                            </span>
                                            <span className="flex items-center gap-2 text-sky-400/80">
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

