import axios from 'axios';
import { createLogger } from '../../utils/logging';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// Create a logger for the API client
const logger = createLogger('ApiClient');

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
    logger.debug('ApiClient initialized', { isAuthenticated: !!this.authToken });
  }

  /**
   * Load auth token from local storage on initialization
   */
  protected initializeToken(): void {
    // Try both token keys for backward compatibility
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    if (token) {
      logger.debug('Auth token found in localStorage');
      this.setAuthToken(token);
    } else {
      logger.debug('No auth token found in localStorage');
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
    logger.debug('Auth token set');
  }

  public clearAuthToken(): void {
    this.authToken = null;
    localStorage.removeItem('authToken');
    // Reset axios instance
    this._axiosInstance = null;
    logger.debug('Auth token cleared');
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
      logger.error('Authentication required but no token found');
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
        const axiosError = error as any;
        if (axiosError.response?.status === 401) {
          // Handle authentication error
          logger.error('Authentication failed', { status: axiosError.response?.status });
          this.clearAuthToken();
          throw new Error('Authentication failed');
        }
        if (axiosError.response?.status === 429 && retries < maxRetries) {
          logger.warn(`Rate limited, retrying in ${delay}ms (${retries + 1}/${maxRetries})`, {
            status: axiosError.response?.status,
            retryCount: retries + 1,
            maxRetries,
            delay
          });
          await new Promise(resolve => setTimeout(resolve, delay));
          retries++;
          delay *= 2; // Exponential backoff
          return execute();
        }
        logger.error('Request failed', {
          status: axiosError.response?.status,
          data: axiosError.response?.data,
          url: axiosError.config?.url
        });
        throw error;
      }
    };

    return execute();
  }

  /**
   * Get the axios instance for making requests
   */
  protected getAxiosInstance(): any {
    if (!this._axiosInstance) {
      logger.debug('Creating new Axios instance');
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
          (config: any) => {
            logger.debug('Sending request', { 
              method: config.method, 
              url: config.url,
              params: config.params
            });
            
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
          (error: any) => {
            logger.error('Request interceptor error', { error });
            return Promise.reject(error);
          }
        );
        
        // Add response interceptor for logging
        this._axiosInstance.interceptors.response.use(
          (response: any) => {
            logger.debug('Response received', { 
              status: response.status,
              url: response.config.url,
              method: response.config.method
            });
            return response;
          },
          (error: any) => {
            logger.error('Response error', { 
              status: error.response?.status,
              url: error.config?.url,
              method: error.config?.method,
              data: error.response?.data
            });
            return Promise.reject(error);
          }
        );
      }
    }

    if (!this._axiosInstance) {
      logger.error('Failed to create Axios instance');
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
      logger.debug('Reusing pending request', { key });
      const existingPromise = this.pendingRequests.get(key);
      if (existingPromise) {
        return existingPromise as Promise<T>;
      }
    }

    // Otherwise, create a new request and store the promise
    logger.debug('Creating new request', { key });
    try {
      // Add retry logic with exponential backoff
      const promise = this.retryWithBackoff(requestFn);
      this.pendingRequests.set(key, promise);
      const result = await promise;
      // Wait a bit before allowing another request with the same key
      setTimeout(() => {
        this.pendingRequests.delete(key);
        logger.debug('Removed pending request', { key });
      }, 500);
      return result;
    } catch (error) {
      this.pendingRequests.delete(key);
      logger.error('Request failed, removed from pending', { key, error });
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
    logger.debug('CSRF Token', { found: !!cookieValue });
    return cookieValue;
  }
} 