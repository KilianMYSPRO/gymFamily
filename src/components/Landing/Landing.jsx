import React from 'react';
import Auth from '../Auth/Auth';
import { Dumbbell } from 'lucide-react';

const Landing = ({ onLogin }) => {
    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-sky-500/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 w-full max-w-md space-y-8">
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 shadow-xl shadow-indigo-500/20 mb-4">
                        <Dumbbell size={40} className="text-white" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                        Duo<span className="text-sky-400">Gym</span>
                    </h1>
                    <p className="text-slate-400 text-lg">
                        Your personal workout companion. <br />
                        Sync across all your devices.
                    </p>
                </div>

                <Auth onLogin={onLogin} />
            </div>
        </div>
    );
};

export default Landing;
