import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { Play, CheckCircle2, Clock, ArrowLeft, Save, X, Plus, Minus, SkipForward } from 'lucide-react';
import clsx from 'clsx';

const Tracker = ({ initialWorkoutId }) => {
    const { workouts, logSession } = useStore();
    const [activeWorkout, setActiveWorkout] = useState(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [completedSets, setCompletedSets] = useState({});
    const [restTimer, setRestTimer] = useState({ active: false, time: 90 });

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

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const toggleSet = (exerciseId, setIndex) => {
        const key = `${exerciseId}-${setIndex}`;
        if (completedSets[key]) return; // Prevent undoing

        setCompletedSets(prev => ({
            ...prev,
            [key]: true
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
        logSession({
            workoutId: activeWorkout.id,
            workoutName: activeWorkout.name,
            duration: elapsedTime,
            completedSets: Object.keys(completedSets).length,
            totalSets: activeWorkout.exercises.reduce((acc, ex) => acc + parseInt(ex.sets), 0)
        });
        setActiveWorkout(null);
        setElapsedTime(0);
        setCompletedSets({});
    };

    if (activeWorkout) {
        return (
            <div className="space-y-6 animate-fade-in">
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
                            </div>
                        </div>
                    </div>
                    <button onClick={finishWorkout} className="btn btn-primary py-2 px-4 text-sm">
                        <Save size={16} /> Finish
                    </button>
                </header>

                <div className="space-y-4 pb-20">
                    {activeWorkout.exercises.map((ex) => (
                        <div key={ex.id} className="glass-card">
                            <div className="flex justify-between items-baseline mb-4">
                                <h3 className="text-lg font-bold text-white">{ex.name}</h3>
                                <span className="text-slate-400 text-sm">{ex.weight}</span>
                            </div>

                            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                                {Array.from({ length: parseInt(ex.sets) }).map((_, i) => {
                                    const isCompleted = completedSets[`${ex.id}-${i}`];
                                    return (
                                        <button
                                            key={i}
                                            onClick={() => toggleSet(ex.id, i)}
                                            disabled={isCompleted}
                                            className={clsx(
                                                "h-12 rounded-lg flex items-center justify-center font-bold transition-all duration-200 border",
                                                isCompleted
                                                    ? "bg-sky-500 border-sky-400 text-white shadow-[0_0_10px_rgba(14,165,233,0.4)] cursor-default"
                                                    : "bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600"
                                            )}
                                        >
                                            {isCompleted ? <CheckCircle2 size={20} /> : <span>{ex.reps}</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {restTimer.active && (
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
                )}
            </div>
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
