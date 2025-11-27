import React, { createContext, useContext, useState, useEffect } from 'react';
import { generateUUID } from '../utils/uuid';

const StoreContext = createContext();

const INITIAL_DATA = {
    profiles: [
        { id: 'user1', name: 'My Profile', theme: 'blue' }
    ],
    workouts: {
        user1: []
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

                    history: Array.isArray(parsed.history) ? parsed.history : INITIAL_DATA.history,
                    weightHistory: Array.isArray(parsed.weightHistory) ? parsed.weightHistory : INITIAL_DATA.weightHistory
                };
            }
        } catch (e) {
            console.error("Failed to load data", e);
        }
        return INITIAL_DATA;
    });

    const [token, setToken] = useState(() => localStorage.getItem('duogym-token'));
    const [user, setUser] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('duogym-user'));
        } catch {
            return null;
        }
    });
    const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, error, success

    useEffect(() => {
        localStorage.setItem('duogym-data', JSON.stringify(data));
    }, [data]);

    useEffect(() => {
        if (token) {
            localStorage.setItem('duogym-token', token);
        } else {
            localStorage.removeItem('duogym-token');
        }
    }, [token]);

    useEffect(() => {
        if (user) {
            localStorage.setItem('duogym-user', JSON.stringify(user));
        } else {
            localStorage.removeItem('duogym-user');
        }
    }, [user]);

    // Sync Logic
    const syncData = async (authToken = token) => {
        if (!authToken) return;
        setSyncStatus('syncing');

        try {
            // 1. Fetch latest from server
            const response = await fetch('/api/sync', {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });

            if (!response.ok) throw new Error('Sync failed');

            const { data: serverData } = await response.json();

            if (serverData && Object.keys(serverData).length > 0) {
                // Merge/Replace strategy: Server wins for now to ensure consistency
                setData(prev => ({
                    ...prev,
                    ...serverData,
                    // Ensure arrays are arrays
                    profiles: Array.isArray(serverData.profiles) ? serverData.profiles : prev.profiles,
                    history: Array.isArray(serverData.history) ? serverData.history : prev.history,
                    weightHistory: Array.isArray(serverData.weightHistory) ? serverData.weightHistory : prev.weightHistory,
                }));
            } else {
                // If server is empty, push local data
                await pushData(authToken);
            }
            setSyncStatus('success');
            setTimeout(() => setSyncStatus('idle'), 2000);
        } catch (error) {
            console.error('Sync error:', error);
            setSyncStatus('error');
        }
    };

    const pushData = async (authToken = token) => {
        if (!authToken) return;

        try {
            await fetch('/api/sync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ data: data })
            });
        } catch (error) {
            console.error('Push error:', error);
        }
    };

    // Initial Sync on Mount/Login
    useEffect(() => {
        if (token) {
            syncData(token);
        }
    }, [token]);

    // Auto-push on change (debounced)
    useEffect(() => {
        if (!token) return;

        const timeout = setTimeout(() => {
            pushData(token);
        }, 2000); // Debounce 2s

        return () => clearTimeout(timeout);
    }, [data, token]);

    // Polling every 30s
    useEffect(() => {
        if (!token) return;

        const interval = setInterval(() => {
            syncData(token);
        }, 30000);

        return () => clearInterval(interval);
    }, [token]);

    const login = (authData) => {
        setToken(authData.token);
        setUser(authData.user);
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        setSyncStatus('idle');
    };

    const activeProfile = (Array.isArray(data.profiles) ? data.profiles.find(p => p.id === activeProfileId) : null) || INITIAL_DATA.profiles[0];



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
            importData,
            token,
            user,
            login,
            logout,
            syncStatus,
            syncData
        }}>
            {children}
        </StoreContext.Provider>
    );
};

export const useStore = () => useContext(StoreContext);
