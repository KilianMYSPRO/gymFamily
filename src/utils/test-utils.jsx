import React from 'react';
import { render } from '@testing-library/react';
import { vi } from 'vitest';
import { StoreContext } from '../context/StoreContext';
import { AuthContext } from '../context/AuthContext';
import { LanguageContext } from '../context/LanguageContext';
import { DuoContext } from '../context/DuoContext';

const mockAuth = {
    token: 'test-token',
    user: { id: 'test-user', username: 'TestUser' },
    login: vi.fn(),
    logout: vi.fn(),
    isAuthenticated: true
};

const mockStore = {
    workouts: [],
    history: [],
    activeProfile: { id: 'test', name: 'Test User' },
    activeWorkout: null,
    addWorkout: vi.fn(),
    updateWorkout: vi.fn(),
    deleteWorkout: vi.fn(),
    setActiveWorkout: vi.fn(),
    logSession: vi.fn(),
    getWeeklyActivity: vi.fn().mockReturnValue([]),
    syncStatus: 'idle',
    syncData: vi.fn()
};

const mockLanguage = {
    t: (key) => key,
    language: 'en',
    toggleLanguage: vi.fn()
};

const mockDuo = {
    isConnected: false,
    partner: null,
    broadcastUpdate: vi.fn()
};

export const renderWithProviders = (ui, { auth = {}, store = {}, language = {}, duo = {} } = {}) => {
    return render(
        <AuthContext.Provider value={{ ...mockAuth, ...auth }}>
            <LanguageContext.Provider value={{ ...mockLanguage, ...language }}>
                <StoreContext.Provider value={{ ...mockStore, ...store }}>
                    <DuoContext.Provider value={{ ...mockDuo, ...duo }}>
                        {ui}
                    </DuoContext.Provider>
                </StoreContext.Provider>
            </LanguageContext.Provider>
        </AuthContext.Provider>
    );
};

