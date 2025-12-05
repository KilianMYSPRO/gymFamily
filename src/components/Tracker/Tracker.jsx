import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Save, Plus, Trash2, ChevronDown, ChevronUp, Clock, Dumbbell, X, Sun, Info, ExternalLink, ChevronLeft, Calculator, Link } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import useWakeLock from '../../hooks/useWakeLock';
import clsx from 'clsx';
import Tooltip from '../common/Tooltip';
import ConfirmModal from '../common/ConfirmModal';
import RestTimer from './RestTimer';
import PlateCalculator from './PlateCalculator';
import { useLanguage } from '../../context/LanguageContext';
import exercisesData from '../../data/exercises.json';

import { getSuggestedWeight } from '../../utils/progression';
import DuoPanel from '../Duo/DuoPanel';
import { useDuo } from '../../context/DuoContext';

const Tracker = ({ initialWorkoutId, onViewChange }) => {
    const { t } = useLanguage();
    const { workouts, activeWorkout, setActiveWorkout, logSession, history } = useStore();
    const { broadcastUpdate } = useDuo();
    const [elapsedTime, setElapsedTime] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [workoutData, setWorkoutData] = useState(null);
    const [expandedExercises, setExpandedExercises] = useState({});
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showRestTimer, setShowRestTimer] = useState(false);
    const [restTimerDuration, setRestTimerDuration] = useState(90);
    const [showPlateCalculator, setShowPlateCalculator] = useState(false);
    const [calculatorTargetWeight, setCalculatorTargetWeight] = useState('');
    const [nextExerciseName, setNextExerciseName] = useState(null);
    const [suggestions, setSuggestions] = useState({});
    const hasInitialized = useRef(false);

    // Wake Lock
    const { isLocked, request: requestWakeLock, release: releaseWakeLock, type } = useWakeLock();

    // Sync workoutData to activeWorkout to persist state
    useEffect(() => {
        if (workoutData) {
            setActiveWorkout(prev => ({
                ...prev,
                ...workoutData,
                elapsedTime // Ensure time is also up to date
            }));
        }
    }, [workoutData, elapsedTime, setActiveWorkout]);

    // Timer logic & Auto-save
    useEffect(() => {
        let interval;
        if (isRunning) {
            interval = setInterval(() => {
                setElapsedTime(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isRunning]);

    // Initialize workout
    useEffect(() => {
        if (activeWorkout) {
            // Only set workoutData if it's not already set to prevent overwriting local state with stale store data
            if (!workoutData) {
                setWorkoutData(activeWorkout);
                setElapsedTime(activeWorkout.elapsedTime || 0);
            }
            setIsRunning(true);
            requestWakeLock(); // Auto-enable wake lock on start
            hasInitialized.current = true;
        } else if (initialWorkoutId && !hasInitialized.current) {
            const template = workouts.find(w => w.id === initialWorkoutId);
            if (template) {
                startWorkout(template);
                hasInitialized.current = true;
            }
        }
    }, [initialWorkoutId, activeWorkout, workouts, requestWakeLock]);

    // Cleanup wake lock on unmount
    useEffect(() => {
        return () => releaseWakeLock();
    }, [releaseWakeLock]);

    const hasCalculatedSuggestions = useRef(false);

    // Calculate suggestions
    useEffect(() => {
        if (workoutData && history && !hasCalculatedSuggestions.current) {
            const newSuggestions = {};
            workoutData.exercises.forEach(ex => {
                const suggestion = getSuggestedWeight(ex.name, history);
                if (suggestion) {
                    newSuggestions[ex.id] = suggestion;
                }
            });

            // Always mark as calculated so we don't retry endlessly if no suggestions found
            hasCalculatedSuggestions.current = true;

            if (Object.keys(newSuggestions).length > 0) {
                setSuggestions(newSuggestions);
            }
        }
    }, [workoutData, history]);

    const startWorkout = (template) => {
        const newWorkout = {
            ...template,
            name: template.name || t('tracker.unknownWorkout'),
            startTime: new Date().toISOString(),
            exercises: template.exercises.map((ex, i) => {
                const exerciseId = ex.id || `ex-${Date.now()}-${i}`;
                return {
                    ...ex,
                    id: exerciseId,
                    sets: Array.from({ length: parseInt(ex.sets) }).map((_, j) => ({
                        id: `${exerciseId}-set-${j}`, // Unique ID for each set
                        weight: ex.weight || '',
                        reps: ex.reps || '',
                        completed: false
                    }))
                };
            })
        };
        setActiveWorkout(newWorkout);
        setWorkoutData(newWorkout);
        setIsRunning(true);
        requestWakeLock();
    };

    const finishWorkout = () => {
        if (!workoutData) {
            return;
        }

        const completedWorkout = {
            ...workoutData,
            workoutId: workoutData.id,
            name: workoutData.name || t('tracker.unknownWorkout'),
            endTime: new Date().toISOString(),
            duration: elapsedTime,
            exercises: workoutData.exercises.map(ex => ({
                ...ex,
                sets: ex.sets.filter(s => s.completed) // Only save completed sets
            })).filter(ex => ex.sets.length > 0) // Only save exercises with completed sets
        };

        // Calculate total completed sets
        completedWorkout.completedSets = completedWorkout.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);

        logSession(completedWorkout);
        setActiveWorkout(null);
        setIsRunning(false);
        releaseWakeLock();
    };

    const toggleSetComplete = (exerciseIndex, setIndex) => {
        if (!workoutData) return;

        const newExercises = workoutData.exercises.map((ex, i) => {
            if (i === exerciseIndex) {
                return {
                    ...ex,
                    sets: ex.sets.map((s, j) => {
                        if (j === setIndex) {
                            return { ...s, completed: !s.completed };
                        }
                        return s;
                    })
                };
            }
            return ex;
        });

        const updatedWorkout = { ...workoutData, exercises: newExercises };
        setWorkoutData(updatedWorkout);
        setActiveWorkout({ ...updatedWorkout, elapsedTime });

        // Check if set was just completed (it was false before, now true)
        // We need to check the new state
        const isCompleted = newExercises[exerciseIndex].sets[setIndex].completed;

        // ... (inside toggleSetComplete)

        if (isCompleted) {
            const exercise = newExercises[exerciseIndex];
            const duration = parseInt(exercise.restTime) || 90;
            setRestTimerDuration(duration);

            // Broadcast update to partner
            broadcastUpdate({
                exerciseName: exercise.name,
                setNumber: setIndex + 1,
                reps: exercise.sets[setIndex].reps,
                weight: exercise.sets[setIndex].weight
            });

            // Determine next exercise if this is the last set
            const isLastSet = setIndex === exercise.sets.length - 1;
            if (isLastSet) {
                const nextExercise = newExercises[exerciseIndex + 1];
                setNextExerciseName(nextExercise ? nextExercise.name : null);
            } else {
                setNextExerciseName(null);
            }

            setShowRestTimer(true);
        }
    };

    const handleCloseRestTimer = useCallback(() => {
        setShowRestTimer(false);
    }, []);

    const updateSet = (exerciseIndex, setIndex, field, value) => {
        if (!workoutData) return;

        const newExercises = workoutData.exercises.map((ex, i) => {
            if (i === exerciseIndex) {
                return {
                    ...ex,
                    sets: ex.sets.map((s, j) => {
                        if (j === setIndex) {
                            return { ...s, [field]: value };
                        }
                        return s;
                    })
                };
            }
            return ex;
        });

        const updatedWorkout = { ...workoutData, exercises: newExercises };
        setWorkoutData(updatedWorkout);
        setActiveWorkout({ ...updatedWorkout, elapsedTime });
    };

    const addSet = (exerciseIndex) => {
        if (!workoutData) return;

        const newExercises = workoutData.exercises.map((ex, i) => {
            if (i === exerciseIndex) {
                const previousSet = ex.sets[ex.sets.length - 1];
                return {
                    ...ex,
                    sets: [
                        ...ex.sets,
                        {
                            id: Date.now(),
                            weight: previousSet ? previousSet.weight : '',
                            reps: previousSet ? previousSet.reps : '',
                            completed: false
                        }
                    ]
                };
            }
            return ex;
        });

        const updatedWorkout = { ...workoutData, exercises: newExercises };
        setWorkoutData(updatedWorkout);
        // Note: We don't necessarily need to sync to activeWorkout here unless we want to persist empty sets immediately,
        // but for consistency let's do it.
        setActiveWorkout({ ...updatedWorkout, elapsedTime });
    };

    const removeSet = (exerciseIndex, setIndex) => {
        if (!workoutData) return;

        const newExercises = workoutData.exercises.map((ex, i) => {
            if (i === exerciseIndex) {
                return {
                    ...ex,
                    sets: ex.sets.filter((_, j) => j !== setIndex)
                };
            }
            return ex;
        });

        const updatedWorkout = { ...workoutData, exercises: newExercises };
        setWorkoutData(updatedWorkout);
        setActiveWorkout({ ...updatedWorkout, elapsedTime });
    };

    const toggleExerciseExpand = (exerciseId) => {
        setExpandedExercises(prev => ({
            ...prev,
            [exerciseId]: !prev[exerciseId]
        }));
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (!activeWorkout && (!initialWorkoutId || hasInitialized.current)) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6 animate-fade-in">
                <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(14,165,233,0.1)]">
                    <Dumbbell size={48} className="text-slate-600" />
                </div>
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2">{t('tracker.startWorkout')}</h2>
                    <p className="text-slate-400 text-lg max-w-md mx-auto">{t('tracker.selectRoutine')}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl mt-8">
                    {workouts.map(workout => (
                        <button
                            key={workout.id}
                            onClick={() => startWorkout(workout)}
                            className="group relative overflow-hidden p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-sky-500/50 transition-all duration-300 hover:shadow-[0_0_20px_rgba(14,165,233,0.15)] text-left"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="relative z-10">
                                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-sky-400 transition-colors">{workout.name}</h3>
                                <div className="flex items-center gap-4 text-sm text-slate-400">
                                    <span className="flex items-center gap-1.5">
                                        <Dumbbell size={14} />
                                        {workout.exercises.length} {t('tracker.exercises')}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Clock size={14} />
                                        {t('tracker.lastPerformed')}: {workout.lastPerformed ? new Date(workout.lastPerformed).toLocaleDateString() : t('tracker.never')}
                                    </span>
                                </div>
                            </div>
                        </button>
                    ))}

                    {workouts.length === 0 && (
                        <div className="col-span-full p-8 rounded-2xl bg-slate-900/30 border border-dashed border-slate-800 text-center">
                            <p className="text-slate-500 mb-2">{t('tracker.noRoutines')}</p>
                            <p className="text-sm text-slate-600">{t('tracker.goToPlanner')}</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (!workoutData) return <div className="flex items-center justify-center h-64 text-slate-500">{t('common.loading')}</div>;

    return (
        <div className="max-w-3xl mx-auto relative">
            <ConfirmModal
                isOpen={showCancelModal}
                onClose={() => setShowCancelModal(false)}
                onConfirm={() => {
                    setActiveWorkout(null);
                    setIsRunning(false);
                    releaseWakeLock();
                }}
                title={t('tracker.cancel')}
                message="Are you sure you want to cancel this workout? All progress will be lost."
                confirmText="Yes, Cancel"
                cancelText={t('tracker.cancel')}
                isDestructive={true}
            />

            <RestTimer
                isOpen={showRestTimer}
                onClose={handleCloseRestTimer}
                defaultDuration={restTimerDuration}
                nextExercise={nextExerciseName}
            />

            <PlateCalculator
                isOpen={showPlateCalculator}
                onClose={() => setShowPlateCalculator(false)}
                initialWeight={calculatorTargetWeight}
            />

            <>
                <div className="space-y-6 pb-24 animate-enter">
                    <header className="sticky top-0 z-20 -mx-6 -mt-6 px-6 py-4 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 shadow-2xl">
                        <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => onViewChange && onViewChange('dashboard')}
                                    className="p-2 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-colors"
                                >
                                    <ChevronLeft size={24} />
                                </button>
                                <div>
                                    <h2 className="text-xl font-black italic text-white tracking-tight">{workoutData.name}</h2>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1.5 text-electric-400 font-mono font-bold text-lg text-glow">
                                            <Clock size={16} className="animate-pulse-fast" />
                                            {formatTime(elapsedTime)}
                                        </div>
                                        <div className="h-4 w-px bg-white/10"></div>
                                        <Tooltip
                                            position="bottom"
                                            content={
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-electric-500 shadow-[0_0_8px_rgba(0,242,234,0.5)]"></div>
                                                        <span className="font-bold text-electric-400">NoSleep.js</span>
                                                        <span className="text-slate-500">- {t('tracker.simulated')} (Video Loop)</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                                        <span className="font-bold text-emerald-400">{t('tracker.native')}</span>
                                                        <span className="text-slate-500">- Browser API (Best)</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-slate-500"></div>
                                                        <span className="font-bold text-slate-400">{t('tracker.sleep')}</span>
                                                        <span className="text-slate-500">- System Default</span>
                                                    </div>
                                                </div>
                                            }
                                        >
                                            <button
                                                onClick={() => {
                                                    if (type === 'nosleep') {
                                                        releaseWakeLock();
                                                    } else {
                                                        requestWakeLock(true);
                                                    }
                                                }}
                                                className={clsx(
                                                    "flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border transition-all",
                                                    type === 'nosleep'
                                                        ? "bg-electric-500/10 text-electric-400 border-electric-500/20 shadow-[0_0_10px_rgba(0,242,234,0.2)]"
                                                        : type === 'native'
                                                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                                            : "bg-slate-800 text-slate-500 border-slate-700"
                                                )}
                                            >
                                                <Sun size={14} />
                                                <span>{type === 'nosleep' ? `${t('tracker.awake')} ⚡` : isLocked ? t('tracker.awake') : t('tracker.sleep')}</span>
                                            </button>
                                        </Tooltip>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 ml-auto sm:ml-0">
                                <button
                                    onClick={() => setShowCancelModal(true)}
                                    className="px-4 py-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20 transition-all flex items-center gap-2 font-bold text-sm uppercase tracking-wider"
                                >
                                    <X size={18} />
                                    <span>{t('tracker.cancel')}</span>
                                </button>
                                <button onClick={finishWorkout} className="btn btn-primary py-2 px-6 text-sm flex items-center gap-2">
                                    <Save size={18} /> <span className="uppercase tracking-wider font-bold">{t('tracker.finish')}</span>
                                </button>
                            </div>
                        </div>

                        {/* Duo Panel */}
                        <div className="mb-6">
                            <DuoPanel />
                        </div>

                        {/* Exercise List */}
                        <div className="space-y-4">
                            {workoutData.exercises.map((exercise, exerciseIndex) => {
                                const isSuperset = !!exercise.supersetId;
                                return (
                                    <div key={exercise.id} className={clsx(
                                        "glass-card p-4 rounded-2xl animate-fade-in relative transition-all",
                                        isSuperset && "border-l-4 border-l-indigo-500"
                                    )} style={{ animationDelay: `${exerciseIndex * 100}ms` }}>
                                        <div
                                            className="flex items-center justify-between mb-4 cursor-pointer"
                                            onClick={() => toggleExerciseExpand(exercise.id)}
                                        >
                                            <div className="flex items-center gap-2">
                                                {expandedExercises[exercise.id] ? <ChevronUp size={18} className="text-slate-500" /> : <ChevronDown size={18} className="text-slate-500" />}
                                                <div className="flex flex-col">
                                                    <div className="flex flex-wrap gap-2 mb-0.5">
                                                        {exercise.supersetId && (
                                                            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                                                                <Link size={10} /> {t('tracker.superset')}
                                                            </span>
                                                        )}
                                                        {exercise.isOptional && (
                                                            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider border border-amber-500/30 px-1.5 rounded">
                                                                {t('planner.optional') || 'Optional'}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h3 className="font-bold text-lg text-white flex items-center gap-2 flex-wrap">
                                                        {exercise.name}
                                                        {suggestions[exercise.id] && (
                                                            <span className="text-xs font-normal text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 whitespace-nowrap">
                                                                Suggest: {suggestions[exercise.id]}kg
                                                            </span>
                                                        )}
                                                    </h3>
                                                </div>
                                                <div onClick={(e) => e.stopPropagation()}>
                                                    <Tooltip
                                                        position="right"
                                                        content={(() => {
                                                            const exData = exercisesData.find(e => e.id === exercise.originalId || e.name === exercise.name);
                                                            const hasCustomDesc = exercise.description && exercise.description.trim().length > 0;

                                                            if (!exData && !hasCustomDesc) return <span className="text-slate-400">No details available</span>;

                                                            return (
                                                                <div className="space-y-2 max-w-xs">
                                                                    {exData && (
                                                                        <div className="flex flex-wrap gap-1">
                                                                            {(exData.primaryMuscles || []).map(m => (
                                                                                <span key={m} className="text-[10px] bg-sky-500/20 text-sky-400 px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">
                                                                                    {m}
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    )}

                                                                    {hasCustomDesc ? (
                                                                        <div className="text-slate-300 text-xs border-l-2 border-sky-500/50 pl-2 italic">
                                                                            {exercise.description}
                                                                        </div>
                                                                    ) : (
                                                                        exData && exData.instructions && (
                                                                            <ul className="list-disc list-inside text-slate-300 space-y-1">
                                                                                {exData.instructions.slice(0, 3).map((inst, i) => (
                                                                                    <li key={i}>{inst}</li>
                                                                                ))}
                                                                            </ul>
                                                                        )
                                                                    )}

                                                                    {exercise.link && (
                                                                        <a
                                                                            href={exercise.link}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="flex items-center gap-2 text-xs text-sky-400 hover:text-sky-300 font-medium pt-2 border-t border-white/10"
                                                                        >
                                                                            <ExternalLink size={12} />
                                                                            {t('tracker.viewGuide') || 'View Guide'}
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            );
                                                        })()}
                                                    >
                                                        <div className="p-1 text-slate-500 hover:text-sky-400 transition-colors">
                                                            <Info size={16} />
                                                        </div>
                                                    </Tooltip>
                                                </div>
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); addSet(exerciseIndex); }}
                                                className="p-2 hover:bg-white/10 rounded-lg text-sky-400 transition-colors"
                                            >
                                                <Plus size={18} />
                                            </button>
                                        </div>

                                        {(!expandedExercises[exercise.id]) && (
                                            <div className="space-y-3">
                                                <div className="grid grid-cols-12 gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-2">
                                                    <div className="col-span-2 text-center flex items-center justify-center">Set</div>
                                                    <div className="col-span-4 text-center">kg</div>
                                                    <div className="col-span-3 text-center">Reps</div>
                                                    <div className="col-span-3 text-center">Done</div>
                                                </div>

                                                {exercise.sets.map((set, setIndex) => (
                                                    <div key={set.id} className={clsx(
                                                        "grid grid-cols-12 gap-2 items-center p-3 rounded-xl transition-all",
                                                        set.completed ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-slate-900/50 border border-slate-800"
                                                    )}>
                                                        <div className="col-span-2 text-center font-mono text-slate-400 font-bold text-lg">{setIndex + 1}</div>
                                                        <div className="col-span-4 relative">
                                                            <input
                                                                type="text"
                                                                inputMode="decimal"
                                                                value={set.weight}
                                                                onChange={(e) => updateSet(exerciseIndex, setIndex, 'weight', e.target.value)}
                                                                className="w-full bg-slate-950/50 rounded-lg py-3 text-center font-bold text-white text-lg focus:outline-none focus:ring-2 focus:ring-sky-500/50 border border-transparent focus:border-sky-500 transition-all"
                                                                placeholder="0"
                                                            />
                                                            <button
                                                                onClick={() => {
                                                                    setCalculatorTargetWeight(set.weight);
                                                                    setShowPlateCalculator(true);
                                                                }}
                                                                className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-600 hover:text-indigo-400 transition-colors p-2"
                                                                title="Plate Calculator"
                                                            >
                                                                <Calculator size={14} />
                                                            </button>
                                                        </div>
                                                        <div className="col-span-3">
                                                            <input
                                                                type="text"
                                                                inputMode="decimal"
                                                                value={set.reps}
                                                                onChange={(e) => updateSet(exerciseIndex, setIndex, 'reps', e.target.value)}
                                                                className="w-full bg-slate-950/50 rounded-lg py-3 text-center font-bold text-white text-lg focus:outline-none focus:ring-2 focus:ring-sky-500/50 border border-transparent focus:border-sky-500 transition-all"
                                                                placeholder="0"
                                                            />
                                                        </div>
                                                        <div className="col-span-3 flex justify-center gap-2">
                                                            <button
                                                                onClick={() => toggleSetComplete(exerciseIndex, setIndex)}
                                                                className={clsx(
                                                                    "w-12 h-12 rounded-xl flex items-center justify-center transition-all active:scale-95",
                                                                    set.completed ? "bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]" : "bg-slate-800 text-slate-500 hover:bg-slate-700 hover:text-white"
                                                                )}
                                                            >
                                                                <Clock size={20} />
                                                            </button>
                                                            {!set.completed && (
                                                                <button
                                                                    onClick={() => removeSet(exerciseIndex, setIndex)}
                                                                    className="absolute -right-2 -top-2 w-6 h-6 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                                >
                                                                    <Trash2 size={12} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </header>
                </div>
            </>
        </div >
    );
};

export default Tracker;
