import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Plus, Trash2, Dumbbell, Save, X } from 'lucide-react';
import clsx from 'clsx';

import ExerciseSelector from './ExerciseSelector';

const Planner = () => {
    const { workouts, addWorkout, deleteWorkout } = useStore();
    const [isCreating, setIsCreating] = useState(false);
    const [showSelector, setShowSelector] = useState(false);
    const [newWorkoutName, setNewWorkoutName] = useState('');
    const [exercises, setExercises] = useState([]);

    const handleAddExercise = (exercise) => {
        setExercises([...exercises, {
            id: crypto.randomUUID(),
            name: exercise.name,
            sets: 3,
            reps: '10',
            weight: '',
            originalId: exercise.id
        }]);
        setShowSelector(false);
    };

    const updateExercise = (id, field, value) => {
        setExercises(exercises.map(ex => ex.id === id ? { ...ex, [field]: value } : ex));
    };

    const removeExercise = (id) => {
        setExercises(exercises.filter(ex => ex.id !== id));
    };

    const handleSave = () => {
        if (!newWorkoutName.trim()) return;
        addWorkout({
            name: newWorkoutName,
            exercises: exercises
        });
        setIsCreating(false);
        setNewWorkoutName('');
        setExercises([]);
    };

    return (
        <div className="space-y-6">
            {showSelector && (
                <ExerciseSelector
                    onSelect={handleAddExercise}
                    onClose={() => setShowSelector(false)}
                />
            )}

            <header className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2">Workout Planner</h2>
                    <p className="text-slate-400">Design your training routines.</p>
                </div>
                {!isCreating && (
                    <button
                        onClick={() => setIsCreating(true)}
                        className="btn btn-primary"
                    >
                        <Plus size={20} />
                        New Plan
                    </button>
                )}
            </header>

            {isCreating ? (
                <div className="glass-card animate-fade-in">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-white">Create New Routine</h3>
                        <button onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-white">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="space-y-4 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Routine Name</label>
                            <input
                                type="text"
                                value={newWorkoutName}
                                onChange={(e) => setNewWorkoutName(e.target.value)}
                                placeholder="e.g. Push Day, Leg Day"
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-sky-500 transition-colors"
                            />
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <label className="block text-sm font-medium text-slate-400">Exercises</label>
                                <button onClick={() => setShowSelector(true)} className="text-sm text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1">
                                    <Plus size={16} /> Add Exercise
                                </button>
                            </div>

                            {exercises.map((ex, idx) => (
                                <div key={ex.id} className="grid grid-cols-12 gap-2 items-start bg-slate-800/30 p-3 rounded-lg border border-slate-700/30">
                                    <div className="col-span-1 flex justify-center pt-3 text-slate-500 font-mono text-sm">{idx + 1}</div>
                                    <div className="col-span-5 md:col-span-6">
                                        <input
                                            type="text"
                                            placeholder="Exercise Name"
                                            value={ex.name}
                                            onChange={(e) => updateExercise(ex.id, 'name', e.target.value)}
                                            className="w-full bg-transparent border-b border-slate-700 focus:border-sky-500 text-white px-2 py-1 outline-none text-sm"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <input
                                            type="number"
                                            placeholder="Sets"
                                            value={ex.sets}
                                            onChange={(e) => updateExercise(ex.id, 'sets', e.target.value)}
                                            className="w-full bg-transparent border-b border-slate-700 focus:border-sky-500 text-white px-2 py-1 outline-none text-center text-sm"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <input
                                            type="text"
                                            placeholder="Reps"
                                            value={ex.reps}
                                            onChange={(e) => updateExercise(ex.id, 'reps', e.target.value)}
                                            className="w-full bg-transparent border-b border-slate-700 focus:border-sky-500 text-white px-2 py-1 outline-none text-center text-sm"
                                        />
                                    </div>
                                    <div className="col-span-2 md:col-span-1 flex justify-end">
                                        <button onClick={() => removeExercise(ex.id)} className="text-slate-500 hover:text-red-400 p-1">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {exercises.length === 0 && (
                                <div className="text-center py-8 text-slate-500 border-2 border-dashed border-slate-800 rounded-lg">
                                    No exercises added yet.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3">
                        <button onClick={() => setIsCreating(false)} className="btn btn-secondary">Cancel</button>
                        <button onClick={handleSave} className="btn btn-primary" disabled={!newWorkoutName}>
                            <Save size={18} /> Save Routine
                        </button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {workouts.map(workout => (
                        <div key={workout.id} className="glass-card group relative">
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => deleteWorkout(workout.id)}
                                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center border border-slate-600">
                                    <Dumbbell size={24} className="text-sky-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">{workout.name}</h3>
                                    <p className="text-sm text-slate-400">{workout.exercises.length} Exercises</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                {workout.exercises.slice(0, 3).map((ex, i) => (
                                    <div key={i} className="flex justify-between text-sm text-slate-300 border-b border-slate-800/50 pb-1 last:border-0">
                                        <span>{ex.name}</span>
                                        <span className="text-slate-500">{ex.sets} x {ex.reps}</span>
                                    </div>
                                ))}
                                {workout.exercises.length > 3 && (
                                    <p className="text-xs text-slate-500 pt-1">+{workout.exercises.length - 3} more</p>
                                )}
                            </div>
                        </div>
                    ))}

                    {workouts.length === 0 && (
                        <div className="col-span-full text-center py-12">
                            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-500">
                                <Dumbbell size={32} />
                            </div>
                            <h3 className="text-lg font-medium text-white mb-2">No routines yet</h3>
                            <p className="text-slate-400 mb-6">Create your first workout plan to get started.</p>
                            <button onClick={() => setIsCreating(true)} className="btn btn-primary">
                                Create Routine
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Planner;
