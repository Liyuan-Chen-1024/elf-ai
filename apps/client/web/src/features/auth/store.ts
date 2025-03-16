import { create } from 'zustand';
import axios from 'axios';

interface User {
  id: number;
  username: string;
  email: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>(set => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,
  error: null,

  login: async (username: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      // Mock login for testing
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      const mockUser = {
        id: 1,
        username,
        email: `${username}@example.com`,
      };
      const mockToken = 'mock-jwt-token';
      localStorage.setItem('token', mockToken);
      set({ user: mockUser, token: mockToken, isAuthenticated: true, isLoading: false });

      // Comment out the actual API call for now
      // const response = await axios.post('/api/auth/login/', { username, password });
      // const { token, user } = response.data;
      // localStorage.setItem('token', token);
      // set({ user, token, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'An error occurred during login',
        isLoading: false,
      });
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  },
}));
