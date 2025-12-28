import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { Save, User, Ruler, Weight, Calendar, Target, TrendingUp, Settings, Trash2, CheckCircle2, FileDown, Upload, AlertTriangle, X, Cloud, LogOut, RefreshCw, Database, Shield, HelpCircle, Lock, Download } from 'lucide-react';
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
        <div className="max-w-4xl mx-auto space-y-6">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                    <h2 className="text-xl font-bold text-white">{t('profile.title')}</h2>
                </div>

                <div className="flex bg-slate-800/50 p-1 rounded-xl border border-slate-700/50 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('details')}
                        className={clsx(
                            "px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all whitespace-nowrap",
                            activeTab === 'details' ? "bg-slate-700 text-white shadow-sm" : "text-slate-400 hover:text-white"
                        )}
                    >
                        <Settings size={14} /> {t('profile.details')}
                    </button>
                    <button
                        onClick={() => setActiveTab('analytics')}
                        className={clsx(
                            "px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all whitespace-nowrap",
                            activeTab === 'analytics' ? "bg-sky-500 text-white shadow-lg shadow-sky-500/20" : "text-slate-400 hover:text-white"
                        )}
                    >
                        <TrendingUp size={14} /> {t('profile.analytics')}
                    </button>
                    <button
                        onClick={() => setActiveTab('data')}
                        className={clsx(
                            "px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all whitespace-nowrap",
                            activeTab === 'data' ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" : "text-slate-400 hover:text-white"
                        )}
                    >
                        <Database size={14} /> {t('profile.data')}
                    </button>
                </div>
            </header>

            {activeTab === 'details' ? (
                <>
                    <form onSubmit={handleSubmit} className="glass-card space-y-6 animate-fade-in">
                        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-800">
                            <div className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-lg ${activeProfile.theme === 'blue' ? 'bg-sky-500 shadow-sky-500/20' : 'bg-indigo-500 shadow-indigo-500/20'
                                }`}>
                                {activeProfile.name[0]}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">{activeProfile.name}</h3>
                                <p className="text-slate-400">{t('profile.memberSince')} 2025</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="col-span-1 md:col-span-2 space-y-2">
                                <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                                    <User size={16} /> {t('profile.name')}
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Your Name"
                                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sky-500 transition-colors"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                                    <Calendar size={16} /> {t('profile.age')}
                                </label>
                                <input
                                    type="number"
                                    name="age"
                                    value={formData.age}
                                    onChange={handleChange}
                                    placeholder="Years"
                                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sky-500 transition-colors"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                                    <User size={16} /> {t('profile.gender')}
                                </label>
                                <select
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleChange}
                                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sky-500 transition-colors appearance-none"
                                >
                                    <option value="prefer-not-to-say">Prefer not to say</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                                    <Weight size={16} /> {t('profile.weight')}
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        name="weight"
                                        value={formData.weight}
                                        onChange={handleChange}
                                        placeholder="kg"
                                        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sky-500 transition-colors"
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
                                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors whitespace-nowrap"
                                    >
                                        {t('profile.logEntry')}
                                    </button>
                                </div>

                                {/* Recent History */}
                                {weightHistory && weightHistory.length > 0 && (
                                    <div className="mt-3 space-y-2">
                                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{t('profile.recentEntries')}</p>
                                        <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                                            {[...weightHistory].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5).map(entry => (
                                                <div key={entry.id} className="flex justify-between items-center bg-slate-800/30 px-3 py-2 rounded-lg border border-slate-700/30 group">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm text-white font-mono">{entry.weight} kg</span>
                                                        <span className="text-xs text-slate-500">{new Date(entry.date).toLocaleDateString()}</span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => deleteWeightLog(entry.id)}
                                                        className="text-slate-500 hover:text-red-400 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all p-1"
                                                        title="Delete Entry"
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
                                <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                                    <Ruler size={16} /> {t('profile.height')}
                                </label>
                                <input
                                    type="number"
                                    name="height"
                                    value={formData.height}
                                    onChange={handleChange}
                                    placeholder="cm"
                                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sky-500 transition-colors"
                                />
                            </div>

                            <div className="col-span-1 md:col-span-2 space-y-2">
                                <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                                    <Target size={16} /> {t('profile.goal')}
                                </label>
                                <select
                                    name="goal"
                                    value={formData.goal}
                                    onChange={handleChange}
                                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sky-500 transition-colors appearance-none"
                                >
                                    <option value="general-fitness">General Fitness</option>
                                    <option value="muscle-gain">Muscle Gain</option>
                                    <option value="weight-loss">Weight Loss</option>
                                    <option value="strength">Strength Training</option>
                                    <option value="endurance">Endurance</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                                    <Target size={16} /> {t('profile.weeklyGoal')}
                                </label>
                                <input
                                    type="number"
                                    name="weeklyGoal"
                                    value={formData.weeklyGoal}
                                    onChange={handleChange}
                                    min="1"
                                    max="21"
                                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sky-500 transition-colors"
                                />
                            </div>
                        </div>

                        <div className="pt-4 flex items-center justify-between relative">
                            {isSaved && (
                                <div className="absolute left-0 -top-12 md:static md:top-auto flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-lg border border-emerald-500/20 animate-fade-in shadow-lg shadow-emerald-500/10">
                                    <CheckCircle2 size={18} />
                                    <span className="text-sm font-medium">{t('profile.savedSuccess')}</span>
                                </div>
                            )}
                            <button type="submit" className="btn btn-primary ml-auto">
                                <Save size={18} /> {t('profile.saveChanges')}
                            </button>
                        </div>
                    </form>

                    {/* Security Section - Only visible when logged in */}
                    {token && (
                        <div className="glass-card space-y-6 animate-fade-in mt-6">
                            <div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-800">
                                <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
                                    <Shield size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">{t('profile.security')}</h3>
                                    <p className="text-slate-400">{t('profile.securitySubtitle')}</p>
                                </div>
                            </div>

                            <form onSubmit={handleSecurityUpdate} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                                        <HelpCircle size={16} /> {t('auth.securityQuestion')}
                                    </label>
                                    <select
                                        value={securityData.question}
                                        onChange={(e) => setSecurityData({ ...securityData, question: e.target.value })}
                                        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sky-500 transition-colors appearance-none"
                                    >
                                        {SECURITY_QUESTIONS.map((qKey) => (
                                            <option key={qKey} value={qKey} className="bg-slate-800 text-white">
                                                {t(`auth.securityQuestions.${qKey}`)}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                                        <Lock size={16} /> {t('auth.securityAnswer')}
                                    </label>
                                    <input
                                        type="text"
                                        value={securityData.answer}
                                        onChange={(e) => setSecurityData({ ...securityData, answer: e.target.value })}
                                        placeholder={t('auth.enterAnswer')}
                                        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sky-500 transition-colors"
                                    />
                                </div>

                                <div className="flex items-center justify-end gap-3">
                                    {securityStatus === 'success' && (
                                        <span className="text-emerald-400 text-sm flex items-center gap-1 animate-fade-in">
                                            <CheckCircle2 size={16} /> {t('profile.securityUpdated')}
                                        </span>
                                    )}
                                    {securityStatus === 'error' && (
                                        <span className="text-red-400 text-sm flex items-center gap-1 animate-fade-in">
                                            <AlertTriangle size={16} /> {t('common.error')}
                                        </span>
                                    )}
                                    <button
                                        type="submit"
                                        disabled={!securityData.answer || securityStatus === 'loading'}
                                        className="btn btn-secondary"
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
                    <div className="glass-card space-y-6 animate-fade-in">
                        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-800">
                            <div className="w-12 h-12 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-500">
                                <Cloud size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">{t('profile.cloudSync')}</h3>
                                <p className="text-slate-400">{t('profile.syncSubtitle')}</p>
                            </div>
                        </div>

                        {!token ? (
                            <Auth onLogin={login} />
                        ) : (
                            <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/30 flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-xl">
                                        {user?.username?.[0]?.toUpperCase()}
                                    </div>
                                    <div>
                                        <h4 className="text-white font-bold text-lg">{t('profile.loggedInAs')} {user?.username}</h4>
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className={clsx(
                                                "w-2 h-2 rounded-full",
                                                (syncStatus === 'success' || syncStatus === 'idle') ? "bg-emerald-500" :
                                                    syncStatus === 'syncing' ? "bg-amber-500 animate-pulse" :
                                                        "bg-red-500"
                                            )} />
                                            <span className="text-slate-400">
                                                {(syncStatus === 'success' || syncStatus === 'idle') ? t('profile.synced') :
                                                    syncStatus === 'syncing' ? t('profile.syncing') :
                                                        <span className="text-red-400 flex items-center gap-2">
                                                            {t('profile.syncError')}
                                                            <button
                                                                onClick={() => syncData()}
                                                                className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 px-2 py-1 rounded border border-red-500/20 transition-colors flex items-center gap-1"
                                                            >
                                                                <RefreshCw size={12} /> {t('profile.retry')}
                                                            </button>
                                                        </span>
                                                }
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={logout}
                                    className="px-4 py-2 bg-slate-800 hover:bg-red-500/10 hover:text-red-400 text-slate-400 rounded-lg border border-slate-700 hover:border-red-500/30 transition-all flex items-center gap-2"
                                >
                                    <LogOut size={18} /> {t('profile.signOut')}
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="glass-card space-y-6 animate-fade-in">
                        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-800">
                            <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
                                <Save size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">{t('profile.dataManagement')}</h3>
                                <p className="text-slate-400">{t('profile.backupSubtitle')}</p>
                            </div>
                        </div>

                        <div className="glass-card mb-6 animate-fade-in border-sky-500/30 bg-sky-500/5">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-sky-500 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
                                        <Download size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">{t('profile.installApp')}</h3>
                                        <p className="text-slate-400">
                                            {deferredPrompt
                                                ? t('profile.appInstallSubtitle')
                                                : "To install: Tap browser menu (⋮) → 'Install App' or 'Add to Home Screen'."}
                                        </p>
                                    </div>
                                </div>
                                {deferredPrompt && (
                                    <button
                                        onClick={handleInstallClick}
                                        className="w-full md:w-auto px-6 py-3 bg-sky-500 hover:bg-sky-400 text-white rounded-xl font-bold shadow-lg shadow-sky-500/20 transition-all transform hover:scale-105"
                                    >
                                        {t('profile.installApp')}
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30 space-y-3">
                                <div className="flex items-center gap-3 text-sky-400 mb-2">
                                    <FileDown size={20} />
                                    <h4 className="font-bold text-white">{t('profile.exportBackup')}</h4>
                                </div>
                                <p className="text-sm text-slate-400">
                                    {t('profile.exportSubtitle')}
                                </p>
                                <button
                                    onClick={handleExport}
                                    className="w-full py-2 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    <FileDown size={16} /> {t('profile.downloadJson')}
                                </button>
                            </div>

                            <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30 space-y-3">
                                <div className="flex items-center gap-3 text-emerald-400 mb-2">
                                    <Upload size={20} />
                                    <h4 className="font-bold text-white">{t('profile.importBackup')}</h4>
                                </div>
                                <p className="text-sm text-slate-400">
                                    {t('profile.importSubtitle')}
                                </p>
                                <label className="w-full py-2 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-700 transition-colors flex items-center justify-center gap-2 cursor-pointer">
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
