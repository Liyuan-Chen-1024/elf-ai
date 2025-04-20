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
      window.console.log('Attempting login for:', credentials.username);
      
      // Ensure CSRF token is fetched before login attempt
      await fetchClient.initialize();
      
      // Log current CSRF token status
      const csrfToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1];
      
      if (csrfToken) {
        window.console.log('CSRF token found in cookies:', csrfToken.substring(0, 5) + '...');
      } else {
        window.console.warn('No CSRF token found in cookies before login attempt');
        // Try to fetch it again to be safe
        await fetchClient.initialize();
      }
      
      window.console.log('Login attempt with credentials:', {
        username: credentials.username,
        password: credentials.password.replace(/./g, '*') // Don't log actual password
      });
      
      // Use post directly
      const response = await fetchClient.post<AuthResponse>('/auth/login/', {
        username: credentials.username,
        password: credentials.password
      });

      window.console.log('Login response status:', response.status);
      
      // Get data directly from response (already parsed)
      const data = response.data;
      window.console.log('Login response data:', data);
      
      // Extract token and user data
      const { token, user } = data;
      
      if (token) {
        // Store the token
        window.localStorage.setItem('authToken', token);
        window.console.log('Stored auth token:', token.substring(0, 5) + '...');
        
        // Also log token for debugging
        window.console.log('Token being stored in localStorage:', token);
        
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
    } finally {
      // Always clear local storage, even if the API call fails
      window.localStorage.removeItem('authToken');
      window.localStorage.removeItem('user');
      
      // Clear cookies (specifically CSRF token) to ensure a fresh state after login
      document.cookie.split(';').forEach(cookie => {
        const [name] = cookie.trim().split('=');
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      });
    }
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