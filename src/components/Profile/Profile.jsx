import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { Save, User, Ruler, Weight, Calendar, Target, TrendingUp, Settings, Trash2, CheckCircle2, FileDown, Upload, AlertTriangle, X, Cloud, LogOut, RefreshCw, Database, Shield, HelpCircle, Lock, Download, ChevronDown } from 'lucide-react';
import Portal from '../common/Portal';
import Auth from '../Auth/Auth';
import Analytics from '../Analytics/Analytics';
import clsx from 'clsx';
import { useLanguage } from '../../context/LanguageContext';

const Profile = () => {
    const { t } = useLanguage();
    const { activeProfile, profileDetails, updateProfileDetails, updateProfileName, logWeight, weightHistory, deleteWeightLog, exportData, importData, syncStatus, syncData } = useStore();
    const { token, user, login, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('details'); // 'details' or 'analytics'
    const [formData, setFormData] = useState({
        name: activeProfile.name,
        age: '',
        weight: '',
        height: '',
        gender: 'prefer-not-to-say',
        goal: 'general-fitness',
        weeklyGoal: 3
    });
    const [isSaved, setIsSaved] = useState(false);
    const [showImportConfirm, setShowImportConfirm] = useState(false);
    const [importFile, setImportFile] = useState(null);
    const [importError, setImportError] = useState(null);

    // Security State
    const [securityData, setSecurityData] = useState({
        question: 'q1',
        answer: ''
    });
    const [securityStatus, setSecurityStatus] = useState(null); // 'success', 'error', 'loading'
    const [deferredPrompt, setDeferredPrompt] = useState(null);

    useEffect(() => {
        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
        }
    };

    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            name: activeProfile.name,
            ...(profileDetails || {})
        }));
    }, [profileDetails, activeProfile]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setIsSaved(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        updateProfileName(formData.name);
        // eslint-disable-next-line no-unused-vars
        const { name, ...details } = formData;
        updateProfileDetails(details);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
    };

    const handleSecurityUpdate = async (e) => {
        e.preventDefault();
        if (!token) return;
        setSecurityStatus('loading');

        try {
            const response = await fetch('/api/auth/update-security', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    securityQuestion: securityData.question,
                    securityAnswer: securityData.answer
                })
            });

            if (!response.ok) throw new Error('Failed to update');

            setSecurityStatus('success');
            setSecurityData(prev => ({ ...prev, answer: '' }));
            setTimeout(() => setSecurityStatus(null), 3000);
        } catch {
            setSecurityStatus('error');
            setTimeout(() => setSecurityStatus(null), 3000);
        }
    };

    const handleExport = () => {
        const jsonString = exportData();
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `duogym_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImportFile(file);
            setShowImportConfirm(true);
            setImportError(null);
        }
    };

    const confirmImport = async () => {
        if (!importFile) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            const result = importData(content);
            if (result.success) {
                setShowImportConfirm(false);
                setImportFile(null);
                alert('Data restored successfully!');
                window.location.reload(); // Reload to ensure fresh state
            } else {
                setImportError(result.error);
            }
        };
        reader.readAsText(importFile);
    };

    const SECURITY_QUESTIONS = ['q1', 'q2', 'q3', 'q4', 'q5'];

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-24 animate-enter">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-2">
                <div>
                    <h2 className="text-2xl md:text-3xl font-black italic text-white uppercase tracking-tight">{t('profile.title')}</h2>
                </div>

                <div className="flex bg-slate-900/60 backdrop-blur-md p-1 rounded-2xl border border-white/5 overflow-x-auto scrollbar-hide">
                    <button
                        onClick={() => setActiveTab('details')}
                        className={clsx(
                            "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all whitespace-nowrap",
                            activeTab === 'details' ? "bg-slate-800 text-white shadow-lg" : "text-slate-500 hover:text-white"
                        )}
                    >
                        <Settings size={14} /> {t('profile.details')}
                    </button>
                    <button
                        onClick={() => setActiveTab('analytics')}
                        className={clsx(
                            "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all whitespace-nowrap",
                            activeTab === 'analytics' ? "bg-sky-500 text-white shadow-lg shadow-sky-500/20" : "text-slate-500 hover:text-white"
                        )}
                    >
                        <TrendingUp size={14} /> {t('profile.analytics')}
                    </button>
                    <button
                        onClick={() => setActiveTab('data')}
                        className={clsx(
                            "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all whitespace-nowrap",
                            activeTab === 'data' ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" : "text-slate-500 hover:text-white"
                        )}
                    >
                        <Database size={14} /> {t('profile.data')}
                    </button>
                </div>
            </header>

            {activeTab === 'details' ? (
                <>
                    <form onSubmit={handleSubmit} className="bg-slate-900/40 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/5 space-y-8 animate-fade-in shadow-xl">
                        <div className="flex items-center gap-6 pb-6 border-b border-white/5">
                            <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center text-3xl font-black italic text-white shadow-2xl transform rotate-3 ${activeProfile.theme === 'blue' ? 'bg-sky-500 shadow-sky-500/20' : 'bg-indigo-500 shadow-indigo-500/20'
                                }`}>
                                {activeProfile.name[0]}
                            </div>
                            <div>
                                <h3 className="text-2xl font-black italic text-white uppercase tracking-tight leading-tight">{activeProfile.name}</h3>
                                <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mt-1">{t('profile.memberSince')} 2025</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="col-span-1 md:col-span-2 space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <User size={12} /> {t('profile.name')}
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Your Name"
                                    className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl px-5 py-4 text-white font-bold focus:outline-none focus:border-sky-500 transition-all shadow-inner"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <Calendar size={12} /> {t('profile.age')}
                                </label>
                                <input
                                    type="number"
                                    name="age"
                                    value={formData.age}
                                    onChange={handleChange}
                                    placeholder="Years"
                                    className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl px-5 py-4 text-white font-bold focus:outline-none focus:border-sky-500 transition-all shadow-inner"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <User size={12} /> {t('profile.gender')}
                                </label>
                                <div className="relative">
                                    <select
                                        name="gender"
                                        value={formData.gender}
                                        onChange={handleChange}
                                        className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl px-5 py-4 text-white font-bold focus:outline-none focus:border-sky-500 transition-all shadow-inner appearance-none"
                                    >
                                        <option value="prefer-not-to-say">Prefer not to say</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" size={18} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <Weight size={12} /> {t('profile.weight')}
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        name="weight"
                                        value={formData.weight}
                                        onChange={handleChange}
                                        placeholder="kg"
                                        className="flex-1 bg-slate-950/50 border border-slate-800 rounded-2xl px-5 py-4 text-white font-bold focus:outline-none focus:border-sky-500 transition-all shadow-inner"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (formData.weight) {
                                                logWeight(formData.weight);
                                                setIsSaved(true);
                                                setTimeout(() => setIsSaved(false), 3000);
                                            }
                                        }}
                                        className="px-6 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl border border-white/5 font-black uppercase tracking-widest text-[10px] transition-all active:scale-95"
                                    >
                                        {t('profile.logEntry')}
                                    </button>
                                </div>

                                {weightHistory && weightHistory.length > 0 && (
                                    <div className="mt-4 space-y-2 px-1">
                                        <div className="flex justify-between items-center">
                                            <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.2em]">{t('profile.recentEntries')}</p>
                                        </div>
                                        <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                                            {[...weightHistory].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5).map(entry => (
                                                <div key={entry.id} className="flex justify-between items-center bg-white/5 px-4 py-2.5 rounded-xl border border-white/5 group">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-sm text-white font-black italic">{entry.weight} <span className="text-[10px] not-italic text-slate-600 uppercase">kg</span></span>
                                                        <span className="text-[9px] font-bold text-slate-600 uppercase">{new Date(entry.date).toLocaleDateString()}</span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => deleteWeightLog(entry.id)}
                                                        className="text-slate-600 hover:text-red-400 transition-all p-1 active:scale-90"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <Ruler size={12} /> {t('profile.height')}
                                </label>
                                <input
                                    type="number"
                                    name="height"
                                    value={formData.height}
                                    onChange={handleChange}
                                    placeholder="cm"
                                    className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl px-5 py-4 text-white font-bold focus:outline-none focus:border-sky-500 transition-all shadow-inner"
                                />
                            </div>

                            <div className="col-span-1 md:col-span-2 space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <Target size={12} /> {t('profile.goal')}
                                </label>
                                <div className="relative">
                                    <select
                                        name="goal"
                                        value={formData.goal}
                                        onChange={handleChange}
                                        className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl px-5 py-4 text-white font-bold focus:outline-none focus:border-sky-500 transition-all shadow-inner appearance-none"
                                    >
                                        <option value="general-fitness">General Fitness</option>
                                        <option value="muscle-gain">Muscle Gain</option>
                                        <option value="weight-loss">Weight Loss</option>
                                        <option value="strength">Strength Training</option>
                                        <option value="endurance">Endurance</option>
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" size={18} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <Target size={12} /> {t('profile.weeklyGoal')}
                                </label>
                                <input
                                    type="number"
                                    name="weeklyGoal"
                                    value={formData.weeklyGoal}
                                    onChange={handleChange}
                                    min="1"
                                    max="21"
                                    className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl px-5 py-4 text-white font-bold focus:outline-none focus:border-sky-500 transition-all shadow-inner"
                                />
                            </div>
                        </div>

                        <div className="pt-6 flex items-center justify-between relative border-t border-white/5">
                            {isSaved && (
                                <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-xl border border-emerald-500/20 animate-fade-in shadow-lg shadow-emerald-500/10">
                                    <CheckCircle2 size={16} />
                                    <span className="text-xs font-black uppercase tracking-widest">{t('profile.savedSuccess')}</span>
                                </div>
                            )}
                            <button type="submit" className="btn bg-gradient-to-r from-sky-500 to-indigo-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl active:scale-95 ml-auto transition-all">
                                <Save size={18} /> {t('profile.saveChanges')}
                            </button>
                        </div>
                    </form>

                    {token && (
                        <div className="bg-slate-900/40 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/5 space-y-6 animate-fade-in shadow-xl mt-6">
                            <div className="flex items-center gap-4 mb-2">
                                <div className="w-12 h-12 rounded-[1.25rem] bg-slate-800 flex items-center justify-center text-slate-400 shadow-inner">
                                    <Shield size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black italic text-white uppercase tracking-tight leading-tight">{t('profile.security')}</h3>
                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{t('profile.securitySubtitle')}</p>
                                </div>
                            </div>

                            <form onSubmit={handleSecurityUpdate} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                        <HelpCircle size={12} /> {t('auth.securityQuestion')}
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={securityData.question}
                                            onChange={(e) => setSecurityData({ ...securityData, question: e.target.value })}
                                            className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl px-5 py-4 text-white font-bold focus:outline-none focus:border-sky-500 transition-all shadow-inner appearance-none"
                                        >
                                            {SECURITY_QUESTIONS.map((qKey) => (
                                                <option key={qKey} value={qKey} className="bg-slate-800 text-white">
                                                    {t(`auth.securityQuestions.${qKey}`)}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" size={18} />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                        <Lock size={12} /> {t('auth.securityAnswer')}
                                    </label>
                                    <input
                                        type="text"
                                        value={securityData.answer}
                                        onChange={(e) => setSecurityData({ ...securityData, answer: e.target.value })}
                                        placeholder={t('auth.enterAnswer')}
                                        className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl px-5 py-4 text-white font-bold focus:outline-none focus:border-sky-500 transition-all shadow-inner"
                                    />
                                </div>

                                <div className="flex items-center justify-end gap-4">
                                    {securityStatus === 'success' && (
                                        <span className="text-emerald-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 animate-fade-in">
                                            <CheckCircle2 size={14} /> {t('profile.securityUpdated')}
                                        </span>
                                    )}
                                    <button
                                        type="submit"
                                        disabled={!securityData.answer || securityStatus === 'loading'}
                                        className="px-6 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl border border-white/5 font-black uppercase tracking-widest text-[10px] transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {t('profile.updateSecurity')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </>
            ) : activeTab === 'data' ? (
                <>
                    <div className="bg-slate-900/40 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/5 space-y-8 animate-fade-in shadow-xl">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="w-12 h-12 rounded-[1.25rem] bg-sky-500/10 flex items-center justify-center text-sky-500 shadow-inner">
                                <Cloud size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black italic text-white uppercase tracking-tight leading-tight">{t('profile.cloudSync')}</h3>
                                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{t('profile.syncSubtitle')}</p>
                            </div>
                        </div>

                        {!token ? (
                            <Auth onLogin={login} />
                        ) : (
                            <div className="bg-slate-950/40 rounded-3xl p-6 border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="flex items-center gap-5">
                                    <div className="w-16 h-16 rounded-2xl bg-indigo-500 flex items-center justify-center text-white font-black italic text-2xl shadow-xl transform rotate-3">
                                        {user?.username?.[0]?.toUpperCase()}
                                    </div>
                                    <div>
                                        <h4 className="text-white font-black italic uppercase text-lg">{user?.username}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={clsx(
                                                "w-2 h-2 rounded-full",
                                                (syncStatus === 'success' || syncStatus === 'idle') ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" :
                                                    syncStatus === 'syncing' ? "bg-amber-500 animate-pulse" :
                                                        "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                                            )} />
                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                                {(syncStatus === 'success' || syncStatus === 'idle') ? t('profile.synced') :
                                                    syncStatus === 'syncing' ? t('profile.syncing') :
                                                        <span className="text-red-400 flex items-center gap-3">
                                                            {t('profile.syncError')}
                                                            <button
                                                                onClick={() => syncData()}
                                                                className="bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-1 rounded-full border border-red-500/20 transition-all flex items-center gap-1.5"
                                                            >
                                                                <RefreshCw size={10} /> {t('profile.retry')}
                                                            </button>
                                                        </span>
                                                }
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={logout}
                                    className="px-6 py-3 bg-slate-800 hover:bg-red-500/10 hover:text-red-400 text-slate-400 rounded-2xl border border-white/5 transition-all flex items-center gap-2 font-black uppercase tracking-widest text-[10px] active:scale-95"
                                >
                                    <LogOut size={16} /> {t('profile.signOut')}
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="bg-slate-900/40 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/5 space-y-8 animate-fade-in shadow-xl mt-6">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="w-12 h-12 rounded-[1.25rem] bg-slate-800 flex items-center justify-center text-slate-400 shadow-inner">
                                <Save size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black italic text-white uppercase tracking-tight leading-tight">{t('profile.dataManagement')}</h3>
                                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{t('profile.backupSubtitle')}</p>
                            </div>
                        </div>

                        <div className="bg-sky-500/10 p-6 rounded-3xl border border-sky-500/20 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                <Download size={80} className="text-sky-400" />
                            </div>
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 rounded-2xl bg-sky-500 flex items-center justify-center text-white shadow-xl shadow-sky-500/20">
                                        <Download size={28} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black italic text-white uppercase tracking-tight">{t('profile.installApp')}</h3>
                                        <p className="text-[9px] font-bold text-sky-200/60 uppercase tracking-wider leading-relaxed max-w-[200px]">
                                            {deferredPrompt
                                                ? t('profile.appInstallSubtitle')
                                                : "To install: Tap browser menu (⋮) → 'Install App' or 'Add to Home Screen'."}
                                        </p>
                                    </div>
                                </div>
                                {deferredPrompt && (
                                    <button
                                        onClick={handleInstallClick}
                                        className="w-full md:w-auto px-8 py-4 bg-white text-sky-600 hover:bg-sky-50 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl transition-all transform hover:scale-105 active:scale-95"
                                    >
                                        {t('profile.installApp')}
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-6 rounded-[2rem] bg-slate-950/40 border border-white/5 space-y-4 group hover:border-sky-500/30 transition-all">
                                <div className="flex items-center gap-3 text-sky-400 mb-2">
                                    <FileDown size={20} />
                                    <h4 className="font-black italic uppercase tracking-tight text-white">{t('profile.exportBackup')}</h4>
                                </div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide leading-relaxed">
                                    {t('profile.exportSubtitle')}
                                </p>
                                <button
                                    onClick={handleExport}
                                    className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl border border-white/5 transition-all flex items-center justify-center gap-2 font-black uppercase tracking-widest text-[10px] active:scale-95 shadow-lg"
                                >
                                    <FileDown size={16} /> {t('profile.downloadJson')}
                                </button>
                            </div>

                            <div className="p-6 rounded-[2rem] bg-slate-950/40 border border-white/5 space-y-4 group hover:border-emerald-500/30 transition-all">
                                <div className="flex items-center gap-3 text-emerald-400 mb-2">
                                    <Upload size={20} />
                                    <h4 className="font-black italic uppercase tracking-tight text-white">{t('profile.importBackup')}</h4>
                                </div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide leading-relaxed">
                                    {t('profile.importSubtitle')}
                                </p>
                                <label className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl border border-white/5 transition-all flex items-center justify-center gap-2 font-black uppercase tracking-widest text-[10px] cursor-pointer active:scale-95 shadow-lg">
                                    <Upload size={16} /> {t('profile.selectFile')}
                                    <input
                                        type="file"
                                        accept=".json"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                        </div>
                    </div>


                    {showImportConfirm && (
                        <Portal>
                            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-fade-in">
                                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md relative">
                                    <button
                                        onClick={() => {
                                            setShowImportConfirm(false);
                                            setImportFile(null);
                                            setImportError(null);
                                        }}
                                        className="absolute top-4 right-4 text-slate-400 hover:text-white"
                                    >
                                        <X size={24} />
                                    </button>

                                    <div className="flex flex-col items-center text-center mb-6">
                                        <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 mb-4">
                                            <AlertTriangle size={32} />
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-2">{t('planner.overwriteWarning')}</h3>
                                        <p className="text-slate-400 text-sm">
                                            {t('planner.overwriteMessage')}
                                        </p>
                                    </div>

                                    {importError && (
                                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
                                            {importError}
                                        </div>
                                    )}

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => {
                                                setShowImportConfirm(false);
                                                setImportFile(null);
                                                setImportError(null);
                                            }}
                                            className="flex-1 py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                                        >
                                            {t('planner.cancel')}
                                        </button>
                                        <button
                                            onClick={confirmImport}
                                            className="flex-1 py-2 px-4 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-medium"
                                        >
                                            {t('planner.yesOverwrite')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </Portal>
                    )}
                </>
            ) : (
                <Analytics />
            )
            }
        </div >
    );
};

export default Profile;
