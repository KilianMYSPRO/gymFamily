import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Plus, Trash2, Dumbbell, Save, X, Pencil, Share2, Download, Copy, Check, BookOpen, Braces, FileJson, Link, ChevronUp, ChevronDown } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

import { generateUUID } from '../../utils/uuid';
import ExerciseSelector from './ExerciseSelector';
import templates from '../../data/templates.json';
import exercisesData from '../../data/exercises.json';

const Planner = () => {
    const { t } = useLanguage();
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

    // JSON Editor State
    const [editingJsonId, setEditingJsonId] = useState(null);
    const [jsonContent, setJsonContent] = useState('');
    const [jsonError, setJsonError] = useState(null);

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

    // Template State
    const [showTemplateModal, setShowTemplateModal] = useState(false);

    const moveExercise = (index, direction) => {
        const newExercises = [...exercises];
        if (direction === 'up' && index > 0) {
            [newExercises[index], newExercises[index - 1]] = [newExercises[index - 1], newExercises[index]];
        } else if (direction === 'down' && index < newExercises.length - 1) {
            [newExercises[index], newExercises[index + 1]] = [newExercises[index + 1], newExercises[index]];
        }
        setExercises(newExercises);
    };

    const findExerciseId = (name) => {
        const match = exercisesData.find(ex => ex.name.toLowerCase() === name.toLowerCase());
        return match ? match.id : null;
    };

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
        // Regenerate IDs to ensure uniqueness and prevent linked-editing bugs
        setExercises(workout.exercises.map(ex => ({ ...ex, id: generateUUID() })));
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

    // Import Logic
    const handleFormat = () => {
        try {
            const parsed = JSON.parse(importJson);
            setImportJson(JSON.stringify(parsed, null, 2));
            setImportError(null);
        } catch (e) {
            setImportError(`${t('planner.formatError')}: ${e.message}`);
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
                setImportError(t('planner.pasteJson'));
                return;
            }

            let data;
            try {
                data = JSON.parse(importJson);
            } catch (e) {
                throw new Error(`${t('planner.invalidJson')}: ${e.message}`);
            }

            if (!data.name || typeof data.name !== 'string') {
                throw new Error(`${t('planner.invalidJson')}: ${t('planner.missingName')}`);
            }

            if (!Array.isArray(data.exercises)) {
                throw new Error(t('planner.invalidFormatArray'));
            }

            if (data.exercises.length === 0) {
                throw new Error(t('planner.invalidFormatEmpty'));
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
                    isOptional: ex.isOptional || false,
                    originalId: findExerciseId(ex.name)
                };
            });

            if (isCreating) {
                // Populate form instead of saving immediately
                setNewWorkoutName(data.name);
                setExercises(sanitizedExercises);
            } else {
                // Default behavior: Add to list immediately
                addWorkout({
                    name: data.name,
                    exercises: sanitizedExercises
                });
            }

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
            isOptional: false,
            originalId: findExerciseId(ex.name)
        })));
        setShowTemplateModal(false);
    };

    const handleOpenImport = () => {
        if (isCreating && (exercises.length > 0 || newWorkoutName)) {
            const currentData = {
                name: newWorkoutName,
                exercises: exercises.map(ex => ({
                    name: ex.name,
                    sets: ex.sets,
                    reps: ex.reps,
                    restTime: ex.restTime,
                    weight: ex.weight,
                    link: ex.link,
                    description: ex.description,
                    isOptional: ex.isOptional || false,
                }))
            };
            setImportJson(JSON.stringify(currentData, null, 2));
        } else {
            setImportJson('');
        }
        setImportError(null);
        setShowImportModal(true);
    };

    // JSON Editor Logic
    const handleEditJson = (workout) => {
        setEditingJsonId(workout.id);
        setJsonContent(JSON.stringify(workout, null, 2));
        setJsonError(null);
    };

    const handleFormatJson = () => {
        try {
            const parsed = JSON.parse(jsonContent);
            setJsonContent(JSON.stringify(parsed, null, 2));
            setJsonError(null);
        } catch (e) {
            setJsonError(`${t('planner.formatError')}: ${e.message}`);
        }
    };

    const handleSaveJson = () => {
        try {
            const parsed = JSON.parse(jsonContent);

            if (!parsed.name || typeof parsed.name !== 'string') {
                throw new Error(t('planner.missingName'));
            }

            if (!Array.isArray(parsed.exercises)) {
                throw new Error(t('planner.invalidFormatArray'));
            }

            // Ensure ID matches
            if (parsed.id !== editingJsonId) {
                // Force the ID to match the one we are editing to prevent duplicates/confusion
                parsed.id = editingJsonId;
            }

            // Regenerate IDs for all exercises to prevent duplicates from copy-paste
            parsed.exercises = parsed.exercises.map(ex => ({
                ...ex,
                id: generateUUID()
            }));

            updateWorkout(parsed);
            setEditingJsonId(null);
            setJsonContent('');
            setJsonError(null);
        } catch (e) {
            setJsonError(`${t('planner.invalidJson')}: ${e.message}`);
        }
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
                            <h3 className="text-xl font-bold text-white">{t('planner.importRoutine')}</h3>
                            <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex justify-between items-end mb-2">
                            <p className="text-sm text-slate-400">{t('planner.pasteJson')}</p>
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
                                    title={t('planner.formatJson')}
                                >
                                    <Braces size={12} /> {t('planner.format')}
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
                            className="w-full h-40 bg-slate-950 border border-slate-800 rounded-lg p-3 text-base md:text-xs font-mono text-slate-300 focus:outline-none focus:border-sky-500 mb-4"
                        />

                        {importError && (
                            <p className="text-red-400 text-sm mb-4 bg-red-400/10 p-2 rounded border border-red-400/20">
                                {importError}
                            </p>
                        )}

                        <div className="flex justify-end gap-3">
                            <button onClick={() => setShowImportModal(false)} className="btn btn-secondary w-full md:w-auto">{t('planner.cancel')}</button>
                            <button onClick={handleImport} className="btn btn-primary w-full md:w-auto" disabled={!importJson.trim()}>
                                <Download size={18} /> {t('planner.import')}
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
                                <h3 className="text-xl font-bold text-white">{t('planner.templateLibrary')}</h3>
                                <p className="text-slate-400 text-sm">{t('planner.chooseTemplate')}</p>
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

            {/* JSON Editor Modal */}
            {editingJsonId && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-2xl relative flex flex-col h-[80vh]">
                        <div className="flex justify-between items-center mb-4 shrink-0">
                            <div>
                                <h3 className="text-xl font-bold text-white">{t('planner.editJson')}</h3>
                                <p className="text-slate-400 text-sm">{t('planner.editJsonSubtitle')}</p>
                            </div>
                            <button onClick={() => setEditingJsonId(null)} className="text-slate-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex justify-end mb-2 shrink-0">
                            <button
                                onClick={handleFormatJson}
                                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded border border-slate-700 transition-colors flex items-center gap-1"
                                title={t('planner.formatJson')}
                            >
                                <Braces size={12} /> {t('planner.format')}
                            </button>
                        </div>

                        <textarea
                            value={jsonContent}
                            onChange={(e) => {
                                setJsonContent(e.target.value);
                                setJsonError(null);
                            }}
                            className="w-full flex-1 bg-slate-950 border border-slate-800 rounded-lg p-3 text-base md:text-xs font-mono text-slate-300 focus:outline-none focus:border-sky-500 mb-4 resize-none"
                        />

                        {jsonError && (
                            <p className="text-red-400 text-sm mb-4 bg-red-400/10 p-2 rounded border border-red-400/20 shrink-0">
                                {jsonError}
                            </p>
                        )}

                        <div className="flex justify-end gap-3 shrink-0">
                            <button onClick={() => setEditingJsonId(null)} className="btn btn-secondary w-full md:w-auto">{t('planner.cancel')}</button>
                            <button onClick={handleSaveJson} className="btn btn-primary w-full md:w-auto">
                                <Save size={18} /> {t('planner.saveRoutine')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <header className="flex justify-between items-center mb-4">
                <div>
                    <h2 className="text-xl font-bold text-white">{t('planner.title')}</h2>
                </div>
                {!isCreating && (
                    <div className="flex gap-2">
                        <button
                            onClick={handleOpenImport}
                            className="btn btn-secondary py-2 px-3 text-sm"
                        >
                            <Download size={16} />
                            <span className="hidden md:inline">{t('planner.import')}</span>
                        </button>
                        <button
                            onClick={() => setIsCreating(true)}
                            className="btn btn-primary py-2 px-3 text-sm"
                        >
                            <Plus size={16} />
                            <span className="hidden md:inline">{t('planner.newPlan')}</span>
                            <span className="md:hidden">{t('planner.create')}</span>
                        </button>
                    </div>
                )}
            </header>

            {isCreating ? (
                <div className="bg-slate-900/40 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/5 animate-fade-in">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-xl font-black italic text-white uppercase tracking-tight">{editingId ? t('planner.editRoutine') : t('planner.createRoutine')}</h3>
                        <button onClick={handleCancel} className="p-2 hover:bg-white/10 rounded-xl text-slate-500 hover:text-white transition-all">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="space-y-6 mb-8">
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1">{t('planner.routineName')}</label>
                            <input
                                type="text"
                                value={newWorkoutName}
                                onChange={(e) => setNewWorkoutName(e.target.value)}
                                placeholder="e.g. PUSH DAY"
                                className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl px-5 py-4 text-white font-bold focus:outline-none focus:border-sky-500 transition-all shadow-inner"
                            />
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center px-1">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{t('planner.exercises')}</label>
                                <div className="flex gap-2">
                                    <button onClick={() => setShowSelector(true)} className="text-[10px] font-black text-sky-400 hover:text-sky-300 uppercase tracking-widest bg-sky-500/10 px-3 py-1.5 rounded-full border border-sky-500/20 transition-all active:scale-95">
                                        + {t('planner.addExercise')}
                                    </button>
                                </div>
                            </div>

                            {exercises.map((ex, idx) => (
                                <div key={ex.id} className="bg-slate-950/30 p-4 rounded-3xl border border-white/5 relative group transition-all">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <span className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-500">{idx + 1}</span>
                                            <input
                                                type="text"
                                                value={ex.name}
                                                onChange={(e) => updateExercise(ex.id, 'name', e.target.value)}
                                                className="bg-transparent border-b border-transparent focus:border-sky-500 text-white font-bold outline-none transition-all truncate max-w-[150px] sm:max-w-none"
                                            />
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => moveExercise(idx, 'up')} disabled={idx === 0} className="p-1.5 text-slate-600 hover:text-white disabled:opacity-0 transition-all"><ChevronUp size={18} /></button>
                                            <button onClick={() => moveExercise(idx, 'down')} disabled={idx === exercises.length - 1} className="p-1.5 text-slate-600 hover:text-white disabled:opacity-0 transition-all"><ChevronDown size={18} /></button>
                                            <button onClick={() => removeExercise(ex.id)} className="p-1.5 text-slate-600 hover:text-red-400 transition-all ml-1"><Trash2 size={18} /></button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[8px] font-black text-slate-600 uppercase tracking-tighter text-center">{t('planner.sets')}</span>
                                            <input
                                                type="number"
                                                value={ex.sets}
                                                onChange={(e) => updateExercise(ex.id, 'sets', e.target.value)}
                                                className="w-full bg-slate-900/50 border border-white/5 rounded-xl py-2 text-center text-white font-black text-sm focus:border-sky-500 outline-none transition-all"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[8px] font-black text-slate-600 uppercase tracking-tighter text-center">{t('planner.reps')}</span>
                                            <input
                                                type="text"
                                                value={ex.reps}
                                                onChange={(e) => updateExercise(ex.id, 'reps', e.target.value)}
                                                className="w-full bg-slate-900/50 border border-white/5 rounded-xl py-2 text-center text-white font-black text-sm focus:border-sky-500 outline-none transition-all"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[8px] font-black text-slate-600 uppercase tracking-tighter text-center">{t('planner.rest')}</span>
                                            <input
                                                type="number"
                                                value={ex.restTime}
                                                onChange={(e) => updateExercise(ex.id, 'restTime', e.target.value)}
                                                className="w-full bg-slate-900/50 border border-white/5 rounded-xl py-2 text-center text-white font-black text-sm focus:border-sky-500 outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {exercises.length === 0 && (
                                <div className="text-center py-12 text-slate-600 border-2 border-dashed border-white/5 rounded-3xl">
                                    <p className="text-xs font-bold uppercase tracking-widest">{t('planner.noExercises')}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-3 mt-8">
                        <button onClick={handleCancel} className="flex-1 py-4 rounded-2xl bg-slate-800 text-slate-400 font-bold uppercase tracking-widest text-xs active:scale-95 transition-all">{t('planner.cancel')}</button>
                        <button onClick={handleSave} disabled={!newWorkoutName} className="flex-[2] py-4 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-sky-500/20 active:scale-95 transition-all disabled:opacity-50">{t('planner.saveRoutine')}</button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {workouts.map(workout => (
                        <div key={workout.id} className="bg-slate-900/40 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/5 relative group hover:border-sky-500/30 transition-all duration-500 shadow-xl overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all">
                                <button
                                    onClick={() => handleEditJson(workout)}
                                    className="p-2 bg-slate-800 hover:bg-sky-500 text-slate-400 hover:text-white rounded-xl transition-all"
                                    title={t('planner.editJson')}
                                >
                                    <FileJson size={16} />
                                </button>
                                <button onClick={() => handleEdit(workout)} className="p-2 bg-slate-800 hover:bg-sky-500 text-slate-400 hover:text-white rounded-xl transition-all"><Pencil size={16} /></button>
                                <button onClick={() => deleteWorkout(workout.id)} className="p-2 bg-slate-800 hover:bg-red-500 text-slate-400 hover:text-white rounded-xl transition-all"><Trash2 size={16} /></button>
                            </div>

                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-sky-400 shadow-inner group-hover:bg-sky-500 group-hover:text-white transition-all duration-500">
                                    <Dumbbell size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black italic text-white uppercase tracking-tight leading-tight">{workout.name}</h3>
                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{workout.exercises.length} {t('planner.exercises')}</p>
                                </div>
                            </div>

                            <div className="space-y-2 mb-4">
                                {workout.exercises.slice(0, 3).map((ex, i) => (
                                    <div key={i} className="flex justify-between items-center text-[11px] font-bold text-slate-400 bg-white/5 px-3 py-2 rounded-xl">
                                        <span className="truncate pr-2">{ex.name}</span>
                                        <span className="text-slate-600 shrink-0 font-mono">{ex.sets}×{ex.reps}</span>
                                    </div>
                                ))}
                                {workout.exercises.length > 3 && (
                                    <p className="text-[9px] text-slate-600 font-black uppercase text-center tracking-[0.2em] pt-1">+{workout.exercises.length - 3} {t('planner.more')}</p>
                                )}
                            </div>
                        </div>
                    ))}

                    {workouts.length === 0 && (
                        <div className="col-span-full text-center py-20 bg-slate-900/20 border-2 border-dashed border-white/5 rounded-[3rem]">
                            <Dumbbell size={48} className="mx-auto text-slate-800 mb-4" />
                            <h3 className="text-xl font-black italic text-slate-700 uppercase tracking-tight mb-2">{t('planner.noRoutines')}</h3>
                            <p className="text-slate-600 text-xs font-bold uppercase tracking-widest mb-8">{t('planner.noRoutinesSubtitle')}</p>
                            <button onClick={() => setIsCreating(true)} className="btn bg-white/5 text-sky-400 hover:bg-sky-500 hover:text-white px-8 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all border border-sky-500/20 shadow-xl active:scale-95">
                                {t('planner.createRoutine')}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Planner;
