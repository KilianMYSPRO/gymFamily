import React, { createContext, useContext, useState, useEffect } from 'react';
import { generateUUID } from '../utils/uuid';

const StoreContext = createContext();

const INITIAL_DATA = {
    profiles: [
        { id: 'user1', name: 'User A', theme: 'blue' },
        { id: 'user2', name: 'User B', theme: 'indigo' }
    ],
    workouts: {
        user1: [],
        user2: []
    },
    weightHistory: [],
    history: [],
    profileDetails: {
        user1: {
            age: '',
            weight: '',
            height: '',
            gender: 'prefer-not-to-say',
            goal: 'general-fitness',
            weeklyGoal: 3
        },
        user2: {
            age: '',
            weight: '',
            height: '',
            gender: 'prefer-not-to-say',
            goal: 'general-fitness',
            weeklyGoal: 3
        }
    }
};

export const StoreProvider = ({ children }) => {
    const [activeProfileId, setActiveProfileId] = useState('user1');
    const [data, setData] = useState(() => {
        try {
            const saved = localStorage.getItem('duogym-data');
            if (saved) {
                const parsed = JSON.parse(saved);
                return {
                    ...INITIAL_DATA,
                    ...parsed,
                    profiles: Array.isArray(parsed.profiles) ? parsed.profiles : INITIAL_DATA.profiles,
                    workouts: { ...INITIAL_DATA.workouts, ...(parsed.workouts || {}) },
                    profileDetails: { ...INITIAL_DATA.profileDetails, ...(parsed.profileDetails || {}) },
                    profileDetails: { ...INITIAL_DATA.profileDetails, ...(parsed.profileDetails || {}) },
                    history: Array.isArray(parsed.history) ? parsed.history : INITIAL_DATA.history,
                    weightHistory: Array.isArray(parsed.weightHistory) ? parsed.weightHistory : INITIAL_DATA.weightHistory
                };
            }
        } catch (e) {
            console.error("Failed to load data", e);
        }
        return INITIAL_DATA;
    });

    useEffect(() => {
        localStorage.setItem('duogym-data', JSON.stringify(data));
    }, [data]);

    const activeProfile = (Array.isArray(data.profiles) ? data.profiles.find(p => p.id === activeProfileId) : null) || INITIAL_DATA.profiles[0];

    const switchProfile = (id) => {
        setActiveProfileId(id);
    };

    const addWorkout = (workout) => {
        setData(prev => ({
            ...prev,
            workouts: {
                ...prev.workouts,
                [activeProfileId]: [...(prev.workouts[activeProfileId] || []), { ...workout, id: generateUUID() }]
            }
        }));
    };

    const updateWorkout = (updatedWorkout) => {
        setData(prev => ({
            ...prev,
            workouts: {
                ...prev.workouts,
                [activeProfileId]: prev.workouts[activeProfileId].map(w =>
                    w.id === updatedWorkout.id ? updatedWorkout : w
                )
            }
        }));
    };

    const deleteWorkout = (workoutId) => {
        setData(prev => ({
            ...prev,
            workouts: {
                ...prev.workouts,
                [activeProfileId]: prev.workouts[activeProfileId].filter(w => w.id !== workoutId)
            }
        }));
    };

    const logSession = (session) => {
        setData(prev => ({
            ...prev,
            history: [...prev.history, { ...session, id: generateUUID(), profileId: activeProfileId, date: new Date().toISOString() }]
        }));
    };

    const deleteLog = (logId) => {
        setData(prev => ({
            ...prev,
            history: prev.history.filter(h => h.id !== logId)
        }));
    };

    const logWeight = (weight) => {
        const newEntry = {
            id: generateUUID(),
            profileId: activeProfileId,
            date: new Date().toISOString(),
            weight: parseFloat(weight)
        };

        setData(prev => ({
            ...prev,
            weightHistory: [...(prev.weightHistory || []), newEntry],
            profileDetails: {
                ...prev.profileDetails,
                [activeProfileId]: { ...prev.profileDetails[activeProfileId], weight: weight }
            }
        }));
    };

    const deleteWeightLog = (logId) => {
        setData(prev => {
            const newHistory = (prev.weightHistory || []).filter(h => h.id !== logId);

            // Update current weight if the deleted log was the latest one
            const userHistory = newHistory.filter(h => h.profileId === activeProfileId).sort((a, b) => new Date(a.date) - new Date(b.date));
            const latestWeight = userHistory.length > 0 ? userHistory[userHistory.length - 1].weight : '';

            return {
                ...prev,
                weightHistory: newHistory,
                profileDetails: {
                    ...prev.profileDetails,
                    [activeProfileId]: { ...prev.profileDetails[activeProfileId], weight: latestWeight }
                }
            };
        });
    };

    const updateProfileDetails = (details) => {
        setData(prev => ({
            ...prev,
            profileDetails: {
                ...prev.profileDetails,
                [activeProfileId]: { ...prev.profileDetails[activeProfileId], ...details }
            }
        }));
    };

    const updateProfileName = (name) => {
        setData(prev => ({
            ...prev,
            profiles: prev.profiles.map(p =>
                p.id === activeProfileId ? { ...p, name } : p
            )
        }));
    };

    const exportData = () => {
        const exportPayload = {
            version: 1,
            timestamp: new Date().toISOString(),
            data: data // Export the entire data state
        };
        return JSON.stringify(exportPayload, null, 2);
    };

    const importData = (jsonData) => {
        try {
            const parsed = JSON.parse(jsonData);

            // Basic validation
            if (!parsed.data || !parsed.data.profiles) {
                throw new Error("Invalid backup file format");
            }

            // Restore data
            setData(parsed.data);
            return { success: true };
        } catch (error) {
            console.error("Import failed:", error);
            return { success: false, error: error.message };
        }
    };

    return (
        <StoreContext.Provider value={{
            activeProfileId,
            activeProfile,
            profiles: data.profiles || [],
            workouts: (data.workouts && data.workouts[activeProfileId]) ? data.workouts[activeProfileId] : [],
            history: Array.isArray(data.history) ? data.history.filter(h => h.profileId === activeProfileId) : [],
            switchProfile,
            addWorkout,
            updateWorkout,
            deleteWorkout,
            logSession,
            deleteLog,
            logWeight,
            deleteWeightLog,
            weightHistory: Array.isArray(data.weightHistory) ? data.weightHistory.filter(h => h.profileId === activeProfileId) : [],
            profileDetails: (data.profileDetails && data.profileDetails[activeProfileId]) ? data.profileDetails[activeProfileId] : {},
            updateProfileDetails,
            updateProfileName,
            exportData,
            importData
        }}>
            {children}
        </StoreContext.Provider>
    );
};

export const useStore = () => useContext(StoreContext);
