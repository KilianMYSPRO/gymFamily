import React, { useState } from 'react';
import { useDuo } from '../../context/DuoContext';
import { Users, Wifi, WifiOff, Activity } from 'lucide-react';


const DuoPanel = () => {
    // const { t } = useLanguage();
    const { isConnected, roomId, partner, partnerWorkout, connectToRoom, disconnectFromRoom } = useDuo();
    const [inputRoom, setInputRoom] = useState('');

    const handleJoin = () => {
        if (inputRoom.trim()) {
            connectToRoom(inputRoom.trim());
        }
    };

    if (!isConnected) {
        return (
            <div className="bg-slate-900/40 backdrop-blur-md p-4 rounded-3xl border border-white/5 animate-fade-in">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-slate-500">
                        <WifiOff size={16} />
                        <span className="text-xs font-black uppercase tracking-widest">Duo Mode</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-600 uppercase">Offline</span>
                </div>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={inputRoom}
                        onChange={(e) => setInputRoom(e.target.value)}
                        placeholder="Room Code (e.g. GYM1)"
                        className="flex-1 bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2.5 text-base text-white focus:outline-none focus:border-indigo-500 transition-all"
                    />
                    <button
                        onClick={handleJoin}
                        disabled={!inputRoom.trim()}
                        className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 rounded-xl font-bold text-sm transition-all active:scale-95 shadow-lg shadow-indigo-500/20"
                    >
                        Join
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-indigo-600/10 backdrop-blur-md p-4 rounded-3xl border border-indigo-500/20 animate-fade-in relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Users size={60} className="text-indigo-400" />
            </div>

            <div className="flex justify-between items-start mb-4 relative z-10">
                <div>
                    <div className="flex items-center gap-2 text-indigo-400 mb-0.5">
                        <Users size={16} />
                        <span className="text-xs font-black uppercase tracking-widest">Duo Mode Active</span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Room: <span className="text-indigo-300 font-mono">{roomId}</span></p>
                </div>
                <button
                    onClick={disconnectFromRoom}
                    className="p-2 hover:bg-red-500/10 rounded-lg text-slate-500 hover:text-red-400 transition-colors active:scale-90"
                >
                    <X size={18} />
                </button>
            </div>

            <div className="relative z-10">
                {partner ? (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 w-fit px-2 py-0.5 rounded-full border border-emerald-500/20">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                            Partner In
                        </div>

                        {partnerWorkout ? (
                            <div className="bg-slate-950/40 rounded-2xl p-3 border border-white/5 backdrop-blur-sm">
                                <div className="flex items-center gap-2 text-white mb-2">
                                    <div className="w-6 h-6 rounded-lg bg-sky-500/20 flex items-center justify-center text-sky-400">
                                        <Activity size={14} />
                                    </div>
                                    <span className="text-sm font-bold truncate">{partnerWorkout.exerciseName}</span>
                                </div>
                                <div className="flex justify-between items-end">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Set {partnerWorkout.setNumber}</span>
                                    <span className="text-sm font-black italic text-sky-400">
                                        {partnerWorkout.reps} <span className="text-[10px] uppercase not-italic text-slate-600 ml-0.5">Reps</span> @ {partnerWorkout.weight} <span className="text-[10px] uppercase not-italic text-slate-600">kg</span>
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <p className="text-xs text-slate-500 italic px-1">Waiting for partner's first set...</p>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-amber-400 text-[10px] font-black uppercase tracking-widest bg-amber-500/10 w-fit px-2 py-0.5 rounded-full border border-amber-500/20">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></div>
                        Waiting for partner...
                    </div>
                )}
            </div>
        </div>
    );
};

export default DuoPanel;
