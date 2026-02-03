import React from 'react';
import Auth from '../Auth/Auth';
import { Dumbbell } from 'lucide-react';

const Landing = ({ onLogin }) => {
    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-sky-500/10 rounded-full blur-[120px] animate-pulse-slow" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse-slow" />
            </div>

            <div className="relative z-10 w-full max-w-md space-y-12">
                <div className="text-center space-y-6">
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-[2rem] bg-gradient-to-br from-sky-500 to-indigo-600 shadow-2xl shadow-sky-500/20 mb-4 transform rotate-3 animate-enter">
                        <Dumbbell size={48} className="text-white" />
                    </div>
                    <div className="space-y-2 animate-enter" style={{ animationDelay: '100ms' }}>
                        <h1 className="text-5xl md:text-6xl font-black italic text-white uppercase tracking-tighter leading-none">
                            Duo<span className="text-sky-400">Gym</span>
                        </h1>
                        <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-xs">
                            Elevate Your Performance
                        </p>
                    </div>
                    <p className="text-slate-400 text-lg leading-relaxed animate-enter" style={{ animationDelay: '200ms' }}>
                        The personal workout companion <br />
                        designed for gym partners.
                    </p>
                </div>

                <div className="animate-enter" style={{ animationDelay: '300ms' }}>
                    <Auth onLogin={onLogin} />
                </div>
            </div>
        </div>
    );
};

export default Landing;
