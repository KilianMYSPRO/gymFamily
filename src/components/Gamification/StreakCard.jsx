import React from 'react';
import { Flame, Trophy, TrendingUp, Calendar } from 'lucide-react';
import clsx from 'clsx';
import { useLanguage } from '../../context/LanguageContext';

const StreakCard = ({ stats }) => {
    const { t } = useLanguage();
    const { level, nextLevel, progress, streak, momentum, totalWorkouts } = stats;

    return (
        <div className="relative overflow-hidden bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-xl">
            {/* Background Glow */}
            <div className={clsx(
                "absolute -top-20 -right-20 w-64 h-64 rounded-full blur-[100px] opacity-20 pointer-events-none",
                level.color.replace('text-', 'bg-')
            )} />

            <div className="relative z-10">
                {/* Header: Level & Icon */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{t('gamification.currentRank')}</div>
                        <div className="flex items-center gap-3">
                            <span className="text-4xl">{level.icon}</span>
                            <div>
                                <h3 className={clsx("text-2xl font-black italic", level.color)}>
                                    {level.name}
                                </h3>
                                <div className="text-xs text-slate-500 font-mono">
                                    {totalWorkouts} {t('gamification.workoutsCompleted')}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Momentum Flame */}
                    <div className="flex flex-col items-center">
                        <div className="relative">
                            <Flame
                                size={32}
                                className={clsx(
                                    "transition-all duration-1000",
                                    momentum > 80 ? "text-orange-500 drop-shadow-[0_0_15px_rgba(249,115,22,0.8)] animate-pulse" :
                                        momentum > 50 ? "text-yellow-500" :
                                            "text-slate-700"
                                )}
                            />
                            {momentum > 80 && (
                                <div className="absolute inset-0 animate-ping opacity-50">
                                    <Flame size={32} className="text-orange-500" />
                                </div>
                            )}
                        </div>
                        <div className="text-[10px] font-bold text-slate-500 mt-1 uppercase">{t('gamification.momentum')}</div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                    <div className="flex justify-between text-xs font-bold text-slate-400 mb-2">
                        <span>{t('gamification.progressTo')} {nextLevel.name}</span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="h-3 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                        <div
                            className={clsx("h-full transition-all duration-1000 relative", level.color.replace('text-', 'bg-'))}
                            style={{ width: `${progress}%` }}
                        >
                            <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite_linear]"
                                style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)' }}
                            />
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-800/50 rounded-2xl p-3 border border-white/5 flex items-center gap-3">
                        <div className="p-2 bg-orange-500/10 rounded-xl text-orange-500">
                            <TrendingUp size={18} />
                        </div>
                        <div>
                            <div className="text-xl font-bold text-white">{streak}</div>
                            <div className="text-[10px] text-slate-400 uppercase font-bold">{t('gamification.dayStreak')}</div>
                        </div>
                    </div>
                    <div className="bg-slate-800/50 rounded-2xl p-3 border border-white/5 flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500">
                            <Calendar size={18} />
                        </div>
                        <div>
                            <div className="text-xl font-bold text-white">{Math.round(momentum)}%</div>
                            <div className="text-[10px] text-slate-400 uppercase font-bold">{t('gamification.consistency')}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StreakCard;
