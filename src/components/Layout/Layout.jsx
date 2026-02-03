import React from 'react';

import { LayoutDashboard, Calendar, Dumbbell, UserCircle2, LogOut, Clock, Languages } from 'lucide-react';
import clsx from 'clsx';
import { useLanguage } from '../../context/LanguageContext';

// eslint-disable-next-line no-unused-vars
const NavItem = ({ icon: Icon, label, active, onClick }) => (
    <button
        onClick={onClick}
        className={clsx(
            "flex items-center gap-3 px-5 py-4 rounded-2xl transition-all duration-300 w-full text-left group",
            active
                ? "bg-sky-500 text-white shadow-lg shadow-sky-500/20 active:scale-95"
                : "text-slate-500 hover:bg-white/5 hover:text-slate-200"
        )}
    >
        <Icon size={20} className={clsx("transition-transform duration-300 group-hover:scale-110", active ? "scale-110" : "")} />
        <span className="text-xs font-black uppercase tracking-[0.2em]">{label}</span>
    </button>
);



const Layout = ({ children, currentView, onViewChange }) => {
    const { t, language, toggleLanguage } = useLanguage();

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-slate-950 text-slate-50">
            {/* Sidebar / Mobile Header */}
            <aside className="hidden md:flex md:w-72 bg-slate-900/40 backdrop-blur-2xl border-b md:border-b-0 md:border-r border-white/5 p-6 flex-col justify-between sticky top-0 z-50 md:h-screen shadow-2xl">
                <div>
                    <div className="flex items-center gap-4 px-2 mb-12">
                        <div className="w-10 h-10 rounded-[1.25rem] bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-sky-500/20 transform rotate-3">
                            <Dumbbell size={22} className="text-white" />
                        </div>
                        <h1 className="text-2xl font-black italic uppercase tracking-tighter text-white">
                            Duo<span className="text-sky-400">Gym</span>
                        </h1>
                    </div>

                    <nav className="space-y-3 hidden md:block">
                        <NavItem
                            icon={LayoutDashboard}
                            label={t('nav.dashboard')}
                            active={currentView === 'dashboard'}
                            onClick={() => onViewChange('dashboard')}
                        />
                        <NavItem
                            icon={Calendar}
                            label={t('nav.planner')}
                            active={currentView === 'planner'}
                            onClick={() => onViewChange('planner')}
                        />
                        <NavItem
                            icon={Dumbbell}
                            label={t('nav.workout')}
                            active={currentView === 'workout'}
                            onClick={() => onViewChange('workout')}
                        />
                        <NavItem
                            icon={Clock}
                            label={t('nav.history')}
                            active={currentView === 'history'}
                            onClick={() => onViewChange('history')}
                        />
                        <NavItem
                            icon={UserCircle2}
                            label={t('nav.profile')}
                            active={currentView === 'profile'}
                            onClick={() => onViewChange('profile')}
                        />
                    </nav>
                </div>

                <div className="hidden md:block px-2">
                    <button
                        onClick={toggleLanguage}
                        className="flex items-center gap-3 px-5 py-4 rounded-2xl text-slate-500 hover:bg-white/5 hover:text-white transition-all w-full text-left group"
                    >
                        <Languages size={20} className="group-hover:rotate-12 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-widest">{language === 'en' ? 'Français' : 'English'}</span>
                    </button>
                </div>


            </aside>

            {/* Mobile Nav */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-950/90 backdrop-blur-2xl border-t border-white/5 p-2 z-50 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
                <div className="grid grid-cols-5 items-center">
                    <button
                        onClick={() => { if (navigator.vibrate) navigator.vibrate(10); onViewChange('dashboard'); }}
                        className={clsx("p-3 rounded-xl flex flex-col items-center gap-1.5 active:scale-95 transition-all", currentView === 'dashboard' ? "text-sky-400" : "text-slate-600")}
                    >
                        <LayoutDashboard size={20} strokeWidth={currentView === 'dashboard' ? 3 : 2} />
                        <span className="text-[8px] font-black uppercase tracking-tighter">{t('nav.dashboard')}</span>
                    </button>
                    <button
                        onClick={() => { if (navigator.vibrate) navigator.vibrate(10); onViewChange('planner'); }}
                        className={clsx("p-3 rounded-xl flex flex-col items-center gap-1.5 active:scale-95 transition-all", currentView === 'planner' ? "text-sky-400" : "text-slate-600")}
                    >
                        <Calendar size={20} strokeWidth={currentView === 'planner' ? 3 : 2} />
                        <span className="text-[8px] font-black uppercase tracking-tighter">{t('nav.planner')}</span>
                    </button>
                    <button
                        onClick={() => { if (navigator.vibrate) navigator.vibrate([10, 30, 10]); onViewChange('workout'); }}
                        className={clsx("p-2 rounded-xl flex flex-col items-center gap-1.5 -mt-6 active:scale-95 transition-all", currentView === 'workout' ? "text-sky-400" : "text-slate-600")}
                    >
                        <div className={clsx("w-14 h-14 rounded-[1.5rem] flex items-center justify-center shadow-2xl transition-all duration-500", currentView === 'workout' ? "bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-sky-500/40 rotate-3 scale-110" : "bg-slate-800 text-slate-500")}>
                            <Dumbbell size={28} strokeWidth={2.5} />
                        </div>
                        <span className="text-[8px] font-black uppercase tracking-tighter">{t('nav.workout')}</span>
                    </button>
                    <button
                        onClick={() => { if (navigator.vibrate) navigator.vibrate(10); onViewChange('history'); }}
                        className={clsx("p-3 rounded-xl flex flex-col items-center gap-1.5 active:scale-95 transition-all", currentView === 'history' ? "text-sky-400" : "text-slate-600")}
                    >
                        <Clock size={20} strokeWidth={currentView === 'history' ? 3 : 2} />
                        <span className="text-[8px] font-black uppercase tracking-tighter">{t('nav.history')}</span>
                    </button>
                    <button
                        onClick={() => { if (navigator.vibrate) navigator.vibrate(10); onViewChange('profile'); }}
                        className={clsx("p-3 rounded-xl flex flex-col items-center gap-1.5 active:scale-95 transition-all", currentView === 'profile' ? "text-sky-400" : "text-slate-600")}
                    >
                        <UserCircle2 size={20} strokeWidth={currentView === 'profile' ? 3 : 2} />
                        <span className="text-[8px] font-black uppercase tracking-tighter">{t('nav.profile')}</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-8 overflow-y-auto pb-24 md:pb-8">
                <div className="max-w-5xl mx-auto animate-fade-in">
                    {children}
                </div>
            </main>
        </div >
    );
};

export default Layout;
