import React from 'react';
import { Dumbbell } from 'lucide-react';

const Loading = () => {
    return (
        <div className="flex flex-col items-center justify-center h-full min-h-[50vh] animate-fade-in">
            <div className="relative">
                <div className="absolute inset-0 bg-electric-500/20 blur-xl rounded-full animate-pulse"></div>
                <Dumbbell size={48} className="text-electric-400 animate-spin-slow relative z-10" />
            </div>
            <p className="mt-4 text-slate-400 font-medium animate-pulse">Loading...</p>
        </div>
    );
};

export default Loading;
