import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Planner from '../Planner/Planner';
import { renderWithProviders } from '../../utils/test-utils';

describe('Planner Component', () => {
    it('renders create routine button', () => {
        renderWithProviders(<Planner />);
        expect(screen.getAllByText(/planner.create/i).length).toBeGreaterThan(0);
    });

    it('opens new workout form on click', () => {
        renderWithProviders(<Planner />);
        const createBtns = screen.getAllByText(/planner.create/i);
        fireEvent.click(createBtns[0]);

        expect(screen.getByText(/planner.createRoutine/i)).toBeInTheDocument();
        expect(screen.getByText(/planner.routineName/i)).toBeInTheDocument();
    });

    it('requires name to save workout', () => {
        const addWorkout = vi.fn();
        renderWithProviders(<Planner />, { store: { addWorkout } });

        // Open form
        const createBtns = screen.getAllByText(/planner.create/i);
        fireEvent.click(createBtns[0]);

        // Find Save button
        const saveBtn = screen.getByText(/planner.saveRoutine/i).closest('button');

        // Should be disabled initially
        expect(saveBtn).toBeDisabled();

        // Find input by exact placeholder found in code
        const input = screen.getByPlaceholderText('e.g. Push Day, Leg Day');
        fireEvent.change(input, { target: { value: 'My New Routine' } });

        // Should be enabled now
        expect(saveBtn).not.toBeDisabled();

        // Click save
        fireEvent.click(saveBtn);

        // Expect addWorkout to be called with correct name
        expect(addWorkout).toHaveBeenCalledWith(expect.objectContaining({
            name: 'My New Routine'
        }));
    });
});
