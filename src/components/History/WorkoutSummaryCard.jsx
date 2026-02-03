import React from 'react';
import { Calendar, Clock, Dumbbell, Trophy, Share2, X } from 'lucide-react';

import { useLanguage } from '../../context/LanguageContext';

const WorkoutSummaryCard = ({ workout, onClose }) => {
    const { t } = useLanguage();
    const [showCopyFallback, setShowCopyFallback] = React.useState(false);

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

    if (!workout) return null;

    // Calculate total volume (approximate)
    const totalVolume = (workout.exercises || []).reduce((acc, ex) => {
        if (ex.category === 'cardio') return acc; // Skip cardio for volume
        const exerciseVolume = (ex.sets || []).reduce((setAcc, set) => {
            if (set.completed || set.completed === undefined) {
                const weight = parseFloat(set.weight?.toString().replace(/[^\d.]/g, '')) || 0;
                const reps = parseInt(set.reps?.toString().match(/\d+/)?.[0] || 0);
                return setAcc + (weight * reps);
            }
            return setAcc;
        }, 0);
        return acc + exerciseVolume;
    }, 0);

    const totalDistance = (workout.exercises || []).reduce((acc, ex) => {
        if (ex.category !== 'cardio') return acc;
        return acc + (ex.sets || []).reduce((setAcc, set) => {
            if (set.completed || set.completed === undefined) {
                return setAcc + (parseFloat(set.weight) || 0); // weight is distance
            }
            return setAcc;
        }, 0);
    }, 0);

    const getSummaryText = () => {
        let text = `🏋️ ${t('summary.workoutTitle')} ${workout.name}\n` +
            `📅 ${formatDate(workout.date)}\n` +
            `⏱️ ${t('summary.duration')} ${formatTime(workout.duration)}\n` +
            `📊 ${t('summary.sets')} ${workout.completedSets}\n`;

        if (totalVolume > 0) {
            text += `💪 ${t('summary.volume')} ${totalVolume.toLocaleString()} kg\n`;
        }
        if (totalDistance > 0) {
            text += `🏃 ${t('summary.distance')} ${totalDistance.toFixed(2)} km\n`;
        }

        text += `\n${t('summary.trackedWith')}`;
        return text;
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
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-fade-in">
            <div className="relative w-full max-w-md">
                {/* The Card */}
                <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl relative">

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 z-20 p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all active:scale-90 border border-white/5"
                    >
                        <X size={20} />
                    </button>

                    {/* Header */}
                    <div className="bg-sky-500/5 p-8 border-b border-white/5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none transform translate-x-4 -translate-y-4">
                            <Trophy size={160} />
                        </div>
                        <div className="relative z-10 pr-8">
                            <div className="inline-flex items-center gap-2 bg-sky-500/20 text-sky-400 text-[10px] font-black px-2.5 py-1 rounded-full mb-4 uppercase tracking-[0.2em] border border-sky-500/20">
                                <Trophy size={12} /> {t('summary.workoutComplete')}
                            </div>
                            <h2 className="text-3xl font-black italic text-white uppercase tracking-tight mb-1">{workout.name}</h2>
                            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest flex items-center gap-2">
                                <Calendar size={14} className="text-sky-500" /> {formatDate(workout.date)}
                            </p>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 divide-x divide-white/5 border-b border-white/5 bg-slate-950/20">
                        <div className="p-5 text-center">
                            <p className="text-slate-600 text-[8px] font-black uppercase tracking-widest mb-1">Duration</p>
                            <p className="text-white font-black italic">{formatTime(workout.duration)}</p>
                        </div>
                        <div className="p-5 text-center">
                            <p className="text-slate-600 text-[8px] font-black uppercase tracking-widest mb-1">Sets</p>
                            <p className="text-white font-black italic text-xl leading-none">{workout.completedSets}</p>
                        </div>
                        <div className="p-5 text-center">
                            <p className="text-slate-600 text-[8px] font-black uppercase tracking-widest mb-1">Volume</p>
                            <p className="text-white font-black italic">
                                {totalVolume.toLocaleString()} <span className="text-[10px] not-italic text-slate-600 uppercase">kg</span>
                            </p>
                        </div>
                    </div>

                    {/* Exercise List Summary */}
                    <div className="p-8 space-y-4 max-h-[35vh] overflow-y-auto custom-scrollbar">
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">{t('summary.workoutSummary')}</h3>
                        {workout.exercises && workout.exercises.map((ex, i) => {
                            const completedCount = (ex.sets || []).filter(s => s.completed || s.completed === undefined).length;
                            if (completedCount === 0) return null;

                            return (
                                <div key={i} className="flex justify-between items-center bg-white/5 px-4 py-3 rounded-2xl border border-white/5 group">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500 text-[10px] font-black shadow-inner group-hover:bg-sky-500/20 group-hover:text-sky-400 transition-colors">
                                            {i + 1}
                                        </div>
                                        <span className="text-slate-200 font-bold truncate pr-2">{ex.name}</span>
                                    </div>
                                    <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest bg-slate-950/50 px-2 py-1 rounded-lg shrink-0">
                                        {completedCount} {t('summary.setsCount')}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Footer */}
                    <div className="p-8 bg-slate-950/40 border-t border-white/5">
                        {!showCopyFallback ? (
                            <button
                                onClick={handleShare}
                                className="w-full py-5 rounded-2xl bg-white text-slate-900 hover:bg-slate-100 transition-all font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 shadow-2xl active:scale-95"
                            >
                                <Share2 size={18} strokeWidth={3} /> {t('summary.shareSummary')}
                            </button>
                        ) : (
                            <div className="space-y-3 animate-fade-in">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">{t('summary.copyManually')}</p>
                                <textarea
                                    readOnly
                                    value={getSummaryText()}
                                    className="w-full h-24 bg-slate-950/50 border border-slate-800 rounded-2xl p-4 text-[10px] font-bold text-slate-400 focus:outline-none focus:border-sky-500/50 resize-none shadow-inner"
                                    onClick={(e) => e.target.select()}
                                />
                            </div>
                        )}
                        <p className="text-center text-[9px] font-black text-slate-700 uppercase tracking-[0.3em] mt-6">
                            {t('summary.footer')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WorkoutSummaryCard;
