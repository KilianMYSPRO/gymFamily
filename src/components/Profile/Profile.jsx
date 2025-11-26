import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { Save, User, Ruler, Weight, Calendar, Target, TrendingUp, Settings } from 'lucide-react';
import Analytics from '../Analytics/Analytics';
import clsx from 'clsx';

const Profile = () => {
    const { activeProfile, profileDetails, updateProfileDetails, updateProfileName } = useStore();
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
                </div>
            </header>

            {activeTab === 'details' ? (
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
                            <input
                                type="number"
                                name="weight"
                                value={formData.weight}
                                onChange={handleChange}
                                placeholder="kg"
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sky-500 transition-colors"
                            />
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

                    <div className="pt-4 flex items-center justify-between">
                        <div className="text-green-400 text-sm font-medium transition-opacity duration-300" style={{ opacity: isSaved ? 1 : 0 }}>
                            Changes saved successfully!
                        </div>
                        <button type="submit" className="btn btn-primary">
                            <Save size={18} /> Save Changes
                        </button>
                    </div>
                </form>
            ) : (
                <Analytics />
            )}
        </div>
    );
};

export default Profile;
