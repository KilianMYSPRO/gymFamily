import React from 'react';
import { useStore } from '../../context/StoreContext';

const Dashboard = () => {
    const { activeProfile, workouts, history } = useStore();

    return (
        <div className="space-y-6">
            <header>
                <h2 className="text-3xl font-bold text-white mb-2">Welcome back, {activeProfile.name}</h2>
                <p className="text-slate-400">Here's your activity overview.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-6 rounded-2xl">
                    <h3 className="text-slate-400 text-sm font-medium mb-2">Total Workouts</h3>
                    <p className="text-4xl font-bold text-white">{history.length}</p>
                </div>
                <div className="glass-card p-6 rounded-2xl">
                    <h3 className="text-slate-400 text-sm font-medium mb-2">Active Plans</h3>
                    <p className="text-4xl font-bold text-white">{workouts.length}</p>
                </div>
                <div className="glass-card p-6 rounded-2xl">
                    <h3 className="text-slate-400 text-sm font-medium mb-2">Streak</h3>
                    <p className="text-4xl font-bold text-white">0 <span className="text-lg text-slate-500 font-normal">days</span></p>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
