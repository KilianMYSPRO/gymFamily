import React from 'react';
import { useStore } from '../../context/StoreContext';
import { LayoutDashboard, Calendar, Dumbbell, UserCircle2, LogOut, Clock } from 'lucide-react';
import clsx from 'clsx';
import { useLanguage } from '../../context/LanguageContext';

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
    const { t, language, toggleLanguage } = useLanguage();

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
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800/50 hover:text-white transition-all w-full text-left"
                    >
                        <span className="text-lg">{language === 'en' ? '🇫🇷' : '🇺🇸'}</span>
                        <span className="font-medium text-sm">{language === 'en' ? 'Français' : 'English'}</span>
                    </button>
                </div>

                {/* Mobile Nav */}
                <div className="md:hidden flex justify-between items-center overflow-x-auto pb-2">
                    <div className="flex gap-1 w-full justify-between items-center">
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

                        <div className="w-px h-6 bg-slate-800 mx-1"></div>

                        <button
                            onClick={toggleLanguage}
                            className="p-2 rounded-lg text-slate-400 hover:text-white"
                        >
                            <span className="text-xl">{language === 'en' ? '🇫🇷' : '🇺🇸'}</span>
                        </button>
                    </div>
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
