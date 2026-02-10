import React from 'react';
import { ACHIEVEMENTS } from '../../data/achievements';
import { Trophy, Lock, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';
import { useLanguage } from '../../context/LanguageContext';

const AchievementsList = ({ userAchievements = [] }) => {
    const { t } = useLanguage();

    const isUnlocked = (achievementId) => {
        return userAchievements.some(ua => ua.id === achievementId);
    };

    const getUnlockedDate = (achievementId) => {
        const ua = userAchievements.find(ua => ua.id === achievementId);
        return ua ? new Date(ua.unlockedAt).toLocaleDateString() : null;
    };

    // Sort: Unlocked first, then by category
    const sortedAchievements = [...ACHIEVEMENTS].sort((a, b) => {
        const aUnlocked = isUnlocked(a.id);
        const bUnlocked = isUnlocked(b.id);
        if (aUnlocked && !bUnlocked) return -1;
        if (!aUnlocked && bUnlocked) return 1;
        return 0;
    });

    return (
        <div className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                <Trophy size={12} className="text-amber-400" /> {t('gamification.achievements') || 'Achievements'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {sortedAchievements.map((achievement) => {
                    const unlocked = isUnlocked(achievement.id);
                    const unlockedDate = getUnlockedDate(achievement.id);

                    return (
                        <div
                            key={achievement.id}
                            className={clsx(
                                "relative overflow-hidden p-4 rounded-2xl border transition-all duration-500",
                                unlocked 
                                    ? "bg-slate-800/40 border-amber-500/30 shadow-lg shadow-amber-500/5" 
                                    : "bg-slate-900/20 border-white/5 opacity-60"
                            )}
                        >
                            <div className="flex items-center gap-4 relative z-10">
                                <div className={clsx(
                                    "w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-inner",
                                    unlocked ? "bg-amber-500/20" : "bg-slate-800"
                                )}>
                                    {unlocked ? achievement.icon : <Lock size={20} className="text-slate-600" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className={clsx(
                                        "font-bold text-sm truncate",
                                        unlocked ? "text-white" : "text-slate-400"
                                    )}>
                                        {achievement.name}
                                    </h4>
                                    <p className="text-[10px] text-slate-500 leading-tight line-clamp-2">
                                        {achievement.description}
                                    </p>
                                    {unlocked && (
                                        <div className="flex items-center gap-1 mt-1">
                                            <CheckCircle2 size={10} className="text-emerald-400" />
                                            <span className="text-[8px] font-black text-emerald-400 uppercase tracking-tighter">
                                                {unlockedDate}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* Background decoration for unlocked */}
                            {unlocked && (
                                <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AchievementsList;
