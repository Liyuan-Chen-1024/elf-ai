import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from './App';

// Mock the auth hook
vi.mock('./hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    isLoading: false,
    isAuthenticated: false,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

describe('App', () => {
  it('renders login page by default', async () => {
    render(<App />);
    // Should redirect to login
    await waitFor(() => {
      // Use a more flexible matcher for the button or heading
      const loginElements = screen.getAllByText(/Login/i);
      expect(loginElements.length).toBeGreaterThan(0);
    });
  });
});
