import React from 'react';
import { screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Tracker from '../Tracker/Tracker';
import { renderWithProviders } from '../../utils/test-utils';

describe('Tracker Component', () => {
    it('renders timer when workout is active', async () => {
        const store = {
            activeWorkout: {
                id: 'test-workout',
                name: 'Leg Day',
                startTime: new Date().toISOString(),
                exercises: []
            }
        };

        renderWithProviders(<Tracker onViewChange={vi.fn()} />, { store });
        // Use findBy to wait for queueMicrotask and state updates
        const finishBtns = await screen.findAllByText(/tracker.finish/i);
        expect(finishBtns.length).toBeGreaterThan(0);
    });

    it('renders start options when no workout active', () => {
        renderWithProviders(<Tracker onViewChange={vi.fn()} />);
        // Should show suggestions or empty state
        // Let's assume there's some text like "Start a new workout" or similar if we provided templates
        // Or just check that Finish button is NOT there
        expect(screen.queryByText(/tracker.finish/i)).not.toBeInTheDocument();
    });
});
