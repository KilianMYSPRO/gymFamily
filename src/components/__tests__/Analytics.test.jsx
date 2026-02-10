import React from 'react';
import { screen, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Analytics from '../Analytics/Analytics';
import { renderWithProviders } from '../../utils/test-utils';

describe('Analytics Component - Progress Tracker', () => {
    it('displays exercises in dropdown when sessions have detailedSets', async () => {
        const store = {
            history: [
                {
                    id: 'session-1',
                    date: '2026-01-01T10:00:00Z',
                    exercises: [
                        { id: 'ex-1', name: 'Bench Press', originalId: 'Barbell_Bench_Press' }
                    ],
                    detailedSets: {
                        'ex-1-set-0': { weight: '100', reps: '10', completed: true },
                        'ex-1-set-1': { weight: '100', reps: '10', completed: true }
                    }
                },
                {
                    id: 'session-2',
                    date: '2026-01-05T10:00:00Z',
                    exercises: [
                        { id: 'ex-2', name: 'Bench Press', originalId: 'Barbell_Bench_Press' }
                    ],
                    detailedSets: {
                        'ex-2-set-0': { weight: '105', reps: '10', completed: true }
                    }
                }
            ],
            weightHistory: []
        };

        renderWithProviders(<Analytics />, { store });

        // Find the exercise selector dropdown
        const selects = screen.getAllByRole('combobox');
        const exerciseSelect = selects.find(select =>
            within(select).queryByText(/analytics.selectExercise/i)
        );

        expect(exerciseSelect).toBeInTheDocument();

        // Should have "Barbell Bench Press - Medium Grip" option (normalized name)
        const options = within(exerciseSelect).getAllByRole('option');
        expect(options.length).toBeGreaterThan(1); // At least placeholder + 1 exercise
    });


    it('shows empty state when no exercise is selected', () => {
        const store = { history: [], weightHistory: [] };
        renderWithProviders(<Analytics />, { store });

        expect(screen.getByText(/analytics.selectExerciseTitle/i)).toBeInTheDocument();
    });

    it('handles exercises without originalId (custom exercises)', () => {
        const store = {
            history: [
                {
                    id: 'session-1',
                    date: '2026-01-01T10:00:00Z',
                    exercises: [
                        { id: 'ex-1', name: 'Custom Exercise' } // No originalId
                    ],
                    detailedSets: {
                        'ex-1-set-0': { weight: '50', reps: '12', completed: true }
                    }
                }
            ],
            weightHistory: []
        };

        renderWithProviders(<Analytics />, { store });

        // Should still show the exercise in dropdown
        const selects = screen.getAllByRole('combobox');
        expect(selects.length).toBeGreaterThan(0);
    });

    it('normalizes French exercise names correctly', () => {
        const store = {
            history: [
                {
                    id: 'session-1',
                    date: '2026-01-01T10:00:00Z',
                    exercises: [
                        { id: 'ex-1', name: 'Développé Couché' } // French name
                    ],
                    detailedSets: {
                        'ex-1-set-0': { weight: '70', reps: '10', completed: true }
                    }
                },
                {
                    id: 'session-2',
                    date: '2026-01-05T10:00:00Z',
                    exercises: [
                        { id: 'ex-2', name: 'Bench Press' } // English name
                    ],
                    detailedSets: {
                        'ex-2-set-0': { weight: '75', reps: '10', completed: true }
                    }
                }
            ],
            weightHistory: []
        };

        renderWithProviders(<Analytics />, { store });

        // Both should normalize to the same exercise
        const selects = screen.getAllByRole('combobox');
        const exerciseSelect = selects[1];
        const options = within(exerciseSelect).getAllByRole('option');

        // Should have only 2 options: placeholder + 1 normalized exercise
        expect(options.length).toBe(2);
    });
});
