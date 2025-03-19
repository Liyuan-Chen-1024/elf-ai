import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// Cast axios to any to avoid TypeScript errors
const api = (axios as any).create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

interface LoginResponse {
  token: string;
  user: {
    id: number;
    username: string;
    email: string;
    first_name?: string;
    last_name?: string;
  };
}

interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

// Use token from localStorage or environment variable
const envToken = import.meta.env.VITE_AUTH_TOKEN;
const storedToken = localStorage.getItem('token');
const token = storedToken || envToken;

if (token) {
  console.log('Setting auth token:', token);
  api.defaults.headers.common['Authorization'] = `Token ${token}`;
  // Save the token to localStorage if it came from env
  if (envToken && !storedToken) {
    localStorage.setItem('token', envToken);
  }
}

export const authApi = {
  // Login with username and password
  login: async (username: string, password: string): Promise<LoginResponse> => {
    try {
      const response = await api.post('/auth/token/', { username, password });
      
      // Store token in localStorage and API headers
      if (response.data && response.data.token) {
        localStorage.setItem('token', response.data.token);
        api.defaults.headers.common['Authorization'] = `Token ${response.data.token}`;
      }
      
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  
  // Logout the current user
  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout/');
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    // Clear token from localStorage and API headers
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
  },
  
  // Get current user profile
  getCurrentUser: async (): Promise<User> => {
    try {
      const response = await api.get('/auth/profile/');
      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  },
  
  // Change password
  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    try {
      await api.post('/auth/change-password/', {
        current_password: currentPassword,
        new_password: newPassword
      });
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  },
  
  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!(localStorage.getItem('token') || import.meta.env.VITE_AUTH_TOKEN);
  }
}; 