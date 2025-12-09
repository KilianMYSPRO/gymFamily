import React from 'react';
import { screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import History from '../History/History';
import { renderWithProviders } from '../../utils/test-utils';

describe('History Component', () => {
    it('renders empty state when no history', () => {
        renderWithProviders(<History />);
        expect(screen.getAllByText(/history.noHistory/i).length).toBeGreaterThan(0);
    });

    it('renders history items', () => {
        const historyData = [
            { id: '1', workoutId: 'w1', name: 'Test Workout', date: new Date().toISOString(), duration: 3600, volume: 1000 }
        ];
        const store = {
            history: historyData,
            workouts: [{ id: 'w1', name: 'Test Workout' }]
        };

        renderWithProviders(<History />, { store });
        expect(screen.getByText('Test Workout')).toBeInTheDocument();
    });
});
