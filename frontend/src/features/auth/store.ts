import axios from 'axios';
import type { AxiosInstance } from 'axios';
import { create } from 'zustand';
import { User } from '../chat/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// Create an axios instance for consistent configuration
const axiosInstance = axios;
axiosInstance.defaults.baseURL = API_BASE_URL;
axiosInstance.defaults.headers['Content-Type'] = 'application/json';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const mockUser: User = {
  id: '1',
  name: 'Test User',
  email: 'test@example.com',
  role: 'user'
};

export const useAuthStore = create<AuthState>(set => ({
  user: mockUser,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,
  error: null,

  login: async (username: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      // Use the actual API call
      const response = await axiosInstance.post('/auth/token/', { username, password });
      const token = (response.data as { token: string }).token;

      // Set the authorization header - using Token instead of Bearer for Django REST Framework
      if (axiosInstance.defaults?.headers?.common) {
        axiosInstance.defaults.headers.common['Authorization'] = `Token ${token}`;
      }

      // Create a user object with required fields
      const mockUser: User = {
        id: '1',
        name: username,
        email: `${username}@example.com`,
        role: 'user'
      };

      localStorage.setItem('token', token);
      set({ user: mockUser, token, isAuthenticated: true, isLoading: false });
    } catch (error) {
      console.error('Login error:', error);
      set({
        error: error instanceof Error ? error.message : 'An error occurred during login',
        isLoading: false,
      });
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    if (axiosInstance.defaults?.headers?.common) {
      delete axiosInstance.defaults.headers.common['Authorization'];
    }
    set({ user: null, token: null, isAuthenticated: false });
  },
}));
