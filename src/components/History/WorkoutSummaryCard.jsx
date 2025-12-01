import React from 'react';
import { Calendar, Clock, Dumbbell, Trophy, Share2, X } from 'lucide-react';
import clsx from 'clsx';
import { useLanguage } from '../../context/LanguageContext';

const WorkoutSummaryCard = ({ workout, onClose }) => {
    const { t } = useLanguage();
    if (!workout) return null;

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
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    const [showCopyFallback, setShowCopyFallback] = React.useState(false);

    // Calculate total volume (approximate)
    const totalVolume = (workout.exercises || []).reduce((acc, ex) => {
        const exerciseVolume = (ex.sets || []).reduce((setAcc, set) => {
            if (set.completed || set.completed === undefined) { // Handle legacy data or assume completed if in history
                const weight = parseFloat(set.weight?.toString().replace(/[^\d.]/g, '')) || 0;
                const reps = parseInt(set.reps?.toString().match(/\d+/)?.[0] || 0);
                return setAcc + (weight * reps);
            }
            return setAcc;
        }, 0);
        return acc + exerciseVolume;
    }, 0);

    const getSummaryText = () => {
        return `🏋️ ${t('summary.workoutTitle')} ${workout.name}\n` +
            `📅 ${formatDate(workout.date)}\n` +
            `⏱️ ${t('summary.duration')} ${formatTime(workout.duration)}\n` +
            `📊 ${t('summary.sets')} ${workout.completedSets}\n` +
            `💪 ${t('summary.volume')} ${totalVolume.toLocaleString()} kg\n\n` +
            `${t('summary.trackedWith')}`;
    };

    const handleShare = async () => {
        const summaryText = getSummaryText();

        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'DuoGym Workout Summary',
                    text: summaryText,
                });
            } catch (err) {
                console.error(t('summary.shareFailed'), err);
            }
        } else {
            try {
                await navigator.clipboard.writeText(summaryText);
                alert(t('summary.copied'));
            } catch (err) {
                console.error(t('summary.clipboardFailed'), err);
                setShowCopyFallback(true);
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[120] flex items-center justify-center p-4 animate-fade-in">
            <div className="relative w-full max-w-md">
                {/* The Card */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl shadow-sky-900/20 relative">

                    {/* Close Button (Inside Card) */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 z-20 p-2 bg-black/20 hover:bg-black/40 text-white/70 hover:text-white rounded-full transition-colors backdrop-blur-sm"
                    >
                        <X size={20} />
                    </button>

                    {/* Header */}
                    <div className="bg-sky-500/10 p-6 border-b border-sky-500/10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Dumbbell size={120} />
                        </div>
                        <div className="relative z-10 pr-8">
                            <div className="inline-flex items-center gap-2 bg-sky-500/20 text-sky-400 text-xs font-bold px-2 py-1 rounded-full mb-3 uppercase tracking-wider">
                                <Trophy size={12} /> {t('summary.workoutComplete')}
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-1">{workout.name}</h2>
                            <p className="text-sky-200/60 font-medium flex items-center gap-2">
                                <Calendar size={14} /> {formatDate(workout.date)}
                            </p>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 divide-x divide-slate-800 border-b border-slate-800">
                        <div className="p-4 text-center">
                            <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Duration</p>
                            <p className="text-white font-mono font-bold">{formatTime(workout.duration)}</p>
                        </div>
                        <div className="p-4 text-center">
                            <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Sets</p>
                            <p className="text-white font-mono font-bold">{workout.completedSets}</p>
                        </div>
                        <div className="p-4 text-center">
                            <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Volume</p>
                            <p className="text-white font-mono font-bold">
                                {totalVolume.toLocaleString()} <span className="text-xs text-slate-600">kg</span>
                            </p>
                        </div>
                    </div>

                    {/* Exercise List Summary */}
                    <div className="p-6 space-y-4 max-h-[40vh] overflow-y-auto">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">{t('summary.workoutSummary')}</h3>
                        {workout.exercises && workout.exercises.map((ex, i) => {
                            // Count completed sets for this exercise
                            const completedCount = (ex.sets || []).filter(s => s.completed || s.completed === undefined).length;

                            if (completedCount === 0) return null;

                            return (
                                <div key={i} className="flex justify-between items-center group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 text-xs font-bold">
                                            {i + 1}
                                        </div>
                                        <span className="text-slate-200 font-medium">{ex.name}</span>
                                    </div>
                                    <div className="text-slate-500 text-sm">
                                        {completedCount} {t('summary.setsCount')}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Footer */}
                    <div className="p-6 bg-slate-900/50 border-t border-slate-800 flex flex-col gap-3">
                        {!showCopyFallback ? (
                            <button
                                onClick={handleShare}
                                className="btn btn-primary w-full justify-center group relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-sky-400 to-indigo-500 opacity-0 group-hover:opacity-10 transition-opacity" />
                                <Share2 size={18} /> {t('summary.shareSummary')}
                            </button>
                        ) : (
                            <div className="space-y-2 animate-fade-in">
                                <p className="text-xs text-slate-400 text-center">{t('summary.copyManually')}</p>
                                <textarea
                                    readOnly
                                    value={getSummaryText()}
                                    className="w-full h-24 bg-slate-800/50 border border-slate-700 rounded-lg p-2 text-xs text-slate-300 focus:outline-none focus:border-sky-500/50 resize-none"
                                    onClick={(e) => e.target.select()}
                                />
                            </div>
                        )}
                        <p className="text-center text-[10px] text-slate-600">
                            {t('summary.footer')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WorkoutSummaryCard;
