import { User } from '../types';
import fetchClient from './fetchClient';

// Get API URL from environment or use default
const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Log the API URL in development mode
if (import.meta.env.DEV) {
  window.console.log('🔧 API Base URL configured as:', apiBaseUrl);
}

// Auth API endpoints
export type AuthResponse = { token: string; user: User };

export const authApi = {
  // Initialize API with CSRF token
  initialize: async (): Promise<void> => {
    await fetchClient.initialize();
  },

  // Try login with multiple approaches to handle different API implementations
  login: async (credentials: { username: string; password: string }): Promise<AuthResponse> => {
    try {
      if (import.meta.env.DEV) {
        window.console.log('Attempting login for:', credentials.username);
      }

      // Ensure CSRF token is fetched before login attempt
      await fetchClient.initialize();

      // Use post directly
      const response = await fetchClient.post<AuthResponse>('/auth/login/', {
        username: credentials.username,
        password: credentials.password,
      });

      // Get data directly from response (already parsed)
      const data = response.data;

      // Extract token and user data
      const { token, user } = data;

      if (token) {
        return { token, user };
      } else {
        window.console.error('No token found in login response data:', data);
        throw new Error('No authentication token received');
      }
    } catch (error) {
      window.console.error('Login error:', error);
      throw error;
    }
  },

  logout: async (): Promise<void> => {
    try {
      await fetchClient.post('/auth/logout/', {});
    } catch (error) {
      if (import.meta.env.DEV) {
        window.console.error('Logout error:', error);
      }
    }
    // Note: Local storage clearing is handled by the auth store/hook
  },

  getCurrentUser: async (): Promise<User> => {
    try {
      const response = await fetchClient.get<User>('/auth/profile/');
      return response.data;
    } catch (error) {
      window.console.error('Failed to get current user:', error);
      throw error;
    }
  },
};
