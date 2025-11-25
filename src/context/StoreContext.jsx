import React, { createContext, useContext, useState, useEffect } from 'react';

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
                    history: Array.isArray(parsed.history) ? parsed.history : INITIAL_DATA.history
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
                [activeProfileId]: [...(prev.workouts[activeProfileId] || []), { ...workout, id: crypto.randomUUID() }]
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
            history: [...prev.history, { ...session, id: crypto.randomUUID(), profileId: activeProfileId, date: new Date().toISOString() }]
        }));
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
            profileDetails: (data.profileDetails && data.profileDetails[activeProfileId]) ? data.profileDetails[activeProfileId] : {},
            updateProfileDetails,
            updateProfileName
        }}>
            {children}
        </StoreContext.Provider>
    );
};

export const useStore = () => useContext(StoreContext);
