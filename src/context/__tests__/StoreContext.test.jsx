
import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StoreProvider, useStore } from '../StoreContext';

// Mock generateUUID to have predictable but unique IDs
let uuidCounter = 0;
vi.mock('../../utils/uuid', () => ({
    generateUUID: () => {
        uuidCounter += 1;
        return `uuid-${uuidCounter}`;
    }
}));

// Mock API calls
window.fetch = vi.fn();

describe('StoreContext Logic', () => {
    beforeEach(() => {
        uuidCounter = 0;
        vi.clearAllMocks();
        localStorage.clear();
        window.fetch.mockResolvedValue({
            ok: true,
            json: async () => ({ data: {} })
        });
    });

    const wrapper = ({ children }) => <StoreProvider>{children}</StoreProvider>;

    it('initializes with default data', () => {
        const { result } = renderHook(() => useStore(), { wrapper });
        expect(result.current.activeProfile.id).toBe('user1');
        expect(result.current.history).toEqual([]);
    });

    it('logSession adds history entry and updates workout stats', async () => {
        const { result } = renderHook(() => useStore(), { wrapper });

        // First add a workout
        const workout = { id: 'w1', name: 'Leg Day', exercises: [] };

        await act(async () => {
            result.current.addWorkout(workout);
        });

        // Log a session for this workout (workout gets uuid-1)
        const session = { workoutId: 'uuid-1', duration: 3600, exercises: [] };

        await act(async () => {
            result.current.logSession(session);
        });

        // Check history
        expect(result.current.history).toHaveLength(1);
        expect(result.current.history[0].workoutId).toBe('uuid-1');

        // Check stats update
        const updatedWorkout = result.current.workouts.find(w => w.id === 'uuid-1');
        expect(updatedWorkout.usageCount).toBe(1);
        expect(updatedWorkout.lastPerformed).toBeDefined();
    });

    it('logWeight adds entry and updates profile weight', async () => {
        const { result } = renderHook(() => useStore(), { wrapper });

        await act(async () => {
            result.current.logWeight(80.5);
        });

        expect(result.current.weightHistory).toHaveLength(1);
        expect(result.current.weightHistory[0].weight).toBe(80.5);
        expect(result.current.profileDetails.weight).toBe(80.5);
    });

    it('deleteWeightLog removes entry and reverts to latest weight', async () => {
        const { result } = renderHook(() => useStore(), { wrapper });

        // Add two weight logs
        await act(async () => {
            result.current.logWeight(80); // uuid-1, date T
        });

        // Advance time slightly to ensure order if sorts by date, 
        // but our mock date is fast. Store uses new Date().toISOString().
        // We'll rely on insertion order or mocking Date if needed.
        // Let's assume sequential calls have different timestamps implicitly or just insertion order.
        await new Promise(r => setTimeout(r, 10));

        await act(async () => {
            result.current.logWeight(85); // uuid-2
        });

        expect(result.current.profileDetails.weight).toBe(85);

        // Delete the latest one (uuid-2)
        await act(async () => {
            result.current.deleteWeightLog('uuid-2');
        });

        expect(result.current.weightHistory).toHaveLength(1);
        expect(result.current.weightHistory[0].weight).toBe(80);
        // Should revert current profile weight to 80
        expect(result.current.profileDetails.weight).toBe(80);
    });

    it('importData validates and replaces state', () => {
        const { result } = renderHook(() => useStore(), { wrapper });

        const backupData = {
            data: {
                profiles: [{ id: 'user1', name: 'Imported User' }],
                history: [],
                workouts: {},
                weightHistory: []
            }
        };

        const jsonString = JSON.stringify(backupData);
        let res;
        act(() => {
            res = result.current.importData(jsonString);
        });

        expect(res.success).toBe(true);
        expect(result.current.profiles[0].name).toBe('Imported User');
    });

    it('importData handles invalid JSON', () => {
        const { result } = renderHook(() => useStore(), { wrapper });

        let res;
        act(() => {
            res = result.current.importData('invalid-json');
        });

        expect(res.success).toBe(false);
    });
    it('syncData preserves local workouts that are not on server', async () => {
        const { result } = renderHook(() => useStore(), { wrapper });

        // 1. Setup initial state with a local workout
        const localWorkout = { id: 'local-w1', name: 'Local Only', exercises: [] };
        await act(async () => {
            result.current.addWorkout(localWorkout);
        });

        // 2. Mock Server Data (empty workouts for this user)
        const serverData = {
            workouts: {
                user1: [] // Server knows of no workouts
            }
        };

        window.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: serverData })
        });

        // 3. Trigger Sync
        await act(async () => {
            await result.current.syncData('mock-token');
        });

        // 4. Assert local workout still exists
        // Note: addWorkout generates a UUID, so we check by name or existence
        const workouts = result.current.workouts;
        expect(workouts.length).toBeGreaterThan(0);
        expect(workouts.some(w => w.name === 'Local Only')).toBe(true);
    });
});
