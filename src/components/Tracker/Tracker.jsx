import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Save, Plus, Trash2, ChevronDown, ChevronUp, Clock, Dumbbell, X, Sun, Info, ExternalLink, ChevronLeft, Link, Check, MoreVertical, ChevronRight, Users } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import useWakeLock from '../../hooks/useWakeLock';
import clsx from 'clsx';
import Tooltip from '../common/Tooltip';
import ConfirmModal from '../common/ConfirmModal';
import RestTimer from './RestTimer';
import ExerciseSelector from '../Planner/ExerciseSelector';

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
    const [nextExerciseName, setNextExerciseName] = useState(null);
    const [suggestions, setSuggestions] = useState({});
    const [hasInitialized, setHasInitialized] = useState(false);
    const [showActions, setShowActions] = useState(false);
    const [showSelector, setShowSelector] = useState(false);
    const [showDuo, setShowDuo] = useState(false);

    // Wake Lock
    const { isLocked, request: requestWakeLock, release: releaseWakeLock, type } = useWakeLock();

    const startWorkout = useCallback((template) => {
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
                        id: `${exerciseId}-set-${j}`,
                        weight: ex.weight || '',
                        reps: '',
                        completed: false
                    }))
                };
            })
        };
        setWorkoutData(newWorkout);
        setIsRunning(true);
        requestWakeLock();
    }, [t, requestWakeLock]);

    useEffect(() => {
        if (workoutData) {
            setActiveWorkout(prev => ({
                ...prev,
                ...workoutData,
                elapsedTime
            }));
        }
    }, [workoutData, elapsedTime, setActiveWorkout]);

    useEffect(() => {
        let interval;
        if (isRunning) {
            interval = setInterval(() => {
                setElapsedTime(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isRunning]);

    useEffect(() => {
        if (activeWorkout) {
            if (!workoutData) {
                setWorkoutData(activeWorkout);
                setElapsedTime(activeWorkout.elapsedTime || 0);
            }
            setIsRunning(true);
            requestWakeLock();
            setHasInitialized(true);
        } else if (initialWorkoutId && !hasInitialized) {
            const template = workouts.find(w => w.id === initialWorkoutId);
            if (template) {
                startWorkout(template);
                setHasInitialized(true);
            }
        }
    }, [initialWorkoutId, activeWorkout, workouts, requestWakeLock, startWorkout, workoutData, hasInitialized]);

    useEffect(() => {
        return () => releaseWakeLock();
    }, [releaseWakeLock]);

    const hasCalculatedSuggestions = useRef(false);

    useEffect(() => {
        if (workoutData && history && !hasCalculatedSuggestions.current) {
            const newSuggestions = {};
            workoutData.exercises.forEach(ex => {
                const suggestion = getSuggestedWeight(ex.name, history);
                if (suggestion) {
                    newSuggestions[ex.id] = suggestion;
                }
            });
            hasCalculatedSuggestions.current = true;
            if (Object.keys(newSuggestions).length > 0) {
                setSuggestions(newSuggestions);
            }
        }
    }, [workoutData, history]);

    const finishWorkout = () => {
        if (!workoutData) return;
        const completedWorkout = {
            ...workoutData,
            workoutId: workoutData.id,
            name: workoutData.name || t('tracker.unknownWorkout'),
            endTime: new Date().toISOString(),
            duration: elapsedTime,
            exercises: workoutData.exercises.map(ex => ({
                ...ex,
                sets: ex.sets.filter(s => s.completed)
            })).filter(ex => ex.sets.length > 0)
        };
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
                        if (j === setIndex) return { ...s, completed: !s.completed };
                        return s;
                    })
                };
            }
            return ex;
        });
        const updatedWorkout = { ...workoutData, exercises: newExercises };
        setWorkoutData(updatedWorkout);
        setActiveWorkout({ ...updatedWorkout, elapsedTime });

        const isCompleted = newExercises[exerciseIndex].sets[setIndex].completed;
        if (isCompleted) {
            const exercise = newExercises[exerciseIndex];
            setRestTimerDuration(parseInt(exercise.restTime) || 90);
            broadcastUpdate({
                exerciseName: exercise.name,
                setNumber: setIndex + 1,
                reps: exercise.sets[setIndex].reps,
                weight: exercise.sets[setIndex].weight
            });
            const isLastSet = setIndex === exercise.sets.length - 1;
            setNextExerciseName(isLastSet ? newExercises[exerciseIndex + 1]?.name : null);
            setShowRestTimer(true);
        }
    };

    const handleCloseRestTimer = useCallback(() => setShowRestTimer(false), []);

    const updateSet = (exerciseIndex, setIndex, field, value) => {
        if (!workoutData) return;
        const newExercises = workoutData.exercises.map((ex, i) => {
            if (i === exerciseIndex) {
                return {
                    ...ex,
                    sets: ex.sets.map((s, j) => {
                        if (j === setIndex) {
                            if (typeof field === 'object') return { ...s, ...field };
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
                const prev = ex.sets[ex.sets.length - 1];
                return {
                    ...ex,
                    sets: [...ex.sets, { id: Date.now(), weight: prev?.weight || '', reps: prev?.reps || '', completed: false }]
                };
            }
            return ex;
        });
        const updatedWorkout = { ...workoutData, exercises: newExercises };
        setWorkoutData(updatedWorkout);
        setActiveWorkout({ ...updatedWorkout, elapsedTime });
    };

    const removeSet = (exerciseIndex, setIndex) => {
        if (!workoutData) return;
        const newExercises = workoutData.exercises.map((ex, i) => {
            if (i === exerciseIndex) return { ...ex, sets: ex.sets.filter((_, j) => j !== setIndex) };
            return ex;
        });
        const updatedWorkout = { ...workoutData, exercises: newExercises };
        setWorkoutData(updatedWorkout);
        setActiveWorkout({ ...updatedWorkout, elapsedTime });
    };

    const toggleExerciseExpand = (id) => setExpandedExercises(prev => ({ ...prev, [id]: !prev[id] }));

    const handleAddExerciseFromSelector = (exercise) => {
        if (!workoutData) return;
        const newEx = {
            id: `ex-${Date.now()}`,
            name: exercise.name,
            originalId: exercise.id,
            sets: Array.from({ length: 3 }).map((_, j) => ({ id: `set-${Date.now()}-${j}`, weight: '', reps: '', completed: false }))
        };
        const updated = { ...workoutData, exercises: [...workoutData.exercises, newEx] };
        setWorkoutData(updated);
        setActiveWorkout({ ...updated, elapsedTime });
        setShowSelector(false);
    };

    const formatTime = (s) => {
        const m = Math.floor(s / 60);
        return `${m}:${(s % 60).toString().padStart(2, '0')}`;
    };

    const totalSets = workoutData?.exercises.reduce((acc, ex) => acc + ex.sets.length, 0) || 0;
    const completedSetsCount = workoutData?.exercises.reduce((acc, ex) => acc + ex.sets.filter(s => s.completed).length, 0) || 0;
    const progressPercentage = totalSets > 0 ? (completedSetsCount / totalSets) * 100 : 0;

    if (!activeWorkout && (!initialWorkoutId || hasInitialized)) {
        return (
            <div className="flex flex-col items-center justify-center pt-8 pb-24 text-center space-y-6 animate-fade-in px-4">
                <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(14,165,233,0.1)]">
                    <Dumbbell size={48} className="text-slate-600" />
                </div>
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2">{t('tracker.startWorkout')}</h2>
                    <p className="text-slate-400 text-lg max-w-md mx-auto">{t('tracker.selectRoutine')}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl mt-8">
                    {workouts.map(w => (
                        <button key={w.id} onClick={() => startWorkout(w)} className="group relative overflow-hidden p-6 rounded-3xl bg-slate-900/40 border border-white/5 hover:border-sky-500/50 transition-all duration-500 hover:shadow-[0_0_30px_rgba(14,165,233,0.1)] text-left flex flex-col justify-between">
                            <div>
                                <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mb-4 group-hover:bg-sky-500 group-hover:text-white transition-all duration-500"><Play size={24} className="fill-current ml-1" /></div>
                                <h3 className="text-xl font-black italic text-white mb-2 group-hover:text-sky-400 transition-colors uppercase tracking-tight">{w.name}</h3>
                                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><Dumbbell size={14} /> {w.exercises.length} {t('tracker.exercises')}</div>
                            </div>
                            <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-[10px] font-bold text-slate-600 uppercase">
                                <span>{t('tracker.lastPerformed')}: {w.lastPerformed ? new Date(w.lastPerformed).toLocaleDateString() : t('tracker.never')}</span>
                                <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center group-hover:border-sky-500 group-hover:text-sky-400"><ChevronRight size={16} /></div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    if (!workoutData) return <div className="flex items-center justify-center h-64 text-slate-500">{t('common.loading')}</div>;

    return (
        <div className="max-w-3xl mx-auto relative">
            <ConfirmModal isOpen={showCancelModal} onClose={() => setShowCancelModal(false)} onConfirm={() => { setActiveWorkout(null); setIsRunning(false); releaseWakeLock(); }} title={t('tracker.cancel')} message="Are you sure you want to cancel? Progress will be lost." confirmText="Yes, Cancel" cancelText={t('tracker.cancel')} isDestructive={true} />
            <RestTimer isOpen={showRestTimer} onClose={handleCloseRestTimer} defaultDuration={restTimerDuration} nextExercise={nextExerciseName} />
            {showSelector && <ExerciseSelector onSelect={handleAddExerciseFromSelector} onClose={() => setShowSelector(false)} />}

            <div className="space-y-6 pb-32 animate-enter">
                <header className="sticky top-0 z-30 -mx-4 md:-mx-6 -mt-4 md:-mt-6 bg-slate-950/95 backdrop-blur-xl border-b border-white/5 shadow-2xl">
                    <div className="h-1 w-full bg-white/5">
                        <div className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all duration-500" style={{ width: `${progressPercentage}%` }} />
                    </div>
                    <div className="px-4 md:px-6 py-3 md:py-4 flex justify-between items-center gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                            <button onClick={() => onViewChange?.('dashboard')} className="p-2 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-colors shrink-0 active:scale-95"><ChevronLeft size={24} /></button>
                            <div className="min-w-0">
                                <h2 className="text-base md:text-xl font-black italic text-white tracking-tight truncate leading-tight">{workoutData.name}</h2>
                                <div className="flex items-center gap-2 text-electric-400 font-mono font-bold text-sm md:text-base"><Clock size={12} className="animate-pulse-fast" />{formatTime(elapsedTime)}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setShowDuo(!showDuo)} className={clsx("p-2 rounded-xl border transition-all active:scale-90", showDuo ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]" : "bg-slate-800 border-white/5 text-slate-400 hover:text-white")}><Users size={18} /></button>
                            <Tooltip position="bottom" content={<div className="space-y-2 p-1 text-xs">
                                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-electric-500" /><span>NoSleep.js (Video Loop)</span></div>
                                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500" /><span>Native API (Best)</span></div>
                                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-slate-500" /><span>System Default</span></div>
                            </div>}>
                                <button onClick={() => { if (type === 'nosleep') releaseWakeLock(); else requestWakeLock(true); }} className={clsx("p-2 rounded-xl border transition-all", type === 'nosleep' ? "bg-electric-500/10 text-electric-400 border-electric-500/20" : type === 'native' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-slate-800 text-slate-500 border-slate-700")}><Sun size={18} /></button>
                            </Tooltip>
                            <div className="relative">
                                <button onClick={() => setShowActions(!showActions)} className="p-2 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-colors border border-white/5"><MoreVertical size={24} /></button>
                                {showActions && <><div className="fixed inset-0 z-[90]" onClick={() => setShowActions(false)} /><div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-[100] p-2 animate-scale-in origin-top-right">
                                    <button onClick={() => { setShowActions(false); setShowCancelModal(true); }} className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors text-sm font-bold uppercase tracking-wider"><X size={18} />{t('tracker.cancel')}</button>
                                </div></>}
                            </div>
                        </div>
                    </div>
                </header>

                {showDuo && <div className="px-4 animate-slide-down"><DuoPanel /></div>}

                <div className="space-y-4 px-4">
                    {workoutData.exercises.map((ex, exIdx) => {
                        const isCompleted = ex.sets.length > 0 && ex.sets.every(s => s.completed);
                        return (
                            <div key={ex.id} className={clsx("rounded-3xl animate-fade-in relative transition-all overflow-hidden", isCompleted ? "bg-emerald-500/5 border border-emerald-500/20" : "bg-slate-900/40 border border-white/5 shadow-xl")}>
                                <div className={clsx("p-4 flex items-center justify-between cursor-pointer transition-colors", isCompleted ? "bg-emerald-500/10" : "bg-white/5 hover:bg-white/10")} onClick={() => toggleExerciseExpand(ex.id)}>
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg", isCompleted ? "bg-emerald-500 text-white" : "bg-slate-800 text-sky-400")}><Dumbbell size={20} /></div>
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap gap-2 mb-0.5">
                                                {ex.supersetId && <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20 flex items-center gap-1"><Link size={8} /> {t('tracker.superset')}</span>}
                                                {ex.isOptional && <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">{t('planner.optional')}</span>}
                                            </div>
                                            <h3 className="font-bold text-base text-white leading-tight truncate">{ex.name}</h3>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0 ml-2" onClick={e => e.stopPropagation()}>
                                        <button onClick={() => addSet(exIdx)} className="p-2 hover:bg-sky-500/20 rounded-lg text-sky-400 transition-colors active:scale-90"><Plus size={20} /></button>
                                        <div className="w-px h-4 bg-white/10 mx-1" />
                                        {expandedExercises[ex.id] ? <ChevronUp size={20} className="text-slate-500" /> : <ChevronDown size={20} className="text-slate-500" />}
                                    </div>
                                </div>

                                {!expandedExercises[ex.id] && (
                                    <div className="p-4 space-y-4">
                                        <div className="flex items-center justify-between gap-4">
                                            <Tooltip position="right" content={<div className="space-y-2 max-w-xs p-1">
                                                {ex.description && <div className="text-slate-300 text-xs border-l-2 border-sky-500/50 pl-2 italic">{ex.description}</div>}
                                                {ex.link && <a href={ex.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-sky-400 hover:text-sky-300 font-medium pt-2 border-t border-white/10"><ExternalLink size={12} />{t('tracker.viewGuide')}</a>}
                                            </div>}>
                                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-sky-400 transition-colors cursor-help"><Info size={14} /><span>{t('tracker.viewGuide')}</span></div>
                                            </Tooltip>
                                            {suggestions[ex.id] && !isCompleted && <div className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20 uppercase tracking-widest">Target: {suggestions[ex.id]}kg</div>}
                                        </div>

                                        <div className="space-y-3">
                                            {ex.sets.map((set, setIdx) => {
                                                const adjustWeight = (delta) => { if (navigator.vibrate) navigator.vibrate(10); updateSet(exIdx, setIdx, 'weight', Math.max(0, (parseFloat(set.weight) || 0) + delta).toString()); };
                                                const adjustReps = (delta) => { if (navigator.vibrate) navigator.vibrate(10); updateSet(exIdx, setIdx, 'reps', Math.max(0, (parseInt(set.reps) || 0) + delta).toString()); };
                                                return (
                                                    <div key={set.id} className={clsx("p-3 rounded-2xl transition-all group relative scroll-mt-24", set.completed ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-slate-900/50 border border-slate-800")}>
                                                        <div className="flex items-stretch gap-3">
                                                            <div className="w-12 flex flex-col items-center justify-center shrink-0 border-r border-slate-800/50 pr-1">
                                                                <span className="font-mono text-slate-400 font-black text-xl leading-none">{setIdx + 1}</span>
                                                                {setIdx > 0 && <button onClick={() => { updateSet(exIdx, setIdx, { weight: ex.sets[setIdx - 1].weight, reps: ex.sets[setIdx - 1].reps }); if (navigator.vibrate) navigator.vibrate(10); }} className="text-[10px] font-black text-sky-500 hover:text-white uppercase tracking-wider mt-2 py-1 px-1 bg-sky-500/5 rounded-md active:scale-95 transition-all select-none">COPY</button>}
                                                            </div>
                                                            <div className="flex-1 min-w-0 flex flex-col gap-3">
                                                                <div className="flex flex-col gap-1">
                                                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">{ex.category === 'cardio' ? t('tracker.distance') || 'Distance' : 'Weight (kg)'}</span>
                                                                    <div className="flex items-center bg-slate-950/50 rounded-xl border border-slate-800 focus-within:border-sky-500/50 transition-all p-1">
                                                                        <button onClick={() => adjustWeight(-2.5)} className="w-12 h-12 rounded-lg bg-slate-800 text-slate-400 hover:text-white active:bg-sky-500 active:text-white flex items-center justify-center font-bold text-xl transition-all active:scale-95 shrink-0 select-none">−</button>
                                                                        <input type="text" inputMode="decimal" autoComplete="off" autoCorrect="off" value={set.weight} onFocus={e => e.target.select()} onChange={e => updateSet(exIdx, setIdx, 'weight', e.target.value)} className="flex-1 min-w-0 bg-transparent py-2 px-1 text-center font-black text-white text-xl focus:outline-none transition-all" placeholder="0" />
                                                                        <button onClick={() => adjustWeight(2.5)} className="w-12 h-12 rounded-lg bg-slate-800 text-slate-400 hover:text-white active:bg-sky-500 active:text-white flex items-center justify-center font-bold text-xl transition-all active:scale-95 shrink-0 select-none">+</button>
                                                                    </div>
                                                                </div>
                                                                <div className="flex flex-col gap-1">
                                                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">{ex.category === 'cardio' ? t('tracker.time') || 'Time' : `Reps (Target: ${ex.reps || '0'})`}</span>
                                                                    <div className="flex items-center bg-slate-950/50 rounded-xl border border-slate-800 focus-within:border-sky-500/50 transition-all p-1">
                                                                        <button onClick={() => adjustReps(-1)} className="w-12 h-12 rounded-lg bg-slate-800 text-slate-400 hover:text-white active:bg-sky-500 active:text-white flex items-center justify-center font-bold text-xl transition-all active:scale-95 shrink-0 select-none">−</button>
                                                                        <input type="text" inputMode="decimal" autoComplete="off" autoCorrect="off" value={set.reps} onFocus={e => e.target.select()} onChange={e => updateSet(exIdx, setIdx, 'reps', e.target.value)} className="flex-1 min-w-0 bg-transparent py-2 px-1 text-center font-black text-white text-xl focus:outline-none transition-all" placeholder={ex.reps || "0"} />
                                                                        <button onClick={() => adjustReps(1)} className="w-12 h-12 rounded-lg bg-slate-800 text-slate-400 hover:text-white active:bg-sky-500 active:text-white flex items-center justify-center font-bold text-xl transition-all active:scale-95 shrink-0 select-none">+</button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <button onClick={() => { if (navigator.vibrate) navigator.vibrate(set.completed ? 10 : [10, 50, 20]); toggleSetComplete(exIdx, setIdx); }} className={clsx("w-16 rounded-2xl flex items-center justify-center transition-all active:scale-95 shrink-0", set.completed ? "bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.5)]" : "bg-slate-800 text-slate-400 hover:bg-sky-500 hover:text-white border-2 border-dashed border-slate-700 hover:border-sky-500")}><Check size={32} strokeWidth={3} /></button>
                                                        </div>
                                                        {!set.completed && <button onClick={() => removeSet(exIdx, setIdx)} className="absolute -right-2 -top-2 w-8 h-8 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all active:scale-95 z-10"><Trash2 size={16} /></button>}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-950/80 backdrop-blur-xl border-t border-white/5 z-40 md:static md:bg-transparent md:border-0 md:p-0">
                    <div className="max-w-3xl mx-auto flex gap-3">
                        <button onClick={() => setShowSelector(true)} className="flex-1 py-4 rounded-2xl bg-slate-900 border border-slate-800 text-white font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-95"><Plus size={20} />{t('planner.addExercise')}</button>
                        <button onClick={finishWorkout} className="flex-[1.5] py-4 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 transition-all active:scale-95"><Save size={20} />{t('tracker.finish')}</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Tracker;