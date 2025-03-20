import { ApiClient, API_BASE_URL } from '../../shared/api/api-client';

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

class AuthApi extends ApiClient {
  constructor() {
    super();
  }

  // Login with email and password
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await this.getAxiosInstance().post<LoginResponse>('/auth/login/', {
        username: email,
        password: password
      });
      
      if (!response.data.token) {
        throw new Error('No token received from server');
      }
      
      // Set the token
      this.setAuthToken(response.data.token);
      
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
  }
  
  // Logout the current user
  async logout(): Promise<void> {
    try {
      await this.getAxiosInstance().post('/auth/logout/');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear token even if logout request fails
      this.setAuthToken(null);
    }
  }
  
  // Get current user profile
  async getCurrentUser(): Promise<User> {
    this.ensureAuthenticated();
    try {
      const response = await this.getAxiosInstance().get<User>('/auth/profile/');
      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }
  
  // Change password
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    this.ensureAuthenticated();
    try {
      await this.getAxiosInstance().post('/auth/change-password/', {
        current_password: currentPassword,
        new_password: newPassword
      });
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  }
}

export const authApi = new AuthApi(); 