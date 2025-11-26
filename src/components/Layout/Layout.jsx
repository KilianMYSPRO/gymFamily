import React from 'react';
import { useStore } from '../../context/StoreContext';
import { LayoutDashboard, Calendar, Dumbbell, UserCircle2, LogOut, Clock } from 'lucide-react';
import clsx from 'clsx';

const NavItem = ({ icon: Icon, label, active, onClick }) => (
    <button
        onClick={onClick}
        className={clsx(
            "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 w-full text-left",
            active
                ? "bg-accent-primary/10 text-accent-primary shadow-[0_0_15px_rgba(14,165,233,0.3)]"
                : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
        )}
    >
        <Icon size={20} />
        <span className="font-medium">{label}</span>
    </button>
);

const Layout = ({ children, currentView, onViewChange }) => {
    const { activeProfile, switchProfile, profiles } = useStore();

    const otherProfile = profiles.find(p => p.id !== activeProfile.id);

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-slate-950 text-slate-50">
            {/* Sidebar / Mobile Header */}
            <aside className="w-full md:w-64 bg-slate-900/50 backdrop-blur-xl border-b md:border-b-0 md:border-r border-slate-800 p-4 flex flex-col justify-between sticky top-0 z-50 md:h-screen">
                <div>
                    <div className="flex items-center gap-3 px-2 mb-8">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-sky-500/20">
                            <Dumbbell size={18} className="text-white" />
                        </div>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                            DuoGym
                        </h1>
                    </div>

                    <nav className="space-y-2 hidden md:block">
                        <NavItem
                            icon={LayoutDashboard}
                            label="Dashboard"
                            active={currentView === 'dashboard'}
                            onClick={() => onViewChange('dashboard')}
                        />
                        <NavItem
                            icon={Calendar}
                            label="Planner"
                            active={currentView === 'planner'}
                            onClick={() => onViewChange('planner')}
                        />
                        <NavItem
                            icon={Dumbbell}
                            label="Workout"
                            active={currentView === 'workout'}
                            onClick={() => onViewChange('workout')}
                        />
                        <NavItem
                            icon={Clock}
                            label="History"
                            active={currentView === 'history'}
                            onClick={() => onViewChange('history')}
                        />
                        <NavItem
                            icon={UserCircle2}
                            label="Profile"
                            active={currentView === 'profile'}
                            onClick={() => onViewChange('profile')}
                        />
                    </nav>
                </div>

                {/* Profile Switcher */}
                <div className="mt-auto pt-4 border-t border-slate-800 hidden md:block">
                    <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                        <div className="flex items-center gap-3 mb-3">
                            <div className={clsx(
                                "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold",
                                activeProfile.theme === 'blue' ? "bg-sky-500" : "bg-indigo-500"
                            )}>
                                {activeProfile.name[0]}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-white">{activeProfile.name}</p>
                                <p className="text-xs text-slate-400">Active Profile</p>
                            </div>
                        </div>
                        <button
                            onClick={() => switchProfile(otherProfile.id)}
                            className="w-full py-2 px-3 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-xs text-slate-300 flex items-center justify-center gap-2 transition-colors"
                        >
                            <UserCircle2 size={14} />
                            Switch to {otherProfile.name}
                        </button>
                    </div>
                </div>

                {/* Mobile Nav */}
                <div className="md:hidden flex justify-between items-center overflow-x-auto pb-2">
                    <div className="flex gap-1">
                        <button
                            onClick={() => onViewChange('dashboard')}
                            className={clsx("p-2 rounded-lg", currentView === 'dashboard' ? "text-sky-400 bg-sky-400/10" : "text-slate-400")}
                        ><LayoutDashboard size={24} /></button>
                        <button
                            onClick={() => onViewChange('planner')}
                            className={clsx("p-2 rounded-lg", currentView === 'planner' ? "text-sky-400 bg-sky-400/10" : "text-slate-400")}
                        ><Calendar size={24} /></button>
                        <button
                            onClick={() => onViewChange('workout')}
                            className={clsx("p-2 rounded-lg", currentView === 'workout' ? "text-sky-400 bg-sky-400/10" : "text-slate-400")}
                        ><Dumbbell size={24} /></button>
                        <button
                            onClick={() => onViewChange('history')}
                            className={clsx("p-2 rounded-lg", currentView === 'history' ? "text-sky-400 bg-sky-400/10" : "text-slate-400")}
                        ><Clock size={24} /></button>
                        <button
                            onClick={() => onViewChange('profile')}
                            className={clsx("p-2 rounded-lg", currentView === 'profile' ? "text-sky-400 bg-sky-400/10" : "text-slate-400")}
                        ><UserCircle2 size={24} /></button>
                    </div>
                    <button
                        onClick={() => switchProfile(otherProfile.id)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300"
                    >
                        <div className={clsx("w-2 h-2 rounded-full", activeProfile.theme === 'blue' ? "bg-sky-500" : "bg-indigo-500")} />
                        {activeProfile.name}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                <div className="max-w-5xl mx-auto animate-fade-in">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;
