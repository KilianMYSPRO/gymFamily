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
    const { activeProfile } = useStore();

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

            </aside>

            {/* Main Content */}
            < main className="flex-1 p-4 md:p-8 overflow-y-auto" >
                <div className="max-w-5xl mx-auto animate-fade-in">
                    {children}
                </div>
            </main >
        </div >
    );
};

export default Layout;
