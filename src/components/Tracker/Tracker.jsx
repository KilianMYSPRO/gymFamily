import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { Play, Pause, RotateCcw, CheckCircle2, ChevronRight, ChevronLeft, Timer, SkipForward, Plus, Minus, Info, ExternalLink, X, Clock, ArrowLeft, Save, Sun } from 'lucide-react';
import Portal from '../common/Portal';
import clsx from 'clsx';
import useWakeLock from '../../hooks/useWakeLock';

const Tracker = ({ initialWorkoutId }) => {
    const { workouts, logSession } = useStore();
    const [activeWorkout, setActiveWorkout] = useState(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [completedSets, setCompletedSets] = useState({});
    const [setWeights, setSetWeights] = useState({});
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
            requestWakeLock();
        } else {
            releaseWakeLock();
        }
    }, [activeWorkout, requestWakeLock, releaseWakeLock]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleWeightChange = (exerciseId, setIndex, value) => {
        setSetWeights(prev => ({
            ...prev,
            [`${exerciseId}-${setIndex}`]: value
        }));
    };

    const toggleSet = (exerciseId, setIndex) => {
        const key = `${exerciseId}-${setIndex}`;
        if (completedSets[key]?.completed) return; // Prevent undoing

        const weight = setWeights[key] !== undefined ? setWeights[key] : (activeWorkout.exercises.find(e => e.id === exerciseId)?.weight || '');

        setCompletedSets(prev => ({
            ...prev,
            [key]: { completed: true, weight }
        }));

        const exercise = activeWorkout.exercises.find(e => e.id === exerciseId);
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
                    weight: setWeights[key] !== undefined ? setWeights[key] : completedSets[key].weight
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
                <div className="space-y-6">
                    <header className="flex justify-between items-center sticky top-0 bg-slate-950/80 backdrop-blur-md py-4 z-10 border-b border-slate-800/50">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setActiveWorkout(null)}
                                className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <div>
                                <h2 className="text-xl font-bold text-white">{activeWorkout.name}</h2>
                                <div className="flex items-center gap-2 text-sky-400 font-mono text-sm">
                                    <Clock size={14} />
                                    {formatTime(elapsedTime)}
                                    <button
                                        onClick={() => {
                                            if (type === 'nosleep') {
                                                releaseWakeLock();
                                            } else {
                                                // If unlocked OR native, upgrade to NoSleep (don't release native first)
                                                requestWakeLock(true); // true = force NoSleep
                                            }
                                        }}
                                        className={clsx(
                                            "flex items-center gap-1 ml-2 text-xs transition-colors",
                                            type === 'nosleep' ? "text-blue-400" :
                                                type === 'native' ? "text-emerald-400" :
                                                    "text-slate-600 hover:text-slate-400"
                                        )}
                                        title={isLocked ? "Screen Stay-Awake Active" : "Click to keep screen awake"}
                                    >
                                        <Sun size={12} />
                                        <span>{isLocked ? "Awake" : "Sleep"}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <button onClick={finishWorkout} className="btn btn-primary py-2 px-4 text-sm">
                            <Save size={16} /> Finish
                        </button>
                    </header>

                    <div className="space-y-4 pb-20">
                        {activeWorkout.exercises && activeWorkout.exercises.map((ex) => (
                            <div key={ex.id} className="glass-card">
                                <div className="flex justify-between items-baseline mb-4">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-lg font-bold text-white">{ex.name}</h3>
                                        {(ex.description || ex.link) && (
                                            <button
                                                onClick={() => setActiveInfo(ex)}
                                                className="text-sky-400 hover:text-sky-300 transition-colors"
                                            >
                                                <Info size={18} />
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {ex.isOptional && (
                                            <span className="text-xs font-medium px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                                Optional
                                            </span>
                                        )}
                                        <span className="text-slate-400 text-sm">{ex.weight}</span>
                                    </div>
                                </div>

                                {ex.isOptional && !Array.from({ length: parseInt(ex.sets) }).every((_, i) => completedSets[`${ex.id}-${i}`]?.completed) && (
                                    <button
                                        onClick={() => skipExercise(ex.id)}
                                        className="w-full mb-4 py-2 text-sm text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors border border-slate-700/50 hover:border-slate-700"
                                    >
                                        Skip Optional Exercise
                                    </button>
                                )}

                                <div className="space-y-3">
                                    {Array.from({ length: parseInt(ex.sets) }).map((_, i) => {
                                        const key = `${ex.id}-${i}`;
                                        const isCompleted = completedSets[key]?.completed;
                                        const currentWeight = setWeights[key] !== undefined ? setWeights[key] : (ex.weight || '');

                                        return (
                                            <div key={i} className="flex items-center justify-between bg-slate-800/30 p-3 rounded-xl border border-slate-800">
                                                <span className="text-slate-400 font-mono text-sm w-12">Set {i + 1}</span>

                                                <div className="flex items-center gap-3">
                                                    <div className="relative">
                                                        <input
                                                            type="text"
                                                            value={currentWeight}
                                                            onChange={(e) => handleWeightChange(ex.id, i, e.target.value)}
                                                            placeholder="0"
                                                            className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-right text-white focus:outline-none focus:border-sky-500 transition-colors"
                                                        />
                                                        <span className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-500 text-xs pointer-events-none">kg</span>
                                                    </div>

                                                    <button
                                                        onClick={() => toggleSet(ex.id, i)}
                                                        disabled={isCompleted}
                                                        className={clsx(
                                                            "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200",
                                                            isCompleted
                                                                ? "bg-sky-500 text-white shadow-[0_0_15px_rgba(14,165,233,0.4)]"
                                                                : "bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white"
                                                        )}
                                                    >
                                                        {isCompleted ? <CheckCircle2 size={24} /> : <span className="font-bold">{ex.reps}</span>}
                                                    </button>
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
                            <div className="fixed inset-x-0 bottom-0 p-4 z-[100] animate-fade-in">
                                <div className="bg-slate-950 border border-slate-800 rounded-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.7)] p-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                            <Clock className="text-sky-400" size={20} /> Rest Timer
                                        </h3>
                                        <button onClick={skipRest} className="text-slate-400 hover:text-white p-1">
                                            <X size={24} />
                                        </button>
                                    </div>

                                    <div className="flex flex-col items-center gap-4">
                                        <div className="text-5xl font-mono font-bold text-white tabular-nums tracking-wider">
                                            {formatTime(restTimer.time)}
                                        </div>

                                        <div className="flex items-center gap-4 w-full justify-center">
                                            <button
                                                onClick={() => adjustRestTime(-10)}
                                                className="p-3 rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
                                            >
                                                <Minus size={20} />
                                            </button>

                                            <button
                                                onClick={skipRest}
                                                className="btn btn-primary flex-1 max-w-[200px]"
                                            >
                                                <SkipForward size={20} /> Skip Rest
                                            </button>

                                            <button
                                                onClick={() => adjustRestTime(30)}
                                                className="p-3 rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
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
                            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-fade-in">
                                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md relative">
                                    <button
                                        onClick={() => setActiveInfo(null)}
                                        className="absolute top-4 right-4 text-slate-400 hover:text-white"
                                    >
                                        <X size={24} />
                                    </button>

                                    <h3 className="text-xl font-bold text-white mb-4 pr-8">{activeInfo.name}</h3>

                                    <div className="space-y-4">
                                        {activeInfo.description && (
                                            <div>
                                                <h4 className="text-sm font-medium text-slate-400 mb-1">Instructions</h4>
                                                <p className="text-slate-200 text-sm leading-relaxed">{activeInfo.description}</p>
                                            </div>
                                        )}

                                        {activeInfo.link && (
                                            <div>
                                                <h4 className="text-sm font-medium text-slate-400 mb-1">External Resource</h4>
                                                <a
                                                    href={activeInfo.link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 text-sky-400 hover:text-sky-300 text-sm"
                                                >
                                                    <ExternalLink size={16} /> Open Link
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
        <div className="space-y-6">
            <header>
                <h2 className="text-3xl font-bold text-white mb-2">Start Workout</h2>
                <p className="text-slate-400">Select a routine to begin your session.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {workouts.map(workout => (
                    <button
                        key={workout.id}
                        onClick={() => setActiveWorkout(workout)}
                        className="glass-card text-left group hover:border-sky-500/50 transition-all"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-400 group-hover:bg-sky-500 group-hover:text-white transition-colors">
                                <Play size={24} className="ml-1" />
                            </div>
                            <span className="text-xs font-medium px-2 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                                {workout.exercises.length} Exercises
                            </span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-1">{workout.name}</h3>
                        <p className="text-sm text-slate-400">Last performed: Never</p>
                    </button>
                ))}

                {workouts.length === 0 && (
                    <div className="col-span-full text-center py-12 border-2 border-dashed border-slate-800 rounded-2xl">
                        <p className="text-slate-400 mb-4">No routines found.</p>
                        <p className="text-sm text-slate-500">Go to the Planner to create your first workout.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Tracker;
