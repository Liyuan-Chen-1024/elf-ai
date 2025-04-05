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
export interface UserRegistrationData {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export const authApi = {
  // Try login with multiple approaches to handle different API implementations
  login: async (credentials: { username: string; password: string }): Promise<AuthResponse> => {
    try {
      window.console.log('Attempting login for:', credentials.username);
      
      // Create form data for Django's authentication system
      const formData = new FormData();
      formData.append('username', credentials.username);
      formData.append('password', credentials.password);
      
      // First try with JSON (most common)
      let response;
      try {
        response = await fetchClient.post<AuthResponse>('/auth/login/', {
          username: credentials.username,
          password: credentials.password
        }, {
          headers: {'Content-Type': 'application/json'},
          withCredentials: false
        });
        window.console.log('Login succeeded with JSON format');
      } catch (_jsonError) {
        window.console.log('JSON login failed, trying FormData approach');
        
        // If JSON fails, try FormData approach
        response = await fetchClient.post<AuthResponse>('/auth/login/', formData, {
          withCredentials: false
        });
        window.console.log('Login succeeded with FormData format');
      }
    
      window.console.log('Login response:', JSON.stringify(response.data));
      
      // Extract and store token - handle different formats
      let token = null;
      let userData = null;
      
      if (typeof response.data === 'string') {
        // Some Django APIs return the token as a string
        token = response.data;
      } else if (response.data.token) {
        token = response.data.token;
        userData = response.data.user;
      } else if ('key' in response.data) {
        token = (response.data as unknown as { key: string }).key;
        userData = response.data.user;
      }
      
      if (token) {
        // Store the token
        window.localStorage.setItem('authToken', token);
        window.console.log('Stored auth token:', token);
        
        // If there's user data, store that too
        if (userData) {
          window.localStorage.setItem('user', JSON.stringify(userData));
        }
        
        // Return properly formed response with minimum required User fields
        return {
          token,
          user: userData || { 
            id: 'unknown', 
            username: credentials.username,
            email: '',  // Add minimum required fields
            name: credentials.username,
            avatar: ''  // Empty string instead of null
          }
        };
      } else {
        window.console.error('No token found in login response', response.data);
        throw new Error('No authentication token received');
      }
    } catch (error) {
      window.console.error('Login error:', error);
      throw error;
    }
  },

  logout: async (): Promise<void> => {
    try {
      await fetchClient.post('/auth/logout/');
    } catch (error) {
      if (import.meta.env.DEV) {
        window.console.error('Logout error:', error);
      }
    } finally {
      // Always clear local storage, even if the API call fails
      window.localStorage.removeItem('authToken');
      window.localStorage.removeItem('user');
    }
  },

  register: async (userData: UserRegistrationData): Promise<AuthResponse> => {
    const response = await fetchClient.post<AuthResponse>('/auth/register/', userData);
    
    // Extract and store the token
    // Handle both { token: string } and { key: string } formats (common in DRF)
    let token = null;
    if (response.data.token) {
      token = response.data.token;
    } else if ('key' in response.data) {
      token = (response.data as unknown as { key: string }).key;
    }
    
    if (token) {
      // Store the token
      window.localStorage.setItem('authToken', token);
      
      if (import.meta.env.DEV) {
        window.console.log('Auth token stored in localStorage after registration');
      }
      
      // If there's user data, store that too
      if (response.data.user) {
        window.localStorage.setItem('user', JSON.stringify(response.data.user));
      }
    } else {
      window.console.error('No token found in registration response', response.data);
    }
    
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await fetchClient.get<User>('/auth/profile/');
    return response.data;
  },
};