import axios from 'axios';
import { API_BASE_URL, ApiClient } from '../../../shared/api/api-client';

interface AuthResponse {
  token: string;
}

/**
 * Authentication API service
 */
export class AuthApi extends ApiClient {
  /**
   * Login with username and password
   */
  async login(username: string, password: string): Promise<string> {
    const response = await axios.post<AuthResponse>(`${API_BASE_URL}/auth/login/`, {
      username,
      password,
    });
    const token = response.data.token;
    this.setAuthToken(token);
    return token;
  }

  /**
   * Logout the current user
   */
  logout(): void {
    this.setAuthToken(null);
  }
}

export const authApi = new AuthApi(); 