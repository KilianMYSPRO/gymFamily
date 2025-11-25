import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, Dumbbell } from 'lucide-react';
import exercisesData from '../../data/exercises.json';

const ExerciseSelector = ({ onSelect, onClose }) => {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');

    const filteredExercises = useMemo(() => {
        return exercisesData.filter(ex => {
            const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase()) ||
                ex.primaryMuscles.some(m => m.includes(search.toLowerCase()));
            const matchesFilter = filter === 'all' || ex.primaryMuscles.includes(filter);
            return matchesSearch && matchesFilter;
        }).slice(0, 50); // Limit results for performance
    }, [search, filter]);

    const muscleGroups = ['all', ...new Set(exercisesData.flatMap(ex => ex.primaryMuscles))].sort();

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center flex-shrink-0">
                    <h3 className="text-xl font-bold text-white">Select Exercise</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-4 space-y-4 flex-shrink-0">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search by name or muscle..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-sky-500 transition-colors"
                            autoFocus
                        />
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {muscleGroups.slice(0, 10).map(muscle => (
                            <button
                                key={muscle}
                                onClick={() => setFilter(muscle)}
                                className={`px-3 py-1 rounded-full text-sm whitespace-nowrap border transition-colors ${filter === muscle
                                    ? 'bg-sky-500 border-sky-500 text-white'
                                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                                    }`}
                            >
                                {muscle.charAt(0).toUpperCase() + muscle.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0">
                    {filteredExercises.map(ex => (
                        <button
                            key={ex.id}
                            onClick={() => onSelect(ex)}
                            className="w-full text-left p-3 rounded-xl hover:bg-slate-800 transition-colors flex items-center gap-4 group"
                        >
                            <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center group-hover:bg-slate-700 transition-colors">
                                <Dumbbell size={20} className="text-sky-500" />
                            </div>
                            <div>
                                <h4 className="font-bold text-white">{ex.name}</h4>
                                <p className="text-xs text-slate-400">
                                    {ex.primaryMuscles.join(', ')} • {ex.equipment || 'Bodyweight'}
                                </p>
                            </div>
                        </button>
                    ))}

                    {filteredExercises.length === 0 && (
                        <div className="text-center py-8 text-slate-500">
                            No exercises found.
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ExerciseSelector;
