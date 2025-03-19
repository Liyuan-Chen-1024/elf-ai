import type { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import axios from 'axios';

export const API_BASE_URL = 'http://localhost:8000/api/v1';

/**
 * Base API client with common functionality like auth handling, 
 * retry logic, and request throttling
 */
export class ApiClient {
  protected authToken: string | null = null;
  protected axiosInstance: AxiosInstance;

  constructor() {
    const config: AxiosRequestConfig = {
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    this.axiosInstance = (axios as any).create(config);
    // Initialize the token from localStorage when the API is first created
    this.initializeToken();
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
  public setAuthToken(token: string | null): void {
    this.authToken = token;
    if (token) {
      if (this.axiosInstance.defaults.headers) {
        this.axiosInstance.defaults.headers['Authorization'] = `Token ${token}`;
      }
      // Store in both locations for compatibility
      localStorage.setItem('authToken', token);
      localStorage.setItem('token', token);
    } else {
      if (this.axiosInstance.defaults.headers) {
        delete this.axiosInstance.defaults.headers['Authorization'];
      }
      localStorage.removeItem('authToken');
      localStorage.removeItem('token');
    }
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
    this.initializeToken(); // Re-check token before each request
    if (!this.isAuthenticated()) {
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
          this.setAuthToken(null);
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
  protected getAxiosInstance() {
    return this.axiosInstance;
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
} 