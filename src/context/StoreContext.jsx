import React, { createContext, useContext, useState, useEffect } from 'react';
import { generateUUID } from '../utils/uuid';

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

    const [token, setToken] = useState(() => localStorage.getItem('duogym-token'));
    const [user, setUser] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('duogym-user'));
        } catch {
            return null;
        }
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

    useEffect(() => {
        if (activeWorkout) {
            localStorage.setItem('duogym-active-workout', JSON.stringify(activeWorkout));
        } else {
            localStorage.removeItem('duogym-active-workout');
        }
    }, [activeWorkout]);

    // Sync Logic
    const reconcileWorkoutsWithHistory = (currentData) => {
        const newData = { ...currentData };
        const history = newData.history || [];
        const profiles = newData.profiles || [];

        let hasChanges = false;

        profiles.forEach(profile => {
            const profileId = profile.id;
            const userHistory = history.filter(h => h.profileId === profileId);
            const userWorkouts = (newData.workouts && newData.workouts[profileId]) || [];

            // Map workoutId -> latest history date
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
                    return {
                        ...w,
                        lastPerformed: new Date(latestDate).toISOString(),
                        // Optional: Recalculate usage count?
                        // usageCount: userHistory.filter(h => h.workoutId === w.id).length
                    };
                }
                return w;
            });

            if (newData.workouts) {
                newData.workouts[profileId] = updatedWorkouts;
            }
        });

        return { data: newData, hasChanges };
    };

    const syncData = async (authToken = token) => {
        if (!authToken) return;
        setSyncStatus('syncing');

        // Self-heal before syncing to ensure we send correct data
        let currentLocalData = data;
        const { data: healedData, hasChanges } = reconcileWorkoutsWithHistory(currentLocalData);
        if (hasChanges) {
            console.log("Self-healing applied: Updated stale workout dates from history.");
            setData(healedData);
            currentLocalData = healedData;
        }

        try {
            // 1. Fetch latest from server
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
                // Merge/Replace strategy: Server wins for now to ensure consistency
                // Merge/Replace strategy: Merge history/weightHistory to preserve local changes, replace others
                setData(prev => {
                    const mergeArrays = (local, server) => {
                        const serverIds = new Set(server.map(i => i.id));
                        const localUnique = local.filter(i => !serverIds.has(i.id));
                        return [...server, ...localUnique];
                    };

                    return {
                        ...prev,
                        ...serverData,
                        // Ensure arrays are arrays and merge them
                        // 1. Merge Profiles
                        profiles: (() => {
                            const serverProfileIds = new Set((serverData.profiles || []).map(p => p.id));
                            const localUniqueProfiles = prev.profiles.filter(p => !serverProfileIds.has(p.id));
                            return [...(serverData.profiles || []), ...localUniqueProfiles];
                        })(),

                        // 2. Merge Workouts (Smart Merge per profile)
                        workouts: (() => {
                            const incomingWorkouts = serverData.workouts || {};
                            const mergedWorkouts = { ...prev.workouts };

                            Object.keys(incomingWorkouts).forEach(profileId => {
                                const serverUserWorkouts = incomingWorkouts[profileId] || [];
                                const localUserWorkouts = mergedWorkouts[profileId] || [];

                                // Map by ID for easier lookup
                                const localMap = new Map(localUserWorkouts.map(w => [w.id, w]));
                                const serverMap = new Map(serverUserWorkouts.map(w => [w.id, w]));

                                // Get all unique IDs
                                const allIds = new Set([...localMap.keys(), ...serverMap.keys()]);
                                const resultArray = [];

                                allIds.forEach(id => {
                                    const local = localMap.get(id);
                                    const server = serverMap.get(id);

                                    if (local && server) {
                                        // Conflict: Compare lastPerformed
                                        const localDate = local.lastPerformed ? new Date(local.lastPerformed).getTime() : 0;
                                        const serverDate = server.lastPerformed ? new Date(server.lastPerformed).getTime() : 0;

                                        if (localDate > serverDate) {
                                            resultArray.push(local); // Keep local (it's newer)
                                        } else if (serverDate > localDate) {
                                            resultArray.push(server); // Keep server (it's newer)
                                        } else {
                                            // Tie-breaker: Usage count
                                            const localCount = local.usageCount || 0;
                                            const serverCount = server.usageCount || 0;
                                            if (localCount >= serverCount) {
                                                resultArray.push(local);
                                            } else {
                                                resultArray.push(server);
                                            }
                                        }
                                    } else if (local) {
                                        resultArray.push(local); // Local only
                                    } else if (server) {
                                        resultArray.push(server); // Server only
                                    }
                                });

                                mergedWorkouts[profileId] = resultArray;
                            });

                            // Ensure we don't lose local-only profiles' workouts
                            // (Already handled by spreading ...prev.workouts initially, 
                            //  but the iteration above only updates profiles present in serverData.
                            //  If serverData doesn't have a profile key, that profile's local workouts remain untouched.)

                            return mergedWorkouts;
                        })(),

                        // 3. Merge Profile Details
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

                        // 4. Merge Arrays
                        history: Array.isArray(serverData.history)
                            ? mergeArrays(prev.history, serverData.history)
                            : prev.history,
                        weightHistory: Array.isArray(serverData.weightHistory)
                            ? mergeArrays(prev.weightHistory, serverData.weightHistory)
                            : prev.weightHistory,
                    };
                });
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
        setSyncStatus('syncing');

        try {
            const response = await fetch('/api/sync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ data: data })
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    console.warn('Auth token invalid/orphaned. Logging out.');
                    logout();
                    return;
                }
                const errorText = await response.text();
                console.error('Push failed details:', errorText);
                throw new Error(`Push failed: ${response.status} - ${errorText}`);
            }

            setSyncStatus('success');
            setTimeout(() => setSyncStatus('idle'), 2000);
        } catch (error) {
            console.error('Push error:', error);
            setSyncStatus('error');
        }
    };

    // Initial Sync on Mount/Login
    useEffect(() => {
        if (token) {
            syncData(token);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    // Auto-push on change (debounced)
    useEffect(() => {
        if (!token) return;

        const timeout = setTimeout(() => {
            pushData(token);
        }, 2000); // Debounce 2s

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
                    w.id === updatedWorkout.id ? {
                        ...w,
                        ...updatedWorkout,
                        // Explicitly preserve stats if not provided in update
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
            // 1. Add to history
            const newHistory = [...prev.history, { ...session, id: generateUUID(), profileId: activeProfileId, date: new Date().toISOString() }];

            // 2. Update workout stats (lastPerformed, usageCount)
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
