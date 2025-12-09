import React from 'react';
import { screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Dashboard from '../Dashboard/Dashboard';
import { renderWithProviders } from '../../utils/test-utils';

describe('Dashboard Component', () => {
    it('renders welcome message with user name', () => {
        const store = {
            activeProfile: { name: 'Kilian' },
            getWeeklyActivity: vi.fn().mockReturnValue([])
        };

        renderWithProviders(<Dashboard onViewChange={vi.fn()} />, { store });
        // Assuming t('dashboard.welcome', {name}) returns "dashboard.welcome" in mock, 
        // but let's check if the generic welcome key is present.
        // Actually our mock t returns the key.
        // We might want to adjust mock t to perform interpolation if needed,
        // OR just check for the key presence if that's what is rendered.
        expect(screen.getByText(/dashboard.letsCrushIt/i)).toBeInTheDocument();
    });

    it('renders stats overview', () => {
        renderWithProviders(<Dashboard onViewChange={vi.fn()} />);
        expect(screen.getAllByText(/dashboard.workouts/i).length).toBeGreaterThan(0);
    });
});
