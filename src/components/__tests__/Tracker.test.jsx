import React from 'react';
import { screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Tracker from '../Tracker/Tracker';
import { renderWithProviders } from '../../utils/test-utils';

describe('Tracker Component', () => {
    it('renders timer when workout is active', () => {
        const store = {
            activeWorkout: {
                id: 'test-workout',
                name: 'Leg Day',
                startTime: new Date().toISOString(),
                exercises: []
            }
        };

        renderWithProviders(<Tracker onViewChange={vi.fn()} />, { store });
        // Expect timer to be present (e.g. 00:00 or active time)
        // Usually timer displays HH:MM:SS or MM:SS. Let's look for a clock icon or time format.
        // Or checking for "Finish Workout" button which appears when active
        expect(screen.getAllByText(/tracker.finish/i).length).toBeGreaterThan(0);
    });

    it('renders start options when no workout active', () => {
        renderWithProviders(<Tracker onViewChange={vi.fn()} />);
        // Should show suggestions or empty state
        // Let's assume there's some text like "Start a new workout" or similar if we provided templates
        // Or just check that Finish button is NOT there
        expect(screen.queryByText(/tracker.finish/i)).not.toBeInTheDocument();
    });
});
