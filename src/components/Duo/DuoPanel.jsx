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
            <div className="glass-card p-4 animate-fade-in border-slate-700/50">
                <div className="flex items-center gap-2 mb-3 text-slate-400">
                    <WifiOff size={18} />
                    <span className="text-sm font-medium">Duo Mode Offline</span>
                </div>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={inputRoom}
                        onChange={(e) => setInputRoom(e.target.value)}
                        placeholder="Room Code (e.g. GYM1)"
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                    />
                    <button
                        onClick={handleJoin}
                        disabled={!inputRoom.trim()}
                        className="btn btn-primary py-2 px-4 text-sm"
                    >
                        Join
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="glass-card p-4 animate-fade-in border-indigo-500/30 bg-indigo-500/5">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <div className="flex items-center gap-2 text-indigo-400 mb-1">
                        <Users size={18} />
                        <span className="font-bold">Duo Mode Active</span>
                    </div>
                    <p className="text-xs text-slate-400">Room: <span className="text-white font-mono">{roomId}</span></p>
                </div>
                <button
                    onClick={disconnectFromRoom}
                    className="text-xs text-slate-500 hover:text-red-400 transition-colors"
                >
                    Disconnect
                </button>
            </div>

            {partner ? (
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-emerald-400 text-sm">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                        Partner Connected
                    </div>

                    {partnerWorkout ? (
                        <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
                            <div className="flex items-center gap-2 text-slate-300 mb-2">
                                <Activity size={16} className="text-sky-400" />
                                <span className="text-sm font-medium">{partnerWorkout.exerciseName}</span>
                            </div>
                            <div className="flex justify-between text-xs text-slate-400">
                                <span>Set {partnerWorkout.setNumber}</span>
                                <span>{partnerWorkout.reps} reps @ {partnerWorkout.weight}kg</span>
                            </div>
                        </div>
                    ) : (
                        <p className="text-xs text-slate-500 italic">Waiting for partner's first set...</p>
                    )}
                </div>
            ) : (
                <div className="flex items-center gap-2 text-amber-400 text-sm">
                    <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></div>
                    Waiting for partner...
                </div>
            )}
        </div>
    );
};

export default DuoPanel;
