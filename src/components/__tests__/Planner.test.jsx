import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Planner from '../Planner/Planner';
import { renderWithProviders } from '../../utils/test-utils';

describe('Planner Component', () => {
    it('renders create routine button', () => {
        renderWithProviders(<Planner />);
        expect(screen.getAllByText(/planner.create/i).length).toBeGreaterThan(0);
    });

    it('opens new workout form on click', () => {
        renderWithProviders(<Planner />);
        // Find visible button (one of them might be hidden by CSS but JSDOM renders it)
        const createBtns = screen.getAllByText(/planner.create/i);
        fireEvent.click(createBtns[0]);

        // Expect header "Create Routine"
        expect(screen.getByText(/planner.createRoutine/i)).toBeInTheDocument();
        // Expect input label "Routine Name"
        expect(screen.getByText(/planner.routineName/i)).toBeInTheDocument();
    });
});
