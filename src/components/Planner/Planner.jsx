import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Plus, Trash2, Dumbbell, Save, X, Pencil, Share2, Download, Copy, Check, BookOpen, Braces } from 'lucide-react';
import clsx from 'clsx';

import { generateUUID } from '../../utils/uuid';
import ExerciseSelector from './ExerciseSelector';
import templates from '../../data/templates.json';

const Planner = () => {
    const { workouts, addWorkout, updateWorkout, deleteWorkout } = useStore();
    const [isCreating, setIsCreating] = useState(() => localStorage.getItem('duogym-planner-creating') === 'true');
    const [editingId, setEditingId] = useState(() => localStorage.getItem('duogym-planner-editing-id'));
    const [showSelector, setShowSelector] = useState(false);
    const [newWorkoutName, setNewWorkoutName] = useState(() => localStorage.getItem('duogym-planner-name') || '');
    const [exercises, setExercises] = useState(() => {
        try {
            const saved = localStorage.getItem('duogym-planner-exercises');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    // Persist state
    React.useEffect(() => {
        localStorage.setItem('duogym-planner-creating', isCreating);
        if (editingId) localStorage.setItem('duogym-planner-editing-id', editingId);
        else localStorage.removeItem('duogym-planner-editing-id');
        localStorage.setItem('duogym-planner-name', newWorkoutName);
        localStorage.setItem('duogym-planner-exercises', JSON.stringify(exercises));
    }, [isCreating, editingId, newWorkoutName, exercises]);

    // Import/Export State
    const [showImportModal, setShowImportModal] = useState(false);
    const [importJson, setImportJson] = useState('');
    const [importError, setImportError] = useState(null);
    const [copiedId, setCopiedId] = useState(null);

    // Template State
    const [showTemplateModal, setShowTemplateModal] = useState(false);

    const handleAddExercise = (exercise) => {
        setExercises([...exercises, {
            id: generateUUID(),
            name: exercise.name,
            sets: 3,
            reps: '10',
            weight: '',
            restTime: '90',
            isOptional: false,
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

        const workoutData = {
            name: newWorkoutName,
            exercises: exercises
        };

        if (editingId) {
            updateWorkout({ ...workoutData, id: editingId });
        } else {
            addWorkout(workoutData);
        }

        // Clear storage
        setIsCreating(false);
        setEditingId(null);
        setNewWorkoutName('');
        setExercises([]);
        localStorage.removeItem('duogym-planner-creating');
        localStorage.removeItem('duogym-planner-editing-id');
        localStorage.removeItem('duogym-planner-name');
        localStorage.removeItem('duogym-planner-exercises');
    };

    const handleEdit = (workout) => {
        setNewWorkoutName(workout.name);
        setExercises(workout.exercises);
        setEditingId(workout.id);
        setIsCreating(true);
    };

    const handleCancel = () => {
        setIsCreating(false);
        setEditingId(null);
        setNewWorkoutName('');
        setExercises([]);
        localStorage.removeItem('duogym-planner-creating');
        localStorage.removeItem('duogym-planner-editing-id');
        localStorage.removeItem('duogym-planner-name');
        localStorage.removeItem('duogym-planner-exercises');
    };

    // Export Logic
    const handleExport = (workout) => {
        const data = {
            name: workout.name,
            exercises: workout.exercises.map(ex => ({
                name: ex.name,
                sets: ex.sets,
                reps: ex.reps,
                restTime: ex.restTime,
                weight: ex.weight,
                link: ex.link,
                description: ex.description,
                isOptional: ex.isOptional || false
            }))
        };

        navigator.clipboard.writeText(JSON.stringify(data, null, 2));
        setCopiedId(workout.id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    // Import Logic
    const handleFormat = () => {
        try {
            const parsed = JSON.parse(importJson);
            setImportJson(JSON.stringify(parsed, null, 2));
            setImportError(null);
        } catch (e) {
            setImportError(`Format Error: ${e.message}`);
        }
    };

    const handleCopyTemplate = () => {
        const template = {
            "name": "My Custom Routine",
            "exercises": [
                {
                    "name": "Bench Press",
                    "sets": 3,
                    "reps": "8-12",
                    "restTime": "90",
                    "weight": "60",
                    "link": "https://example.com/bench-press",
                    "description": "Keep back flat on bench",
                    "isOptional": false
                }
            ]
        };
        setImportJson(JSON.stringify(template, null, 2));
        setImportError(null);
    };

    const handleImport = () => {
        try {
            if (!importJson.trim()) {
                setImportError("Please paste your JSON code first.");
                return;
            }

            let data;
            try {
                data = JSON.parse(importJson);
            } catch (e) {
                throw new Error(`Invalid JSON syntax: ${e.message}`);
            }

            if (!data.name || typeof data.name !== 'string') {
                throw new Error("Invalid format: Missing or invalid 'name' field.");
            }

            if (!Array.isArray(data.exercises)) {
                throw new Error("Invalid format: 'exercises' must be an array.");
            }

            if (data.exercises.length === 0) {
                throw new Error("Invalid format: 'exercises' array is empty.");
            }

            // Sanitize and add IDs
            const sanitizedExercises = data.exercises.map((ex, index) => {
                if (!ex.name) {
                    throw new Error(`Exercise at index ${index} is missing a 'name'.`);
                }
                return {
                    id: generateUUID(),
                    name: ex.name,
                    sets: ex.sets || 3,
                    reps: ex.reps || '10',
                    restTime: ex.restTime || '90',
                    weight: ex.weight || '',
                    link: ex.link || '',
                    description: ex.description || '',
                    isOptional: ex.isOptional || false
                };
            });

            addWorkout({
                name: data.name,
                exercises: sanitizedExercises
            });

            setShowImportModal(false);
            setImportJson('');
            setImportError(null);
        } catch (e) {
            setImportError(e.message);
        }
    };

    // Template Logic
    const loadTemplate = (template) => {
        setNewWorkoutName(template.name);
        setExercises(template.exercises.map(ex => ({
            id: generateUUID(),
            name: ex.name,
            sets: ex.sets,
            reps: ex.reps,
            restTime: ex.restTime,
            weight: '',
            link: '',
            description: '',
            isOptional: false
        })));
        setShowTemplateModal(false);
    };

    return (
        <div className="space-y-6">
            {showSelector && (
                <ExerciseSelector
                    onSelect={handleAddExercise}
                    onClose={() => setShowSelector(false)}
                />
            )}

            {/* Import Modal */}
            {showImportModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md relative">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-white">Import Routine</h3>
                            <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex justify-between items-end mb-2">
                            <p className="text-sm text-slate-400">Paste JSON below:</p>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleCopyTemplate}
                                    className="text-xs bg-slate-800 hover:bg-slate-700 text-sky-400 px-2 py-1 rounded border border-slate-700 transition-colors flex items-center gap-1"
                                    title="Load a sample template"
                                >
                                    <Copy size={12} /> Template
                                </button>
                                <button
                                    onClick={handleFormat}
                                    className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded border border-slate-700 transition-colors flex items-center gap-1"
                                    title="Format JSON code"
                                >
                                    <Braces size={12} /> Format
                                </button>
                            </div>
                        </div>

                        <textarea
                            value={importJson}
                            onChange={(e) => {
                                setImportJson(e.target.value);
                                setImportError(null);
                            }}
                            placeholder='{"name": "My Workout", "exercises": [...] }'
                            className="w-full h-40 bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-300 focus:outline-none focus:border-sky-500 mb-4"
                        />

                        {importError && (
                            <p className="text-red-400 text-sm mb-4 bg-red-400/10 p-2 rounded border border-red-400/20">
                                {importError}
                            </p>
                        )}

                        <div className="flex justify-end gap-3">
                            <button onClick={() => setShowImportModal(false)} className="btn btn-secondary w-full md:w-auto">Cancel</button>
                            <button onClick={handleImport} className="btn btn-primary w-full md:w-auto" disabled={!importJson.trim()}>
                                <Download size={18} /> Import
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Template Modal */}
            {showTemplateModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-2xl relative max-h-[80vh] flex flex-col">
                        <div className="flex justify-between items-center mb-4 shrink-0">
                            <div>
                                <h3 className="text-xl font-bold text-white">Template Library</h3>
                                <p className="text-slate-400 text-sm">Choose a routine to get started.</p>
                            </div>
                            <button onClick={() => setShowTemplateModal(false)} className="text-slate-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto pr-2">
                            {templates.map(template => (
                                <button
                                    key={template.id}
                                    onClick={() => loadTemplate(template)}
                                    className="text-left bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-sky-500/50 p-4 rounded-xl transition-all group"
                                >
                                    <h4 className="font-bold text-white mb-1 group-hover:text-sky-400 transition-colors">{template.name}</h4>
                                    <p className="text-xs text-slate-400 mb-3 line-clamp-2">{template.description}</p>
                                    <div className="flex flex-wrap gap-1">
                                        {template.exercises.slice(0, 3).map((ex, i) => (
                                            <span key={i} className="text-[10px] bg-slate-900 text-slate-500 px-1.5 py-0.5 rounded border border-slate-800">
                                                {ex.name}
                                            </span>
                                        ))}
                                        {template.exercises.length > 3 && (
                                            <span className="text-[10px] text-slate-500 px-1 py-0.5">+{template.exercises.length - 3}</span>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <header className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2">Workout Planner</h2>
                    <p className="text-slate-400">Design your training routines.</p>
                </div>
                {!isCreating && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowImportModal(true)}
                            className="btn btn-secondary"
                        >
                            <Download size={20} />
                            <span className="hidden md:inline">Import</span>
                        </button>
                        <button
                            onClick={() => setIsCreating(true)}
                            className="btn btn-primary"
                        >
                            <Plus size={20} />
                            <span className="hidden md:inline">New Plan</span>
                            <span className="md:hidden">New</span>
                        </button>
                    </div>
                )}
            </header>

            {isCreating ? (
                <div className="glass-card animate-fade-in">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-white">{editingId ? 'Edit Routine' : 'Create New Routine'}</h3>
                        <button onClick={handleCancel} className="text-slate-400 hover:text-white">
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
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setShowTemplateModal(true)}
                                        className="text-sm text-slate-400 hover:text-white font-medium flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-800 transition-colors"
                                    >
                                        <BookOpen size={16} /> Load Template
                                    </button>
                                    <button onClick={() => setShowSelector(true)} className="text-sm text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1 px-2 py-1">
                                        <Plus size={16} /> Add Exercise
                                    </button>
                                </div>
                            </div>

                            {/* Desktop Headers */}
                            <div className="hidden md:grid md:grid-cols-12 gap-2 px-3 mb-2 text-xs font-medium text-slate-500 uppercase tracking-wider">
                                <div className="md:col-span-5 pl-8">Exercise</div>
                                <div className="md:col-span-7 grid grid-cols-7 gap-2 text-center">
                                    <div className="col-span-2">Sets</div>
                                    <div className="col-span-2">Reps</div>
                                    <div className="col-span-3">Rest (s)</div>
                                </div>
                            </div>

                            {exercises.map((ex, idx) => (
                                <div key={ex.id} className="bg-slate-800/30 p-3 rounded-lg border border-slate-700/30 relative">
                                    <div className="absolute top-3 left-3 text-slate-500 font-mono text-sm">{idx + 1}</div>
                                    <div className="absolute top-2 right-2">
                                        <button onClick={() => removeExercise(ex.id)} className="text-slate-500 hover:text-red-400 p-2">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>

                                    <div className="mt-6 md:mt-0 md:ml-8 md:mr-10 grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-2 items-center">
                                        <div className="md:col-span-5">
                                            <label className="block text-xs text-slate-500 md:hidden mb-1">Exercise Name</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Exercise Name"
                                                    value={ex.name}
                                                    onChange={(e) => updateExercise(ex.id, 'name', e.target.value)}
                                                    className="w-full bg-transparent border-b border-slate-700 focus:border-sky-500 text-white px-2 py-1 outline-none text-sm"
                                                />
                                                <button
                                                    onClick={() => updateExercise(ex.id, 'isOptional', !ex.isOptional)}
                                                    className={clsx(
                                                        "px-2 py-1 rounded text-xs font-medium border transition-colors whitespace-nowrap",
                                                        ex.isOptional
                                                            ? "bg-amber-500/10 text-amber-500 border-amber-500/50 hover:bg-amber-500/20"
                                                            : "bg-slate-800 text-slate-500 border-slate-700 hover:text-slate-300"
                                                    )}
                                                    title="Toggle Optional"
                                                >
                                                    {ex.isOptional ? 'Optional' : 'Required'}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-4 md:col-span-7 md:grid-cols-7 md:gap-2">
                                            <div className="md:col-span-2">
                                                <label className="block text-xs text-slate-500 md:hidden mb-1 text-center">Sets</label>
                                                <input
                                                    type="number"
                                                    placeholder="Sets"
                                                    value={ex.sets}
                                                    onChange={(e) => updateExercise(ex.id, 'sets', e.target.value)}
                                                    className="w-full bg-transparent border-b border-slate-700 focus:border-sky-500 text-white px-2 py-1 outline-none text-center text-sm"
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-xs text-slate-500 md:hidden mb-1 text-center">Reps</label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. 8-12"
                                                    value={ex.reps}
                                                    onChange={(e) => updateExercise(ex.id, 'reps', e.target.value)}
                                                    className="w-full bg-transparent border-b border-slate-700 focus:border-sky-500 text-white px-2 py-1 outline-none text-center text-sm"
                                                />
                                            </div>
                                            <div className="md:col-span-3">
                                                <label className="block text-xs text-slate-500 md:hidden mb-1 text-center">Rest (s)</label>
                                                <input
                                                    type="number"
                                                    placeholder="Rest (s)"
                                                    value={ex.restTime || '90'}
                                                    onChange={(e) => updateExercise(ex.id, 'restTime', e.target.value)}
                                                    className="w-full bg-transparent border-b border-slate-700 focus:border-sky-500 text-white px-2 py-1 outline-none text-center text-sm"
                                                />
                                            </div>

                                            <div className="md:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                                <input
                                                    type="text"
                                                    placeholder="External Link (YouTube/Image)"
                                                    value={ex.link || ''}
                                                    onChange={(e) => updateExercise(ex.id, 'link', e.target.value)}
                                                    className="w-full bg-transparent border-b border-slate-700 focus:border-sky-500 text-slate-400 px-2 py-1 outline-none text-xs"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Instructions / Description"
                                                    value={ex.description || ''}
                                                    onChange={(e) => updateExercise(ex.id, 'description', e.target.value)}
                                                    className="w-full bg-transparent border-b border-slate-700 focus:border-sky-500 text-slate-400 px-2 py-1 outline-none text-xs"
                                                />
                                            </div>
                                        </div>
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
                        <button onClick={handleCancel} className="btn btn-secondary">Cancel</button>
                        <button onClick={handleSave} className="btn btn-primary" disabled={!newWorkoutName}>
                            <Save size={18} /> Save Routine
                        </button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {workouts.map(workout => (
                        <div key={workout.id} className="glass-card group relative">
                            <div className="absolute top-4 right-4 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                <button
                                    onClick={() => handleExport(workout)}
                                    className="p-2 text-slate-400 hover:text-sky-400 hover:bg-sky-400/10 rounded-lg transition-colors"
                                    title="Share / Export"
                                >
                                    {copiedId === workout.id ? <Check size={18} className="text-emerald-400" /> : <Share2 size={18} />}
                                </button>
                                <button
                                    onClick={() => handleEdit(workout)}
                                    className="p-2 text-slate-400 hover:text-sky-400 hover:bg-sky-400/10 rounded-lg transition-colors"
                                    title="Edit"
                                >
                                    <Pencil size={18} />
                                </button>
                                <button
                                    onClick={() => deleteWorkout(workout.id)}
                                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                    title="Delete"
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
                                        <span className="text-slate-500 text-xs">{ex.sets} sets • {ex.reps} reps • {ex.restTime || 90}s</span>
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
                            <div className="flex justify-center gap-4">
                                <button onClick={() => setShowImportModal(true)} className="btn btn-secondary">
                                    <Download size={18} /> Import
                                </button>
                                <button onClick={() => setIsCreating(true)} className="btn btn-primary">
                                    <Plus size={18} /> Create
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Planner;
