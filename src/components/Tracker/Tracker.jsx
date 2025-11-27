import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { Play, Pause, RotateCcw, CheckCircle2, ChevronRight, ChevronLeft, Timer, SkipForward, Plus, Minus, Info, ExternalLink, X, Clock, ArrowLeft, Save, Sun, HelpCircle } from 'lucide-react';
import Portal from '../common/Portal';
import clsx from 'clsx';
import useWakeLock from '../../hooks/useWakeLock';

const Tracker = ({ initialWorkoutId }) => {
    const { workouts, logSession, history } = useStore();
    const [activeWorkout, setActiveWorkout] = useState(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [completedSets, setCompletedSets] = useState({});
    const [setWeights, setSetWeights] = useState({});
    const [setReps, setSetReps] = useState({}); // New state for reps input
    const [restTimer, setRestTimer] = useState({ active: false, time: 90 });
    const [activeInfo, setActiveInfo] = useState(null);

    // Auto-start effect
    useEffect(() => {
        if (initialWorkoutId && !activeWorkout && workouts.length > 0) {
            const workoutToStart = workouts.find(w => w.id === initialWorkoutId);
            if (workoutToStart) {
                setActiveWorkout(workoutToStart);
            }
        }
    }, [initialWorkoutId, workouts]);

    // Sync active workout with store updates (e.g. if edited in Planner)
    useEffect(() => {
        if (activeWorkout && workouts.length > 0) {
            const latestVersion = workouts.find(w => w.id === activeWorkout.id);
            if (latestVersion) {
                // Check if exercises or name have changed to avoid unnecessary updates
                // We use JSON.stringify for a quick deep comparison of exercises
                if (activeWorkout.name !== latestVersion.name ||
                    JSON.stringify(activeWorkout.exercises) !== JSON.stringify(latestVersion.exercises)) {

                    console.log("Syncing active workout with latest version from store");
                    setActiveWorkout(prev => ({
                        ...prev,
                        name: latestVersion.name,
                        exercises: latestVersion.exercises
                    }));
                }
            }
        }
    }, [activeWorkout, workouts]);

    // Persistence: Restore state on mount
    useEffect(() => {
        const savedState = localStorage.getItem('duogym-active-workout');
        if (savedState) {
            try {
                const parsed = JSON.parse(savedState);
                // Only restore if we're not trying to start a specific new workout, OR if the saved workout matches the requested one
                if (!initialWorkoutId || parsed.activeWorkout.id === initialWorkoutId) {
                    setActiveWorkout(parsed.activeWorkout);
                    setElapsedTime(parsed.elapsedTime);
                    setCompletedSets(parsed.completedSets);
                    setSetWeights(parsed.setWeights);
                    setSetReps(parsed.setReps);
                    setRestTimer(parsed.restTimer);
                }
            } catch (e) {
                console.error("Failed to restore workout state", e);
                localStorage.removeItem('duogym-active-workout');
            }
        }
    }, [initialWorkoutId]);

    // Persistence: Save state on change
    useEffect(() => {
        if (activeWorkout) {
            const stateToSave = {
                activeWorkout,
                elapsedTime,
                completedSets,
                setWeights,
                setReps,
                restTimer
            };
            localStorage.setItem('duogym-active-workout', JSON.stringify(stateToSave));
        } else {
            // If activeWorkout becomes null (finished/cancelled), clear storage
            // This is handled in finishWorkout/cancelWorkout, but good as a fallback if we can distinguish "unmounting" from "clearing"
            // Actually, we shouldn't clear here on unmount, only on explicit finish/cancel.
            // So we'll leave this effect to ONLY save when activeWorkout exists.
        }
    }, [activeWorkout, elapsedTime, completedSets, setWeights, setReps, restTimer]);

    // Find previous session for this workout
    const previousSession = React.useMemo(() => {
        if (!activeWorkout || !history) return null;
        return history
            .filter(h => h.workoutId === activeWorkout.id)
            .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    }, [activeWorkout, history]);

    useEffect(() => {
        let interval;
        if (activeWorkout) {
            interval = setInterval(() => {
                setElapsedTime(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [activeWorkout]);

    useEffect(() => {
        let interval;
        if (restTimer.active && restTimer.time > 0) {
            interval = setInterval(() => {
                setRestTimer(prev => ({ ...prev, time: prev.time - 1 }));
            }, 1000);
        } else if (restTimer.time === 0) {
            setRestTimer(prev => ({ ...prev, active: false }));
        }
        return () => clearInterval(interval);
    }, [restTimer.active, restTimer.time]);

    // Screen Wake Lock
    const { isLocked, type, request: requestWakeLock, release: releaseWakeLock } = useWakeLock();

    useEffect(() => {
        if (activeWorkout) {
            if (!isLocked) requestWakeLock();
        } else {
            if (isLocked) releaseWakeLock();
        }
    }, [activeWorkout, isLocked, requestWakeLock, releaseWakeLock]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleWeightChange = (exerciseId, setIndex, value) => {
        setSetWeights(prev => ({ ...prev, [`${exerciseId}-${setIndex}`]: value }));
    };

    const handleRepsChange = (exerciseId, setIndex, value) => {
        setSetReps(prev => ({ ...prev, [`${exerciseId}-${setIndex}`]: value }));
    };

    const toggleSet = (exerciseId, setIndex) => {
        const key = `${exerciseId}-${setIndex}`;
        if (completedSets[key]?.completed) return; // Prevent undoing

        const exercise = activeWorkout.exercises.find(e => e.id === exerciseId);
        const weight = setWeights[key] !== undefined ? setWeights[key] : (exercise?.weight || '');
        const reps = setReps[key] !== undefined ? setReps[key] : (exercise?.reps || '');

        setCompletedSets(prev => ({
            ...prev,
            [key]: { completed: true, weight, reps }
        }));

        const restDuration = exercise?.restTime ? parseInt(exercise.restTime) : 90;
        setRestTimer({ active: true, time: restDuration });
    };

    const adjustRestTime = (seconds) => {
        setRestTimer(prev => ({ ...prev, time: Math.max(0, prev.time + seconds) }));
    };

    const skipRest = () => {
        setRestTimer(prev => ({ ...prev, active: false }));
    };

    const finishWorkout = () => {
        // Merge completed sets with latest weight values
        const finalSets = {};
        Object.keys(completedSets).forEach(key => {
            if (completedSets[key]?.completed) {
                finalSets[key] = {
                    completed: true,
                    weight: setWeights[key] !== undefined ? setWeights[key] : completedSets[key].weight,
                    reps: setReps[key] !== undefined ? setReps[key] : completedSets[key].reps
                };
            }
        });

        logSession({
            workoutId: activeWorkout.id,
            workoutName: activeWorkout.name,
            duration: elapsedTime,
            completedSets: Object.keys(finalSets).length,
            totalSets: activeWorkout.exercises.reduce((acc, ex) => acc + parseInt(ex.sets), 0),
            detailedSets: finalSets,
            exercises: activeWorkout.exercises.map(e => ({ id: e.id, name: e.name })) // Snapshot for analytics
        });
        setActiveWorkout(null);
        setElapsedTime(0);
        setCompletedSets({});
        setSetWeights({});
        localStorage.removeItem('duogym-active-workout'); // Clear saved state
    };

    const cancelWorkout = () => {
        if (window.confirm("Are you sure you want to cancel this workout? All progress will be lost.")) {
            setActiveWorkout(null);
            setElapsedTime(0);
            setCompletedSets({});
            setSetWeights({});
            setSetReps({});
            setRestTimer({ active: false, time: 90 });
            localStorage.removeItem('duogym-active-workout');
        }
    };

    const skipExercise = (exerciseId) => {
        const exercise = activeWorkout.exercises.find(e => e.id === exerciseId);
        if (!exercise) return;

        const newCompletedSets = { ...completedSets };
        const newSetWeights = { ...setWeights };

        for (let i = 0; i < parseInt(exercise.sets); i++) {
            const key = `${exerciseId}-${i}`;
            newCompletedSets[key] = { completed: true, weight: 'Skipped' };
            newSetWeights[key] = '0';
        }

        setCompletedSets(newCompletedSets);
        setSetWeights(newSetWeights);
    };

    if (activeWorkout) {
        return (
            <>
                <div className="space-y-6 pb-24 animate-enter">
                    <header className="sticky top-0 z-20 -mx-6 -mt-6 px-6 py-4 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setActiveWorkout(null)}
                                    className="p-2 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-colors"
                                >
                                    <ArrowLeft size={20} />
                                </button>
                                <div>
                                    <h2 className="text-xl font-black italic text-white tracking-tight">{activeWorkout.name}</h2>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1.5 text-electric-400 font-mono font-bold text-lg text-glow">
                                            <Clock size={16} className="animate-pulse-fast" />
                                            {formatTime(elapsedTime)}
                                        </div>
                                        <div className="h-4 w-px bg-white/10"></div>
                                        <button
                                            onClick={() => {
                                                if (type === 'nosleep') {
                                                    releaseWakeLock();
                                                } else {
                                                    requestWakeLock(true);
                                                }
                                            }}
                                            className={clsx(
                                                "flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border transition-all",
                                                type === 'nosleep'
                                                    ? "bg-electric-500/10 text-electric-400 border-electric-500/20 shadow-[0_0_10px_rgba(0,242,234,0.2)]"
                                                    : type === 'native'
                                                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                                        : "bg-slate-800 text-slate-500 border-slate-700"
                                            )}
                                        >
                                            <Sun size={10} />
                                            <span>{type === 'nosleep' ? "Awake ⚡" : isLocked ? "Awake" : "Sleep"}</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={cancelWorkout}
                                    className="p-3 text-red-400 hover:text-white hover:bg-red-500/20 rounded-xl transition-colors"
                                >
                                    <X size={20} />
                                </button>
                                <button onClick={finishWorkout} className="btn btn-primary py-2 px-6 text-sm flex items-center gap-2">
                                    <Save size={18} /> <span className="uppercase tracking-wider font-bold">Finish</span>
                                </button>
                            </div>
                        </div>
                    </header>

                    <div className="space-y-4">
                        {activeWorkout.exercises && activeWorkout.exercises.map((ex) => (
                            <div key={ex.id} className="glass-panel rounded-2xl p-5 relative overflow-hidden group transition-all duration-300 hover:border-white/10">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <h3 className="text-6xl font-black italic text-white select-none">{ex.name.charAt(0)}</h3>
                                </div>

                                <div className="flex justify-between items-start mb-6 relative z-10">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-lg font-bold text-white">{ex.name}</h3>
                                            {(ex.description || ex.link) && (
                                                <button
                                                    onClick={() => setActiveInfo(ex)}
                                                    className="text-slate-500 hover:text-electric-400 transition-colors"
                                                >
                                                    <Info size={16} />
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {ex.isOptional && (
                                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                                    Optional
                                                </span>
                                            )}
                                            <span className="text-slate-400 text-xs font-mono bg-slate-950/50 px-2 py-0.5 rounded border border-white/5">Target: {ex.weight}</span>
                                        </div>
                                    </div>
                                </div>

                                {ex.isOptional && !Array.from({ length: parseInt(ex.sets) }).every((_, i) => completedSets[`${ex.id}-${i}`]?.completed) && (
                                    <button
                                        onClick={() => skipExercise(ex.id)}
                                        className="w-full mb-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-white bg-slate-950/30 hover:bg-slate-800 rounded-lg transition-colors border border-dashed border-slate-800 hover:border-slate-600"
                                    >
                                        Skip Exercise
                                    </button>
                                )}

                                <div className="space-y-2 relative z-10">
                                    {Array.from({ length: parseInt(ex.sets) }).map((_, i) => {
                                        const key = `${ex.id}-${i}`;
                                        const isCompleted = completedSets[key]?.completed;
                                        const currentWeight = setWeights[key] !== undefined ? setWeights[key] : (ex.weight || '');

                                        // Get previous stats for this specific set
                                        const prevSet = previousSession?.detailedSets?.[key];
                                        const prevStats = prevSet ? `${prevSet.weight}kg × ${prevSet.reps || ex.reps}` : null;

                                        return (
                                            <div
                                                key={i}
                                                className={clsx(
                                                    "flex items-center justify-between p-3 rounded-xl border transition-all duration-300",
                                                    isCompleted
                                                        ? "bg-acid-500/5 border-acid-500/20 shadow-[0_0_15px_rgba(204,255,0,0.05)]"
                                                        : "bg-slate-950/30 border-white/5 hover:border-white/10"
                                                )}
                                            >
                                                <div className="flex flex-col">
                                                    <span className={clsx(
                                                        "font-mono text-sm font-bold",
                                                        isCompleted ? "text-acid-500" : "text-slate-400"
                                                    )}>Set {i + 1}</span>
                                                    {prevStats && (
                                                        <span className="text-[10px] text-slate-600 font-mono">Last: {prevStats}</span>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <div className="relative group/input">
                                                        <input
                                                            type="text"
                                                            value={currentWeight}
                                                            onChange={(e) => handleWeightChange(ex.id, i, e.target.value)}
                                                            placeholder={ex.weight || '0'}
                                                            disabled={isCompleted}
                                                            className="w-20 bg-slate-900 border border-slate-800 rounded-lg pl-3 pr-8 py-2 text-center text-white font-mono font-bold focus:outline-none focus:border-electric-500 focus:shadow-[0_0_10px_rgba(0,242,234,0.2)] transition-all disabled:opacity-50 disabled:bg-transparent"
                                                        />
                                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-600 text-[10px] font-bold uppercase pointer-events-none group-focus-within/input:text-electric-500 transition-colors">kg</span>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <div className="relative group/input">
                                                            <input
                                                                type="text"
                                                                value={setReps[key] !== undefined ? setReps[key] : ex.reps}
                                                                onChange={(e) => handleRepsChange(ex.id, i, e.target.value)}
                                                                placeholder={ex.reps}
                                                                disabled={isCompleted}
                                                                className="w-20 bg-slate-900 border border-slate-800 rounded-lg pl-3 pr-10 py-2 text-center text-white font-mono font-bold focus:outline-none focus:border-electric-500 focus:shadow-[0_0_10px_rgba(0,242,234,0.2)] transition-all disabled:opacity-50 disabled:bg-transparent"
                                                            />
                                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-600 text-[10px] font-bold uppercase pointer-events-none group-focus-within/input:text-electric-500 transition-colors">reps</span>
                                                        </div>

                                                        <button
                                                            onClick={() => toggleSet(ex.id, i)}
                                                            disabled={isCompleted}
                                                            className={clsx(
                                                                "w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 active:scale-90",
                                                                isCompleted
                                                                    ? "bg-acid-500 text-black shadow-[0_0_15px_rgba(204,255,0,0.4)] rotate-3"
                                                                    : "bg-slate-800 text-slate-400 hover:bg-electric-500 hover:text-white hover:shadow-[0_0_15px_rgba(0,242,234,0.4)]"
                                                            )}
                                                            title="Complete Set"
                                                        >
                                                            <CheckCircle2 size={20} className={clsx(isCompleted && "fill-black/20")} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {
                    restTimer.active && (
                        <Portal>
                            <div className="fixed inset-x-0 bottom-0 p-4 z-[100] animate-slide-up">
                                <div className="bg-slate-950/90 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.8)] p-6 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-r from-electric-500/10 to-neon-500/10 animate-pulse-slow pointer-events-none" />

                                    <div className="flex justify-between items-center mb-6 relative z-10">
                                        <h3 className="text-lg font-black italic text-white flex items-center gap-2 uppercase tracking-wider">
                                            <Clock className="text-electric-400 animate-spin-slow" size={20} /> Rest Timer
                                        </h3>
                                        <button onClick={skipRest} className="text-slate-500 hover:text-white p-2 hover:bg-white/10 rounded-full transition-colors">
                                            <X size={20} />
                                        </button>
                                    </div>

                                    <div className="flex flex-col items-center gap-6 relative z-10">
                                        <div className="text-7xl font-mono font-bold text-white tabular-nums tracking-tighter text-glow">
                                            {formatTime(restTimer.time)}
                                        </div>

                                        <div className="flex items-center gap-4 w-full justify-center">
                                            <button
                                                onClick={() => adjustRestTime(-10)}
                                                className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-white/20 flex items-center justify-center transition-all active:scale-90"
                                            >
                                                <Minus size={20} />
                                            </button>

                                            <button
                                                onClick={skipRest}
                                                className="btn btn-primary flex-1 max-w-[200px] py-3 rounded-xl uppercase tracking-widest font-bold text-sm"
                                            >
                                                Skip Rest
                                            </button>

                                            <button
                                                onClick={() => adjustRestTime(30)}
                                                className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-white/20 flex items-center justify-center transition-all active:scale-90"
                                            >
                                                <Plus size={20} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Portal>
                    )
                }

                {/* Info Modal */}
                {
                    activeInfo && (
                        <Portal>
                            <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[110] flex items-center justify-center p-4 animate-enter">
                                <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 w-full max-w-md relative shadow-2xl">
                                    <button
                                        onClick={() => setActiveInfo(null)}
                                        className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                                    >
                                        <X size={24} />
                                    </button>

                                    <h3 className="text-2xl font-black italic text-white mb-6 pr-8">{activeInfo.name}</h3>

                                    <div className="space-y-6">
                                        {activeInfo.description && (
                                            <div>
                                                <h4 className="text-xs font-bold text-electric-400 uppercase tracking-widest mb-2">Instructions</h4>
                                                <p className="text-slate-300 text-sm leading-relaxed">{activeInfo.description}</p>
                                            </div>
                                        )}

                                        {activeInfo.link && (
                                            <div>
                                                <h4 className="text-xs font-bold text-electric-400 uppercase tracking-widest mb-2">External Resource</h4>
                                                <a
                                                    href={activeInfo.link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 text-white hover:text-electric-400 transition-colors p-3 bg-slate-950 rounded-xl border border-slate-800 hover:border-electric-500/50 group"
                                                >
                                                    <ExternalLink size={18} />
                                                    <span className="font-medium">Open Video / Guide</span>
                                                    <ArrowRight size={16} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Portal>
                    )
                }
            </>
        );
    }

    return (
        <div className="space-y-8 animate-enter p-6">
            <header className="relative z-10">
                <h2 className="text-4xl font-black italic text-white mb-2 uppercase tracking-tighter">Start Workout</h2>
                <p className="text-slate-400 font-medium">Select a routine to begin your session.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {workouts.map(workout => {
                    const lastSession = history
                        ?.filter(h => h.workoutId === workout.id)
                        .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

                    return (
                        <button
                            key={workout.id}
                            onClick={() => setActiveWorkout(workout)}
                            className="glass-panel text-left group hover:border-electric-500/50 transition-all duration-300 rounded-2xl p-6 relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-electric-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="flex justify-between items-start mb-6 relative z-10">
                                <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center text-electric-400 group-hover:bg-electric-500 group-hover:text-black group-hover:scale-110 transition-all duration-300 shadow-lg">
                                    <Play size={24} className="ml-1 fill-current" />
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-slate-950/50 text-slate-400 border border-white/5 group-hover:border-electric-500/30 transition-colors">
                                    {workout.exercises.length} Exercises
                                </span>
                            </div>

                            <div className="relative z-10">
                                <h3 className="text-2xl font-black italic text-white mb-2 group-hover:text-electric-400 transition-colors">{workout.name}</h3>
                                <p className="text-xs text-slate-500 font-mono flex items-center gap-2">
                                    <Clock size={12} />
                                    Last performed: {lastSession ? new Date(lastSession.date).toLocaleDateString() : 'Never'}
                                </p>
                            </div>
                        </button>
                    );
                })}

                {workouts.length === 0 && (
                    <div className="col-span-full text-center py-16 border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/20">
                        <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center mx-auto mb-4 border border-slate-800">
                            <Plus size={32} className="text-slate-600" />
                        </div>
                        <p className="text-slate-400 font-medium mb-2">No routines found.</p>
                        <p className="text-sm text-slate-500">Go to the Planner to create your first workout.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Tracker;
