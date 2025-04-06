import { 
  RequestOptions, 
  RequestConfig, 
  FetchResponse,
  RequestInterceptor,
  ResponseInterceptor
} from './types';

// Get the base URL from environment
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
// Make sure API_PREFIX is empty to fix the 404 errors
const API_PREFIX = '';
const DEFAULT_TIMEOUT = 30000; // 30 seconds

// Check if API_BASE_URL already includes the /api/v1 prefix
const BASE_URL_HAS_PREFIX = API_BASE_URL.includes('/api/v1');

if (import.meta.env.DEV) {
  window.console.log('🔧 API Client configured with base URL:', API_BASE_URL);
  window.console.log('📝 Base URL already includes /api/v1:', BASE_URL_HAS_PREFIX);
}

export class FetchClient {
  private baseURL: string;
  private apiPrefix: string;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private activeStreamControllers: Map<string, AbortController> = new Map();

  constructor(baseURL: string, apiPrefix: string) {
    this.baseURL = baseURL;
    this.apiPrefix = apiPrefix;
    
    // Log configuration
    if (import.meta.env.DEV) {
      window.console.log('🔧 API Client configured with base URL:', `${baseURL}${apiPrefix}`);
    }
  }

  // Add request interceptor
  public interceptors = {
    request: {
      use: (onFulfilled: RequestInterceptor['onFulfilled'], onRejected?: RequestInterceptor['onRejected']) => {
        const interceptorId = this.requestInterceptors.push({
          onFulfilled,
          onRejected,
        });
        return interceptorId - 1;
      },
      eject: (id: number) => {
        if (id >= 0 && id < this.requestInterceptors.length) {
          this.requestInterceptors.splice(id, 1);
        }
      },
    },
    response: {
      use: (onFulfilled: ResponseInterceptor['onFulfilled'], onRejected?: ResponseInterceptor['onRejected']) => {
        const interceptorId = this.responseInterceptors.push({
          onFulfilled,
          onRejected,
        });
        return interceptorId - 1;
      },
      eject: (id: number) => {
        if (id >= 0 && id < this.responseInterceptors.length) {
          this.responseInterceptors.splice(id, 1);
        }
      },
    },
  };

  // Helper to build URL with query parameters
  private buildUrl(url: string, params?: Record<string, string>): string {
    // If URL already starts with http, use it as is
    if (url.startsWith('http')) {
      return url;
    }
    
    // If base URL already includes /api/v1 and the URL also starts with /api/v1, remove the duplicate
    let finalUrl = url;
    if (BASE_URL_HAS_PREFIX && url.startsWith('/api/v1')) {
      finalUrl = url.replace('/api/v1', '');
    }
    
    // Combine base URL with the processed URL
    const fullUrl = `${this.baseURL}${finalUrl}`;
    
    if (import.meta.env.DEV) {
      window.console.log(`🔍 Building URL: ${fullUrl} from ${url}`);
    }
    
    if (!params) return fullUrl;
    
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value);
      }
    });
    
    const queryString = searchParams.toString();
    if (!queryString) return fullUrl;
    
    return `${fullUrl}${fullUrl.includes('?') ? '&' : '?'}${queryString}`;
  }

  // Apply request interceptors
  private async applyRequestInterceptors(config: RequestConfig): Promise<RequestConfig> {
    let currentConfig = { ...config };
    
    for (const interceptor of this.requestInterceptors) {
      try {
        currentConfig = await interceptor.onFulfilled(currentConfig);
      } catch (error) {
        if (interceptor.onRejected) {
          const result = interceptor.onRejected(error);
          return result as RequestConfig;
        }
        throw error;
      }
    }
    
    return currentConfig;
  }

  // Apply response interceptors
  private async applyResponseInterceptors<T>(response: FetchResponse<T>): Promise<FetchResponse<T>> {
    let currentResponse = { ...response };
    
    for (const interceptor of this.responseInterceptors) {
      try {
        currentResponse = await interceptor.onFulfilled(currentResponse);
      } catch (error) {
        if (interceptor.onRejected) {
          const result = interceptor.onRejected(error);
          return result as FetchResponse<T>;
        }
        throw error;
      }
    }
    
    return currentResponse;
  }

  // Helper to handle timeouts
  private withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    let timeoutId: number;
    
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = window.setTimeout(() => {
        reject(new Error(`Request timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });
    
    return Promise.race([
      promise,
      timeoutPromise,
    ]).finally(() => {
      window.clearTimeout(timeoutId);
    }) as Promise<T>;
  }

  // Core request method
  private async request<T = unknown>(config: RequestConfig): Promise<FetchResponse<T>> {
    try {
      // Apply request interceptors
      const processedConfig = await this.applyRequestInterceptors(config);
      
      // Prepare fetch options
      const { url, method, data, options = {} } = processedConfig;
      const { params, timeout = DEFAULT_TIMEOUT, withCredentials = true, ...fetchOptions } = options;
      
      // Build the full URL with query parameters
      const fullUrl = this.buildUrl(url, params);
      
      if (import.meta.env.DEV) {
        window.console.log(`🔍 Request: ${method} ${fullUrl}`, { data, options });
      }

      // Prepare headers
      const headers = new Headers(fetchOptions.headers);
      
      // Always set Content-Type for JSON objects unless explicitly set otherwise
      // or it's a FormData object
      if (!headers.has('Content-Type') && data) {
        if (data instanceof FormData) {
          // Let the browser set the content type with boundary for FormData
        } else {
          headers.set('Content-Type', 'application/json');
        }
      }
      
      // Prepare request body
      let body: unknown = undefined;
      if (data) {
        if (data instanceof FormData) {
          body = data;
        } else if (typeof data === 'object') {
          body = JSON.stringify(data);
        } else {
          body = data;
        }
      }
      
      // Credentials mode for cookies
      const credentials = withCredentials ? 'include' : 'same-origin';
      
      // Make the fetch request with timeout
      const fetchPromise = window.fetch(fullUrl, {
        method,
        headers,
        body: body as BodyInit | null,
        credentials,
        ...fetchOptions,
      });
      
      const fetchWithTimeout = this.withTimeout(fetchPromise, timeout);
      const response = await fetchWithTimeout;
      
      // Process response data
      let responseData: T;
      const contentType = response.headers.get('Content-Type') || '';
      
      if (contentType.includes('application/json')) {
        try {
          responseData = await response.json();
        } catch (_err) {
          responseData = {} as T;
          window.console.error('Failed to parse JSON response:', _err);
        }
      } else if (contentType.includes('text/')) {
        responseData = (await response.text()) as unknown as T;
      } else {
        responseData = {} as T;
      }
      
      // Create response object
      const fetchResponse: FetchResponse<T> = {
        data: responseData,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        config: processedConfig,
      };
      
      // Handle error status codes
      if (!response.ok) {
        const error = {
          response: fetchResponse,
          request: processedConfig,
          message: `Request failed with status ${response.status}`,
          status: response.status
        };
        
        // Special handling for 401 (Unauthorized)
        if (response.status === 401) {
          // Check if this is an auth-related endpoint
          const isAuthEndpoint = url.includes('/auth/login') || 
                               url.includes('/auth/register') || 
                               url.includes('/auth/logout');
          
          if (!isAuthEndpoint) {
            if (import.meta.env.DEV) {
              window.console.warn('Received 401 Unauthorized from non-auth endpoint, clearing auth state');
            }
            
            // Clear auth token
            window.localStorage.removeItem('authToken');
            window.localStorage.removeItem('user');
            
            // Redirect to login page if not already there
            if (!window.location.pathname.includes('login')) {
              window.location.href = '/login';
            }
          } else if (import.meta.env.DEV) {
            window.console.log('Received 401 from auth endpoint, not triggering logout');
          }
        }
        
        throw error;
      }
      
      if (import.meta.env.DEV) {
        window.console.log(`✅ Response: ${method} ${fullUrl}`, fetchResponse);
      }
      
      // Apply response interceptors
      const processedResponse = await this.applyResponseInterceptors(fetchResponse);
      
      return processedResponse;
    } catch (error: unknown) {
      if (import.meta.env.DEV) {
        window.console.error(`❌ Request Error: ${config.method} ${config.url}`, error);
      }
      
      // Try to apply response error interceptors if possible
      let currentError = error;
      for (const interceptor of this.responseInterceptors) {
        if (interceptor.onRejected) {
          try {
            // Use the result directly without modifying the error parameter
            const result = await interceptor.onRejected(currentError);
            return result as FetchResponse<T>;
          } catch (interceptError) {
            // Assign to our new variable instead of the parameter
            currentError = interceptError;
          }
        }
      }
      
      throw currentError;
    }
  }

  // Stream method for SSE responses (returns a ReadableStream)
  public async stream<T = unknown>(
    url: string,
    data?: unknown,
    options?: RequestOptions,
    onChunk?: (chunk: T) => void
  ): Promise<ReadableStream<Uint8Array> | null> {
    try {
      // Create a unique key for this stream request
      const streamKey = `${url}-${Date.now()}`;
      
      // Create an AbortController for this request
      const abortController = new AbortController();
      this.activeStreamControllers.set(streamKey, abortController);
      
      const processedConfig = await this.applyRequestInterceptors({
        url,
        method: 'POST',
        data,
        options: {
          ...options,
          headers: {
            ...options?.headers,
            'Accept': 'text/event-stream, application/json, */*',
            ...(!(data instanceof FormData) && { 'Content-Type': 'application/json' }),
          }
        }
      });
      
      // Prepare fetch options
      const { url: processedUrl, data: processedData, options: processedOptions = {} } = processedConfig;
      const { params, withCredentials = true, ...fetchOptions } = processedOptions;
      
      // Build the full URL with query parameters
      const fullUrl = this.buildUrl(processedUrl, params);
      
      if (import.meta.env.DEV) {
        window.console.log(`🔍 Stream Request: POST ${fullUrl}`, { 
          data: processedData, 
          headers: processedOptions.headers 
        });
      }

      // Prepare headers
      const headers = new Headers(fetchOptions.headers);
      
      // Always set Content-Type for JSON objects unless explicitly set otherwise
      // or it's a FormData object
      if (!headers.has('Content-Type') && processedData) {
        if (processedData instanceof FormData) {
          // Let the browser set the content type with boundary for FormData
        } else {
          headers.set('Content-Type', 'application/json');
        }
      }
      
      // Add auth token header if available
      const token = window.localStorage.getItem('authToken');
      if (token) {
        // Try different authorization format - simple token instead of Bearer
        headers.set('Authorization', `Token ${token}`);
        
        // Log the token presence for debugging
        if (import.meta.env.DEV) {
          window.console.log('Added auth token to request headers');
        }
      } else if (import.meta.env.DEV) {
        window.console.warn('No auth token found in localStorage for stream request');
      }
      
      // Add CSRF token if available
      const csrfToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1];
        
      if (csrfToken) {
        headers.set('X-CSRFToken', csrfToken);
      }
      
      // Prepare request body
      let body: unknown = undefined;
      if (processedData) {
        if (processedData instanceof FormData) {
          body = processedData;
        } else if (typeof processedData === 'object') {
          body = JSON.stringify(processedData);
        } else {
          body = processedData;
        }
      }
      
      // Credentials mode for cookies
      const credentials = withCredentials ? 'include' : 'same-origin';
      
      // Make the fetch request
      const response = await window.fetch(fullUrl, {
        method: 'POST',
        headers,
        body: body as BodyInit | null,
        credentials,
        signal: abortController.signal,
        ...fetchOptions,
      });
      
      if (!response.ok) {
        let errorData = 'Unknown error';
        try {
          errorData = await response.text();
        } catch (_error) {
          // Ignore parsing errors
        }
        
        const error = {
          response: {
            status: response.status,
            statusText: response.statusText,
            data: errorData,
          },
          message: `Stream request failed with status ${response.status}`,
          status: response.status
        };
        
        // Handle 401 Unauthorized
        if (response.status === 401) {
          // Check if this is an auth-related endpoint
          const isAuthEndpoint = processedUrl.includes('/auth/login') || 
                               processedUrl.includes('/auth/register') || 
                               processedUrl.includes('/auth/logout');
          
          if (!isAuthEndpoint) {
            if (import.meta.env.DEV) {
              window.console.warn('Stream received 401 Unauthorized, clearing auth state');
            }
            
            window.localStorage.removeItem('authToken');
            window.localStorage.removeItem('user');
            
            if (!window.location.pathname.includes('login')) {
              window.location.href = '/login';
            }
          } else if (import.meta.env.DEV) {
            window.console.log('Received 401 from auth endpoint stream, not triggering logout');
          }
        }
        
        throw error;
      }
      
      if (onChunk && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        
        // Process the stream manually if onChunk is provided
        (async () => {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                if (import.meta.env.DEV) {
                  window.console.log('Stream completed successfully');
                }
                break;
              }
              
              // Convert the chunk to text and add it to our buffer
              const chunk = decoder.decode(value, { stream: true });
              if (import.meta.env.DEV && chunk.length > 0) {
                window.console.log(`Received ${chunk.length} bytes of stream data:`, chunk);
              }
              buffer += chunk;
              
              // Process any complete SSE messages in the buffer
              // Events are separated by newline characters
              const lines = buffer.split('\n');
              
              // Keep the last potentially incomplete line in the buffer
              buffer = lines.pop() || '';
              
              // Process complete lines
              for (const line of lines) {
                // Skip empty lines
                if (!line.trim()) continue;
                
                // Handle data lines
                if (line.startsWith('data:')) {
                  try {
                    const jsonStr = line.substring(5).trim();
                    if (import.meta.env.DEV) {
                      window.console.log('SSE data message:', jsonStr);
                    }
                    if (jsonStr) {
                      const data = JSON.parse(jsonStr) as T;
                      onChunk(data);
                    }
                  } catch (error) {
                    if (import.meta.env.DEV) {
                      window.console.error('Error parsing SSE message:', line, error);
                    }
                  }
                }
              }
            }
          } catch (error) {
            if (import.meta.env.DEV) {
              window.console.error('Error processing stream:', error);
            }
          }
        })();
      }
      
      // When done or error, remove the controller
      return response.body;
    } catch (error) {
      if (import.meta.env.DEV) {
        window.console.error('Stream error:', error);
      }
      throw error;
    }
  }

  // Method to abort all active streams
  public abortAllStreams(): void {
    this.activeStreamControllers.forEach((controller) => {
      try {
        controller.abort();
      } catch (e) {
        if (import.meta.env.DEV) {
          window.console.error('Error aborting stream:', e);
        }
      }
    });
    this.activeStreamControllers.clear();
  }
  
  // Method to abort a specific stream by URL
  public abortStreamsByUrl(urlPrefix: string): void {
    this.activeStreamControllers.forEach((controller, key) => {
      if (key.startsWith(urlPrefix)) {
        try {
          controller.abort();
          this.activeStreamControllers.delete(key);
        } catch (e) {
          if (import.meta.env.DEV) {
            window.console.error(`Error aborting stream for ${urlPrefix}:`, e);
          }
        }
      }
    });
  }

  // HTTP method wrappers
  public async get<T = unknown>(url: string, options?: RequestOptions): Promise<FetchResponse<T>> {
    return this.request<T>({
      url,
      method: 'GET',
      options,
    });
  }

  public async post<T = unknown>(url: string, data?: unknown, options?: RequestOptions): Promise<FetchResponse<T>> {
    try {
      const result = await this.request<T>({
        url,
        method: 'POST',
        data,
        options,
      });
      return result;
    } catch (error) {
      console.error(`POST request failed to ${url}:`, error);
      throw error;
    }
  }

  public async put<T = unknown>(url: string, data?: unknown, options?: RequestOptions): Promise<FetchResponse<T>> {
    return this.request<T>({
      url,
      method: 'PUT',
      data,
      options,
    });
  }

  public async patch<T = unknown>(url: string, data?: unknown, options?: RequestOptions): Promise<FetchResponse<T>> {
    return this.request<T>({
      url,
      method: 'PATCH',
      data,
      options,
    });
  }

  public async delete<T = unknown>(url: string, options?: RequestOptions): Promise<FetchResponse<T>> {
    return this.request<T>({
      url,
      method: 'DELETE',
      options,
    });
  }
}

// Create the client instance with proper API prefix
const fetchClient = new FetchClient(API_BASE_URL, API_PREFIX);

// Add auth token interceptor
fetchClient.interceptors.request.use((config) => {
  // Skip if it's a login request
  if (config.url?.includes('/auth/login')) {
    if (import.meta.env.DEV) {
      window.console.log(`Skipping auth token for login request: ${config.method} ${config.url}`);
    }
    return config;
  }
  
  const token = window.localStorage.getItem('authToken');
  
  if (token) {
    // Create or update the options object to ensure it exists
    const options = config.options || {};
    
    // Create headers object correctly
    const currentHeaders = options.headers || {};
    let headersObj = typeof currentHeaders === 'object' 
      ? { ...currentHeaders } 
      : {};
    
    // Add the token using correct format
    if (typeof headersObj === 'object') {
      // Add as key-value on object
      (headersObj as Record<string, string>)['Authorization'] = `Token ${token}`;
    }
    
    // Update the config with the new options
    config = {
      ...config,
      options: {
        ...options,
        headers: headersObj
      }
    };
    
    if (import.meta.env.DEV) {
      window.console.log(`Auth token found for ${config.method} ${config.url}: ${token.substring(0, 5)}...`);
      
      // Add some debugging information
      window.console.log('Request with auth:', {
        url: config.url,
        method: config.method,
        authHeader: `Token ${token.substring(0, 5)}...`,
      });
    }
  } else if (import.meta.env.DEV) {
    window.console.warn(`No auth token found for ${config.method} ${config.url} request`);
  }
  
  return config;
});

// Add CSRF token interceptor for non-GET requests
fetchClient.interceptors.request.use((config) => {
  if (config.method !== 'GET') {
    // Get CSRF token from cookie
    const csrfToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('csrftoken='))
      ?.split('=')[1];
    
    if (csrfToken) {
      // Ensure headers exist
      const options = config.options || {};
      const headers = options.headers || {};
      
      // Add CSRF header
      const newHeaders = {
        ...headers,
        'X-CSRFToken': csrfToken,
      };
      
      return {
        ...config,
        options: {
          ...options,
          headers: newHeaders,
        },
      };
    }
  }
  
  return config;
});

// Export the client
export default fetchClient; 