import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { generateUUID } from '../utils/uuid';
import { useAuth } from './AuthContext';

// eslint-disable-next-line react-refresh/only-export-components
export const StoreContext = createContext();

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
    const { token, logout } = useAuth();

    // eslint-disable-next-line no-unused-vars
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

    const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, error, success
    const [activeWorkout, setActiveWorkout] = useState(() => {
        try {
            const saved = localStorage.getItem('duogym-active-workout');
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    });

    // Persist data to localStorage
    useEffect(() => {
        localStorage.setItem('duogym-data', JSON.stringify(data));
    }, [data]);

    // Persist active workout
    useEffect(() => {
        if (activeWorkout) {
            localStorage.setItem('duogym-active-workout', JSON.stringify(activeWorkout));
        } else {
            localStorage.removeItem('duogym-active-workout');
        }
    }, [activeWorkout]);

    // =========== Sync Logic ===========

    const reconcileWorkoutsWithHistory = useCallback((currentData) => {
        const newData = { ...currentData };
        const history = newData.history || [];
        const profiles = newData.profiles || [];

        let hasChanges = false;

        profiles.forEach(profile => {
            const profileId = profile.id;
            const userHistory = history.filter(h => h.profileId === profileId);
            const userWorkouts = (newData.workouts && newData.workouts[profileId]) || [];

            const latestHistoryDates = {};
            userHistory.forEach(h => {
                const wid = h.workoutId;
                const date = new Date(h.date).getTime();
                if (!latestHistoryDates[wid] || date > latestHistoryDates[wid]) {
                    latestHistoryDates[wid] = date;
                }
            });

            const updatedWorkouts = userWorkouts.map(w => {
                const latestDate = latestHistoryDates[w.id];
                const currentLastPerformed = w.lastPerformed ? new Date(w.lastPerformed).getTime() : 0;

                if (latestDate && latestDate > currentLastPerformed) {
                    hasChanges = true;
                    return { ...w, lastPerformed: new Date(latestDate).toISOString() };
                }
                return w;
            });

            if (newData.workouts) {
                newData.workouts[profileId] = updatedWorkouts;
            }
        });

        return { data: newData, hasChanges };
    }, []);

    const pushData = useCallback(async (authToken = token) => {
        if (!authToken) return;
        setSyncStatus('syncing');

        try {
            const response = await fetch('/api/sync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ data })
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    console.warn('Auth token invalid/orphaned. Logging out.');
                    logout();
                    return;
                }
                throw new Error(`Push failed: ${response.status}`);
            }

            setSyncStatus('success');
            setTimeout(() => setSyncStatus('idle'), 2000);
        } catch (error) {
            console.error('Push error:', error);
            setSyncStatus('error');
        }
    }, [token, data, logout]);

    const syncData = useCallback(async (authToken = token) => {
        if (!authToken) return;
        setSyncStatus('syncing');

        // Self-heal before syncing
        const { data: healedData, hasChanges } = reconcileWorkoutsWithHistory(data);
        if (hasChanges) {
            console.log("Self-healing applied: Updated stale workout dates from history.");
            setData(healedData);
        }

        try {
            const response = await fetch('/api/sync', {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    console.warn('Auth token invalid/orphaned. Logging out.');
                    logout();
                    return;
                }
                throw new Error('Sync failed');
            }

            const { data: serverData } = await response.json();

            if (serverData && Object.keys(serverData).length > 0) {
                setData(prev => {
                    const mergeArrays = (local, server) => {
                        const serverIds = new Set(server.map(i => i.id));
                        const localUnique = local.filter(i => !serverIds.has(i.id));
                        return [...server, ...localUnique];
                    };

                    return {
                        ...prev,
                        ...serverData,
                        profiles: (() => {
                            const serverProfileIds = new Set((serverData.profiles || []).map(p => p.id));
                            const localUniqueProfiles = prev.profiles.filter(p => !serverProfileIds.has(p.id));
                            return [...(serverData.profiles || []), ...localUniqueProfiles];
                        })(),
                        workouts: (() => {
                            const incomingWorkouts = serverData.workouts || {};
                            const mergedWorkouts = { ...prev.workouts };

                            Object.keys(incomingWorkouts).forEach(profileId => {
                                const serverUserWorkouts = incomingWorkouts[profileId] || [];
                                const localUserWorkouts = mergedWorkouts[profileId] || [];

                                const localMap = new Map(localUserWorkouts.map(w => [w.id, w]));
                                const serverMap = new Map(serverUserWorkouts.map(w => [w.id, w]));

                                const allIds = new Set([...localMap.keys(), ...serverMap.keys()]);
                                const resultArray = [];

                                allIds.forEach(id => {
                                    const local = localMap.get(id);
                                    const server = serverMap.get(id);

                                    if (local && server) {
                                        const localDate = local.lastPerformed ? new Date(local.lastPerformed).getTime() : 0;
                                        const serverDate = server.lastPerformed ? new Date(server.lastPerformed).getTime() : 0;

                                        if (localDate > serverDate) {
                                            resultArray.push(local);
                                        } else if (serverDate > localDate) {
                                            resultArray.push(server);
                                        } else {
                                            const localCount = local.usageCount || 0;
                                            const serverCount = server.usageCount || 0;
                                            resultArray.push(localCount >= serverCount ? local : server);
                                        }
                                    } else if (local) {
                                        resultArray.push(local);
                                    } else if (server) {
                                        resultArray.push(server);
                                    }
                                });

                                mergedWorkouts[profileId] = resultArray;
                            });

                            return mergedWorkouts;
                        })(),
                        profileDetails: (() => {
                            const incomingDetails = serverData.profileDetails || {};
                            const mergedDetails = { ...prev.profileDetails };

                            Object.keys(incomingDetails).forEach(profileId => {
                                mergedDetails[profileId] = {
                                    ...(mergedDetails[profileId] || {}),
                                    ...incomingDetails[profileId]
                                };
                            });

                            return mergedDetails;
                        })(),
                        history: Array.isArray(serverData.history)
                            ? mergeArrays(prev.history, serverData.history)
                            : prev.history,
                        weightHistory: Array.isArray(serverData.weightHistory)
                            ? mergeArrays(prev.weightHistory, serverData.weightHistory)
                            : prev.weightHistory,
                    };
                });
            } else {
                await pushData(authToken);
            }
            setSyncStatus('success');
            setTimeout(() => setSyncStatus('idle'), 2000);
        } catch (error) {
            console.error('Sync error:', error);
            setSyncStatus('error');
        }
    }, [token, data, logout, reconcileWorkoutsWithHistory, pushData]);

    // Initial Sync on Mount/Login
    useEffect(() => {
        if (token) {
            syncData(token);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    // Auto-push on data change (debounced)
    useEffect(() => {
        if (!token) return;

        const timeout = setTimeout(() => {
            pushData(token);
        }, 2000);

        return () => clearTimeout(timeout);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data, token]);

    // Polling every 30s
    useEffect(() => {
        if (!token) return;

        const interval = setInterval(() => {
            syncData(token);
        }, 30000);

        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    // =========== End Sync Logic ===========

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
                    w.id === updatedWorkout.id ? {
                        ...w,
                        ...updatedWorkout,
                        lastPerformed: updatedWorkout.lastPerformed !== undefined ? updatedWorkout.lastPerformed : w.lastPerformed,
                        usageCount: updatedWorkout.usageCount !== undefined ? updatedWorkout.usageCount : w.usageCount
                    } : w
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
        setData(prev => {
            const newHistory = [...prev.history, { ...session, id: generateUUID(), profileId: activeProfileId, date: new Date().toISOString() }];

            const userWorkouts = prev.workouts[activeProfileId] || [];
            const updatedWorkouts = userWorkouts.map(w => {
                if (w.id === (session.workoutId || session.id)) {
                    return {
                        ...w,
                        lastPerformed: new Date().toISOString(),
                        usageCount: (w.usageCount || 0) + 1
                    };
                }
                return w;
            });

            return {
                ...prev,
                history: newHistory,
                workouts: {
                    ...prev.workouts,
                    [activeProfileId]: updatedWorkouts
                }
            };
        });
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
            data: data
        };
        return JSON.stringify(exportPayload, null, 2);
    };

    const importData = (jsonData) => {
        try {
            const parsed = JSON.parse(jsonData);

            if (!parsed.data || !parsed.data.profiles) {
                throw new Error("Invalid backup file format");
            }

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
            syncStatus,
            syncData,
            activeWorkout,
            setActiveWorkout
        }}>
            {children}
        </StoreContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useStore = () => useContext(StoreContext);
