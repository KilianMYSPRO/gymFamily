import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { Save, User, Ruler, Weight, Calendar, Target, TrendingUp, Settings, Trash2, CheckCircle2, FileDown, Upload, AlertTriangle, X, Cloud, LogOut, RefreshCw, Database } from 'lucide-react';
import Portal from '../common/Portal';
import Auth from '../Auth/Auth';
import Analytics from '../Analytics/Analytics';
import clsx from 'clsx';

const Profile = () => {
    const { activeProfile, profileDetails, updateProfileDetails, updateProfileName, logWeight, weightHistory, deleteWeightLog, exportData, importData, token, user, login, logout, syncStatus, syncData } = useStore();
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
        const { name, ...details } = formData;
        updateProfileDetails(details);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
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

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2">My Profile</h2>
                    <p className="text-slate-400">Manage your personal details and track progress.</p>
                </div>

                <div className="flex bg-slate-800/50 p-1 rounded-xl border border-slate-700/50">
                    <button
                        onClick={() => setActiveTab('details')}
                        className={clsx(
                            "px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all",
                            activeTab === 'details' ? "bg-slate-700 text-white shadow-sm" : "text-slate-400 hover:text-white"
                        )}
                    >
                        <Settings size={16} /> Details
                    </button>
                    <button
                        onClick={() => setActiveTab('analytics')}
                        className={clsx(
                            "px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all",
                            activeTab === 'analytics' ? "bg-sky-500 text-white shadow-lg shadow-sky-500/20" : "text-slate-400 hover:text-white"
                        )}
                    >
                        <TrendingUp size={16} /> Analytics
                    </button>
                    <button
                        onClick={() => setActiveTab('data')}
                        className={clsx(
                            "px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all",
                            activeTab === 'data' ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" : "text-slate-400 hover:text-white"
                        )}
                    >
                        <Database size={16} /> Data
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
                                <p className="text-slate-400">Member since 2025</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="col-span-1 md:col-span-2 space-y-2">
                                <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                                    <User size={16} /> Name
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
                                    <Calendar size={16} /> Age
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
                                    <User size={16} /> Gender
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
                                    <Weight size={16} /> Weight (kg)
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
                                        Log Entry
                                    </button>
                                </div>

                                {/* Recent History */}
                                {weightHistory && weightHistory.length > 0 && (
                                    <div className="mt-3 space-y-2">
                                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Recent Entries</p>
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
                                                        className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1"
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
                                    <Ruler size={16} /> Height (cm)
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
                                    <Target size={16} /> Primary Goal
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
                                    <Target size={16} /> Weekly Workout Goal
                                </label>
                                <input
                                    type="number"
                                    name="weeklyGoal"
                                    value={formData.weeklyGoal || 3}
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
                                    <span className="text-sm font-medium">Changes saved successfully!</span>
                                </div>
                            )}
                            <button type="submit" className="btn btn-primary ml-auto">
                                <Save size={18} /> Save Changes
                            </button>
                        </div>
                    </form>
                </>
            ) : activeTab === 'data' ? (
                <>
                    <div className="glass-card space-y-6 animate-fade-in">
                        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-800">
                            <div className="w-12 h-12 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-500">
                                <Cloud size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">Cloud Sync</h3>
                                <p className="text-slate-400">Sync your data across devices.</p>
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
                                        <h4 className="text-white font-bold text-lg">Logged in as {user?.username}</h4>
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className={clsx(
                                                "w-2 h-2 rounded-full",
                                                (syncStatus === 'success' || syncStatus === 'idle') ? "bg-emerald-500" :
                                                    syncStatus === 'syncing' ? "bg-amber-500 animate-pulse" :
                                                        "bg-red-500"
                                            )} />
                                            <span className="text-slate-400">
                                                {(syncStatus === 'success' || syncStatus === 'idle') ? 'Synced' :
                                                    syncStatus === 'syncing' ? 'Syncing...' :
                                                        <span className="text-red-400 flex items-center gap-2">
                                                            Sync Error
                                                            <button
                                                                onClick={() => syncData()}
                                                                className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 px-2 py-1 rounded border border-red-500/20 transition-colors flex items-center gap-1"
                                                            >
                                                                <RefreshCw size={12} /> Retry
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
                                    <LogOut size={18} /> Sign Out
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
                                <h3 className="text-xl font-bold text-white">Data Management</h3>
                                <p className="text-slate-400">Backup or restore your data.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30 space-y-3">
                                <div className="flex items-center gap-3 text-sky-400 mb-2">
                                    <FileDown size={20} />
                                    <h4 className="font-bold text-white">Export Backup</h4>
                                </div>
                                <p className="text-sm text-slate-400">
                                    Download a copy of all your profiles, workouts, and history to your device.
                                </p>
                                <button
                                    onClick={handleExport}
                                    className="w-full py-2 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    <FileDown size={16} /> Download JSON
                                </button>
                            </div>

                            <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30 space-y-3">
                                <div className="flex items-center gap-3 text-emerald-400 mb-2">
                                    <Upload size={20} />
                                    <h4 className="font-bold text-white">Import Backup</h4>
                                </div>
                                <p className="text-sm text-slate-400">
                                    Restore your data from a backup file. This will overwrite current data.
                                </p>
                                <label className="w-full py-2 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-700 transition-colors flex items-center justify-center gap-2 cursor-pointer">
                                    <Upload size={16} /> Select File
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
                                        <h3 className="text-xl font-bold text-white mb-2">Warning: Overwrite Data?</h3>
                                        <p className="text-slate-400 text-sm">
                                            Importing <strong>{importFile?.name}</strong> will completely replace your current profiles, workouts, and history. This action cannot be undone.
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
                                            Cancel
                                        </button>
                                        <button
                                            onClick={confirmImport}
                                            className="flex-1 py-2 px-4 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-medium"
                                        >
                                            Yes, Overwrite
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
