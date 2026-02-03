import React from 'react';
import { Dumbbell } from 'lucide-react';

const Loading = () => {
    return (
        <div className="flex flex-col items-center justify-center h-full min-h-[50vh] animate-fade-in">
            <div className="relative mb-8">
                <div className="absolute inset-0 bg-sky-500/20 blur-[40px] rounded-full animate-pulse-slow"></div>
                <div className="w-20 h-20 rounded-[1.5rem] bg-slate-900 border border-white/5 flex items-center justify-center shadow-2xl relative z-10 transform rotate-3">
                    <Dumbbell size={40} className="text-sky-400 animate-bounce" />
                </div>
            </div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] animate-pulse">Loading System...</p>
        </div>
    );
};

export default Loading;
