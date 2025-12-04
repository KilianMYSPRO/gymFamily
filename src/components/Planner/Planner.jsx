import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Plus, Trash2, Dumbbell, Save, X, Pencil, Share2, Download, Copy, Check, BookOpen, Braces, FileJson, Link, CheckSquare, Square, ChevronUp, ChevronDown } from 'lucide-react';
import clsx from 'clsx';
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
    const [copiedId, setCopiedId] = useState(null);

    // Template State
    const [showTemplateModal, setShowTemplateModal] = useState(false);

    // Superset State
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedExercises, setSelectedExercises] = useState([]);

    const toggleSelection = (id) => {
        if (selectedExercises.includes(id)) {
            setSelectedExercises(selectedExercises.filter(exId => exId !== id));
        } else {
            setSelectedExercises([...selectedExercises, id]);
        }
    };

    const handleGroup = () => {
        if (selectedExercises.length < 2) return;

        const supersetId = generateUUID();
        setExercises(exercises.map(ex =>
            selectedExercises.includes(ex.id) ? { ...ex, supersetId } : ex
        ));

        setSelectedExercises([]);
        setSelectionMode(false);
    };

    const handleUngroup = () => {
        if (selectedExercises.length === 0) return;

        setExercises(exercises.map(ex =>
            selectedExercises.includes(ex.id) ? { ...ex, supersetId: undefined } : ex
        ));

        setSelectedExercises([]);
        setSelectionMode(false);
    };

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
                            className="w-full h-40 bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-300 focus:outline-none focus:border-sky-500 mb-4"
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
                            className="w-full flex-1 bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-300 focus:outline-none focus:border-sky-500 mb-4 resize-none"
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

            <header className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2">{t('planner.title')}</h2>
                    <p className="text-slate-400">{t('planner.subtitle')}</p>
                </div>
                {!isCreating && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowImportModal(true)}
                            className="btn btn-secondary"
                        >
                            <Download size={20} />
                            <span className="hidden md:inline">{t('planner.import')}</span>
                        </button>
                        <button
                            onClick={() => setIsCreating(true)}
                            className="btn btn-primary"
                        >
                            <Plus size={20} />
                            <span className="hidden md:inline">{t('planner.newPlan')}</span>
                            <span className="md:hidden">{t('planner.create')}</span>
                        </button>
                    </div>
                )}
            </header>

            {isCreating ? (
                <div className="glass-card animate-fade-in">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-white">{editingId ? t('planner.editRoutine') : t('planner.createRoutine')}</h3>
                        <button onClick={handleCancel} className="text-slate-400 hover:text-white">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="space-y-4 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">{t('planner.routineName')}</label>
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
                                <label className="block text-sm font-medium text-slate-400">{t('planner.exercises')}</label>
                                <div className="flex gap-2">
                                    {selectionMode ? (
                                        <>
                                            <button
                                                onClick={handleGroup}
                                                disabled={selectedExercises.length < 2}
                                                className="text-sm text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 px-2 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <Link size={16} /> {t('planner.group')}
                                            </button>
                                            <button
                                                onClick={handleUngroup}
                                                disabled={selectedExercises.length === 0}
                                                className="text-sm text-slate-400 hover:text-slate-300 font-medium flex items-center gap-1 px-2 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <Link size={16} className="rotate-45" /> {t('planner.ungroup')}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectionMode(false);
                                                    setSelectedExercises([]);
                                                }}
                                                className="text-sm text-slate-400 hover:text-white font-medium px-2 py-1"
                                            >
                                                {t('planner.cancel')}
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => setSelectionMode(true)}
                                            className="text-sm text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 px-2 py-1"
                                        >
                                            <CheckSquare size={16} /> {t('planner.selectMode')}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setShowImportModal(true)}
                                        className="text-sm text-slate-400 hover:text-white font-medium flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-800 transition-colors"
                                        title={t('planner.import')}
                                    >
                                        <Download size={16} /> <span className="hidden sm:inline">{t('planner.import')}</span>
                                    </button>
                                    <button
                                        onClick={() => setShowTemplateModal(true)}
                                        className="text-sm text-slate-400 hover:text-white font-medium flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-800 transition-colors"
                                    >
                                        <BookOpen size={16} /> <span className="hidden sm:inline">{t('planner.loadTemplate')}</span>
                                    </button>
                                    <button onClick={() => setShowSelector(true)} className="text-sm text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1 px-2 py-1">
                                        <Plus size={16} /> {t('planner.addExercise')}
                                    </button>
                                </div>
                            </div>

                            {/* Desktop Headers */}
                            <div className="hidden md:grid md:grid-cols-12 gap-2 px-3 mb-2 text-xs font-medium text-slate-500 uppercase tracking-wider">
                                <div className="md:col-span-5 pl-8">{t('planner.exercises')}</div>
                                <div className="md:col-span-7 grid grid-cols-7 gap-2 text-center">
                                    <div className="col-span-2">{t('planner.sets')}</div>
                                    <div className="col-span-2">{t('planner.reps')}</div>
                                    <div className="col-span-3">{t('planner.rest')}</div>
                                </div>
                            </div>

                            {exercises.map((ex, idx) => {
                                const isSelected = selectedExercises.includes(ex.id);
                                const isSuperset = !!ex.supersetId;
                                // Find if previous/next exercise is in same superset for visual grouping
                                const prevEx = exercises[idx - 1];
                                const nextEx = exercises[idx + 1];
                                const isSupersetStart = isSuperset && (!prevEx || prevEx.supersetId !== ex.supersetId);
                                const isSupersetEnd = isSuperset && (!nextEx || nextEx.supersetId !== ex.supersetId);
                                const isSupersetMiddle = isSuperset && !isSupersetStart && !isSupersetEnd;

                                return (
                                    <div key={ex.id} className={clsx(
                                        "bg-slate-800/30 p-3 rounded-lg border relative transition-all",
                                        isSelected ? "border-sky-500 bg-sky-500/10" : "border-slate-700/30",
                                        isSuperset && "border-l-4 border-l-indigo-500"
                                    )}>
                                        {selectionMode && (
                                            <button
                                                onClick={() => toggleSelection(ex.id)}
                                                className="absolute top-3 left-3 z-10 text-slate-400 hover:text-white"
                                            >
                                                {isSelected ? <CheckSquare size={20} className="text-sky-500" /> : <Square size={20} />}
                                            </button>
                                        )}
                                        <div className={clsx("absolute top-3 left-3 text-slate-500 font-mono text-sm", selectionMode && "opacity-0")}>{idx + 1}</div>
                                        {isSuperset && (
                                            <div className="absolute top-1/2 -translate-y-1/2 -left-3 w-6 h-full flex items-center justify-center">
                                                <div className="w-0.5 h-full bg-indigo-500/50"></div>
                                            </div>
                                        )}
                                        <div className="absolute top-2 right-2 flex items-center gap-1">
                                            <div className="flex flex-col mr-2">
                                                <button
                                                    onClick={() => moveExercise(idx, 'up')}
                                                    disabled={idx === 0 || selectionMode}
                                                    className="text-slate-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed p-0.5"
                                                    title={t('planner.moveUp')}
                                                >
                                                    <ChevronUp size={16} />
                                                </button>
                                                <button
                                                    onClick={() => moveExercise(idx, 'down')}
                                                    disabled={idx === exercises.length - 1 || selectionMode}
                                                    className="text-slate-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed p-0.5"
                                                    title={t('planner.moveDown')}
                                                >
                                                    <ChevronDown size={16} />
                                                </button>
                                            </div>
                                            <button onClick={() => removeExercise(ex.id)} className="text-slate-500 hover:text-red-400 p-2">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>

                                        <div className="mt-6 md:mt-0 md:ml-8 md:mr-10 grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-2 items-center">
                                            <div className="md:col-span-5">
                                                <label className="block text-xs text-slate-500 md:hidden mb-1">{t('planner.exerciseName')}</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        placeholder={t('planner.exerciseName')}
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
                                                        {ex.isOptional ? t('planner.optional') : t('planner.required')}
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-3 gap-4 md:col-span-7 md:grid-cols-7 md:gap-2">
                                                <div className="md:col-span-2">
                                                    <label className="block text-xs text-slate-500 md:hidden mb-1 text-center">{t('planner.sets')}</label>
                                                    <input
                                                        type="number"
                                                        placeholder={t('planner.setsPlaceholder')}
                                                        value={ex.sets}
                                                        onChange={(e) => updateExercise(ex.id, 'sets', e.target.value)}
                                                        className="w-full bg-slate-950/50 border border-slate-700/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500 text-center text-base font-bold transition-all"
                                                    />
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label className="block text-xs text-slate-500 md:hidden mb-1 text-center">{t('planner.reps')}</label>
                                                    <input
                                                        type="text"
                                                        placeholder={t('planner.repsPlaceholder')}
                                                        value={ex.reps}
                                                        onChange={(e) => updateExercise(ex.id, 'reps', e.target.value)}
                                                        className="w-full bg-slate-950/50 border border-slate-700/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500 text-center text-base font-bold transition-all"
                                                    />
                                                </div>
                                                <div className="md:col-span-3">
                                                    <label className="block text-xs text-slate-500 md:hidden mb-1 text-center">{t('planner.rest')}</label>
                                                    <input
                                                        type="number"
                                                        placeholder={t('planner.restPlaceholder')}
                                                        value={ex.restTime || '90'}
                                                        onChange={(e) => updateExercise(ex.id, 'restTime', e.target.value)}
                                                        className="w-full bg-slate-950/50 border border-slate-700/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500 text-center text-base font-bold transition-all"
                                                    />
                                                </div>

                                                <div className="col-span-3 md:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                                    <input
                                                        type="text"
                                                        placeholder={t('planner.linkPlaceholder')}
                                                        value={ex.link || ''}
                                                        onChange={(e) => updateExercise(ex.id, 'link', e.target.value)}
                                                        className="w-full bg-slate-950/30 border border-slate-700/30 rounded-lg px-3 py-2 text-slate-400 focus:text-white focus:outline-none focus:border-sky-500 text-sm transition-all"
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder={t('planner.descPlaceholder')}
                                                        value={ex.description || ''}
                                                        onChange={(e) => updateExercise(ex.id, 'description', e.target.value)}
                                                        className="w-full bg-slate-950/30 border border-slate-700/30 rounded-lg px-3 py-2 text-slate-400 focus:text-white focus:outline-none focus:border-sky-500 text-sm transition-all"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {exercises.length === 0 && (
                                <div className="text-center py-8 text-slate-500 border-2 border-dashed border-slate-800 rounded-lg">
                                    {t('planner.noExercises')}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3">
                        <button onClick={handleCancel} className="btn btn-secondary">{t('planner.cancel')}</button>
                        <button onClick={handleSave} className="btn btn-primary" disabled={!newWorkoutName}>
                            <Save size={18} /> {t('planner.saveRoutine')}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {workouts.map(workout => (
                        <div key={workout.id} className="glass-card group relative">
                            <div className="absolute top-4 right-4 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                <button
                                    onClick={() => handleEditJson(workout)}
                                    className="p-2 text-slate-400 hover:text-sky-400 hover:bg-sky-400/10 rounded-lg transition-colors"
                                    title={t('planner.editJson')}
                                >
                                    <FileJson size={18} />
                                </button>
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

                            <div className="flex items-center gap-4 mb-4 pr-36">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center border border-slate-600">
                                    <Dumbbell size={24} className="text-sky-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">{workout.name}</h3>
                                    <p className="text-sm text-slate-400">{workout.exercises.length} {t('planner.exercises')}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                {workout.exercises.slice(0, 3).map((ex, i) => (
                                    <div key={i} className="flex justify-between text-sm text-slate-300 border-b border-slate-800/50 pb-1 last:border-0">
                                        <span>{ex.name}</span>
                                        <span className="text-slate-500 text-xs">{ex.sets} {t('planner.sets')} • {ex.reps} {t('planner.reps')} • {ex.restTime || 90}s</span>
                                    </div>
                                ))}
                                {workout.exercises.length > 3 && (
                                    <p className="text-xs text-slate-500 pt-1">+{workout.exercises.length - 3} {t('planner.more')}</p>
                                )}
                            </div>
                        </div>
                    ))}

                    {workouts.length === 0 && (
                        <div className="col-span-full text-center py-12">
                            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-500">
                                <Dumbbell size={32} />
                            </div>
                            <h3 className="text-lg font-medium text-white mb-2">{t('planner.noRoutines')}</h3>
                            <p className="text-slate-400 mb-6">{t('planner.noRoutinesSubtitle')}</p>
                            <div className="flex justify-center gap-4">
                                <button onClick={() => setShowImportModal(true)} className="btn btn-secondary">
                                    <Download size={18} /> {t('planner.import')}
                                </button>
                                <button onClick={() => setIsCreating(true)} className="btn btn-primary">
                                    <Plus size={18} /> {t('planner.create')}
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
