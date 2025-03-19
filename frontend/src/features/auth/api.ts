import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// Create axios instance
const api = axios.create({
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

export const authApi = {
  // Set auth token in axios headers
  setAuthToken: (token: string) => {
    api.defaults.headers.common['Authorization'] = `Token ${token}`;
    localStorage.setItem('token', token);
  },

  // Clear auth token from axios headers
  clearAuthToken: () => {
    delete api.defaults.headers.common['Authorization'];
    localStorage.removeItem('token');
  },

  // Login with email and password
  login: async (email: string, password: string): Promise<LoginResponse> => {
    try {
      // Get the token and user data from the login endpoint
      const response = await api.post('/auth/login/', {
        username: email,
        password: password
      });
      
      if (!response.data.token) {
        throw new Error('No token received from server');
      }
      
      // Set the token
      authApi.setAuthToken(response.data.token);
      
      return response.data;
    } catch (error: any) {
      // Log the full error response for debugging
      if (error.response) {
        console.error('Login error response:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
      } else {
        console.error('Login error:', error.message);
      }
      throw error;
    }
  },
  
  // Logout the current user
  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout/');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear token even if logout request fails
      authApi.clearAuthToken();
    }
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
    return !!localStorage.getItem('token');
  }
}; 