import axios from 'axios';
type AxiosInstance = any;
type AxiosError = any;
type AxiosRequestConfig = any;

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

/**
 * Base API client with common functionality like auth handling, 
 * retry logic, and request throttling
 */
export class ApiClient {
  protected authToken: string | null = null;
  private _axiosInstance: any = null;

  constructor() {
    // Try to get the auth token from localStorage
    this.authToken = localStorage.getItem('authToken');
  }

  /**
   * Load auth token from local storage on initialization
   */
  protected initializeToken(): void {
    // Try both token keys for backward compatibility
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    if (token) {
      this.setAuthToken(token);
    }
  }

  /**
   * Set or clear the auth token
   */
  public setAuthToken(token: string): void {
    this.authToken = token;
    localStorage.setItem('authToken', token);
    // Reset axios instance to recreate with new token
    this._axiosInstance = null;
  }

  public clearAuthToken(): void {
    this.authToken = null;
    localStorage.removeItem('authToken');
    // Reset axios instance
    this._axiosInstance = null;
  }

  /**
   * Check if the client is authenticated
   */
  public isAuthenticated(): boolean {
    return !!this.authToken;
  }

  /**
   * Ensure the client is authenticated before making requests
   */
  protected ensureAuthenticated(): void {
    if (!this.authToken) {
      throw new Error('Authentication required');
    }
  }

  /**
   * Retry a function with exponential backoff for rate limit errors
   */
  protected async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries = 3,
    initialDelay = 500
  ): Promise<T> {
    let retries = 0;
    let delay = initialDelay;

    const execute = async (): Promise<T> => {
      try {
        return await fn();
      } catch (error: unknown) {
        const axiosError = error as AxiosError;
        if (axiosError.response?.status === 401) {
          // Handle authentication error
          this.clearAuthToken();
          throw new Error('Authentication failed');
        }
        if (axiosError.response?.status === 429 && retries < maxRetries) {
          console.log(`Rate limited, retrying in ${delay}ms (${retries + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          retries++;
          delay *= 2; // Exponential backoff
          return execute();
        }
        throw error;
      }
    };

    return execute();
  }

  /**
   * Get the axios instance for making requests
   */
  protected getAxiosInstance(): AxiosInstance {
    if (!this._axiosInstance) {
      this._axiosInstance = axios.create({
        baseURL: API_BASE_URL,
        withCredentials: true, // Required for CSRF
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (this._axiosInstance) {
        // Add request interceptor to include auth token
        this._axiosInstance.interceptors.request.use(
          (config) => {
            if (this.authToken) {
              config.headers = config.headers || {};
              config.headers.Authorization = `Token ${this.authToken}`;
            }

            // Get CSRF token from cookie
            const csrfToken = this.getCsrfToken();
            if (csrfToken && config.method && config.method.toLowerCase() !== 'get') {
              config.headers = config.headers || {};
              config.headers['X-CSRFToken'] = csrfToken;
            }

            return config;
          },
          (error) => {
            return Promise.reject(error);
          }
        );
      }
    }

    if (!this._axiosInstance) {
      throw new Error('Failed to create Axios instance');
    }
    
    return this._axiosInstance;
  }

  /**
   * Throttle requests to prevent too many requests with the same key
   */
  protected pendingRequests = new Map<string, Promise<any>>();
  
  protected async throttleRequest<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    // If there's already a pending request with this key, return that promise
    if (this.pendingRequests.has(key)) {
      const existingPromise = this.pendingRequests.get(key);
      if (existingPromise) {
        return existingPromise as Promise<T>;
      }
    }

    // Otherwise, create a new request and store the promise
    try {
      // Add retry logic with exponential backoff
      const promise = this.retryWithBackoff(requestFn);
      this.pendingRequests.set(key, promise);
      const result = await promise;
      // Wait a bit before allowing another request with the same key
      setTimeout(() => {
        this.pendingRequests.delete(key);
      }, 500);
      return result;
    } catch (error) {
      this.pendingRequests.delete(key);
      throw error;
    }
  }

  /**
   * Get CSRF token from cookies
   */
  protected getCsrfToken(): string | null {
    const name = 'csrftoken';
    let cookieValue: string | null = null;
    if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.substring(0, name.length + 1) === (name + '=')) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  }
} 