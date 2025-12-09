import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Profile from '../Profile/Profile';
import { renderWithProviders } from '../../utils/test-utils';

describe('Profile Component', () => {
    it('renders user details', () => {
        const store = {
            activeProfile: { name: 'Test User', theme: 'blue' }
        };
        renderWithProviders(<Profile />, { store });
        // According to Profile.jsx code from earlier sessions, it displays profile name in a header or input
        // Let's check for the profile name
        expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
    });

    it('renders specific settings sections', () => {
        renderWithProviders(<Profile />);
        const dataTab = screen.getByText(/profile.data/i);
        fireEvent.click(dataTab);
        expect(screen.getByText(/profile.dataManagement/i)).toBeInTheDocument();
    });
});
