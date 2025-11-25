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
    history: []
};

export const StoreProvider = ({ children }) => {
    const [activeProfileId, setActiveProfileId] = useState('user1');
    const [data, setData] = useState(() => {
        const saved = localStorage.getItem('duogym-data');
        return saved ? JSON.parse(saved) : INITIAL_DATA;
    });

    useEffect(() => {
        localStorage.setItem('duogym-data', JSON.stringify(data));
    }, [data]);

    const activeProfile = data.profiles.find(p => p.id === activeProfileId);

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

    return (
        <StoreContext.Provider value={{
            activeProfileId,
            activeProfile,
            profiles: data.profiles,
            workouts: data.workouts[activeProfileId] || [],
            history: data.history.filter(h => h.profileId === activeProfileId),
            switchProfile,
            addWorkout,
            deleteWorkout,
            logSession
        }}>
            {children}
        </StoreContext.Provider>
    );
};

export const useStore = () => useContext(StoreContext);
