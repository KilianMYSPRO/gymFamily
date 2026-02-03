import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, Filter, Dumbbell } from 'lucide-react';
import { translateSearchTerm } from '../../utils/translations';
import exercisesData from '../../data/exercises.json';
import { useLanguage } from '../../context/LanguageContext';

const ExerciseSelector = ({ onSelect, onClose }) => {
    const { t } = useLanguage();
    const [search, setSearch] = useState('');
    const [selectedMuscle, setSelectedMuscle] = useState('all');

    const filteredExercises = useMemo(() => {
        const searchLower = translateSearchTerm(search);
        return exercisesData.filter(ex => {
            const matchesSearch = ex.name.toLowerCase().includes(searchLower) ||
                ex.primaryMuscles.some(m => m.includes(searchLower)) ||
                ex.equipment?.toLowerCase().includes(searchLower);
            const matchesMuscle = selectedMuscle === 'all' || ex.primaryMuscles.includes(selectedMuscle);
            return matchesSearch && matchesMuscle;
        }).slice(0, 50); // Limit results for performance
    }, [search, selectedMuscle]);

    const muscleGroups = ['all', ...new Set(exercisesData.flatMap(ex => ex.primaryMuscles))].sort();

    return createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in">
            <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden shadow-sky-500/5">
                <div className="p-6 border-b border-white/5 flex justify-between items-center flex-shrink-0 bg-slate-950/20">
                    <h3 className="text-xl font-black italic text-white uppercase tracking-tight">{t('planner.selectExercise')}</h3>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl text-slate-500 hover:text-white transition-all active:scale-90">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-6 flex-shrink-0">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                        <input
                            type="text"
                            placeholder={t('planner.searchPlaceholder')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-white font-bold focus:outline-none focus:border-sky-500 transition-all shadow-inner"
                            autoFocus
                        />
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {muscleGroups.map(muscle => (
                            <button
                                key={muscle}
                                onClick={() => setSelectedMuscle(muscle)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap border transition-all active:scale-95 ${selectedMuscle === muscle
                                    ? 'bg-sky-500 border-sky-500 text-white shadow-lg shadow-sky-500/20'
                                    : 'bg-slate-800 border-white/5 text-slate-500 hover:text-white'
                                    }`}
                            >
                                {muscle}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-2 min-h-0 custom-scrollbar">
                    {filteredExercises.map(ex => (
                        <button
                            key={ex.id}
                            onClick={() => onSelect(ex)}
                            className="w-full text-left p-4 rounded-[1.5rem] bg-white/5 hover:bg-white/10 border border-white/5 transition-all flex items-center gap-4 group active:scale-[0.98]"
                        >
                            <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center shrink-0 shadow-inner group-hover:bg-sky-500 group-hover:text-white transition-all duration-500">
                                <Dumbbell size={22} className={clsx(selectedMuscle === 'all' ? "text-sky-400" : "text-white")} />
                            </div>
                            <div className="min-w-0">
                                <h4 className="font-bold text-white leading-tight mb-1 truncate">{ex.name}</h4>
                                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest truncate">
                                    {ex.primaryMuscles.join(', ')} <span className="opacity-30 mx-1">•</span> {ex.equipment || 'Bodyweight'}
                                </p>
                            </div>
                        </button>
                    ))}

                    {filteredExercises.length === 0 && (
                        <div className="text-center py-16">
                            <Search size={40} className="mx-auto text-slate-800 mb-4" />
                            <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest">
                                {t('planner.noExercisesFound')}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ExerciseSelector;
