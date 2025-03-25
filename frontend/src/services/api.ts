import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import { Conversation, Message, User, NewsItem } from '../types';

// Get API URL from environment or use default
const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Log the API URL in development mode
if (import.meta.env.DEV) {
  window.console.log('🔧 API Base URL configured as:', apiBaseUrl);
}

// Create axios instance with default config
const axiosInstance: AxiosInstance = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Custom cache for rate-limited requests
interface RateLimitCache {
  [key: string]: {
    timestamp: number;
    retryAfter: number;
  };
}

const rateLimitCache: RateLimitCache = {};

// Helper to get cache key from request config
const getCacheKey = (config: AxiosRequestConfig): string => {
  return `${config.method}:${config.url}`;
};

// Request interceptor for adding auth token and handling rate limits
axiosInstance.interceptors.request.use(
  (config) => {
    // Log the full URL in development mode
    if (import.meta.env.DEV) {
      window.console.log(`🔍 Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, {
        headers: config.headers,
        data: config.data,
      });
    }
    
    const token = window.localStorage.getItem('authToken');
    if (token && config.headers) {
      // Try different authorization format - simple token instead of Bearer
      config.headers.Authorization = `Token ${token}`;
    }
    
    // Check if this request was recently rate limited
    const cacheKey = getCacheKey(config);
    const cached = rateLimitCache[cacheKey];
    const now = Date.now();
    
    if (cached && now < cached.timestamp + cached.retryAfter) {
      // This request is still in the "backoff" period
      throw new axios.Cancel(`Request rate limited. Try again in ${Math.ceil((cached.timestamp + cached.retryAfter - now) / 1000)}s`);
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling errors
axiosInstance.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      window.console.log(`✅ Response: ${response.status} for ${response.config.url}`, {
        data: response.data
      });
    }
    return response;
  },
  (error: AxiosError) => {
    // Handle rate limiting
    if (error.response?.status === 429) {
      // Get or set default retry delay (10 seconds)
      const retryAfter = parseInt(error.response.headers['retry-after'] || '10', 10) * 1000;
      
      // Store in cache
      const cacheKey = getCacheKey(error.config || {});
      rateLimitCache[cacheKey] = {
        timestamp: Date.now(),
        retryAfter: retryAfter,
      };
      
      if (import.meta.env.DEV) {
        window.console.warn(`Rate limited for ${cacheKey}. Will retry after ${retryAfter}ms`);
      }
    }
    
    // Handle session expiration (401 errors)
    if (error.response?.status === 401) {
      window.localStorage.removeItem('authToken');
      // Only redirect if not already on login page to avoid infinite loop
      if (!window.location.pathname.includes('login')) {
        window.location.href = '/login';
      }
    }

    // Enhanced error logging
    if (import.meta.env.DEV) {
      window.console.error('❌ API Error:', {
        url: error.config?.url,
        fullUrl: `${error.config?.baseURL}${error.config?.url}`,
        method: error.config?.method,
        status: error.response?.status,
        statusText: error.response?.statusText,
        headers: error.config?.headers,
        requestData: error.config?.data,
        responseData: error.response?.data,
      });
    }
    
    return Promise.reject(error);
  }
);

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
  login: async (credentials: { username: string; password: string }): Promise<AuthResponse> => {
    try {
      if (import.meta.env.DEV) {
        window.console.log('Attempting login with credentials:', { username: credentials.username });
      }
      const response = await axiosInstance.post('/auth/login/', credentials, {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      if (import.meta.env.DEV) {
        window.console.log('Login response:', response.data);
      }
      return response.data;
    } catch (error) {
      if (import.meta.env.DEV) {
        window.console.error('Login error details:', error);
      }
      throw error;
    }
  },

  logout: async (): Promise<void> => {
    await axiosInstance.post('/auth/logout/');
    window.localStorage.removeItem('authToken');
  },

  register: async (userData: UserRegistrationData): Promise<AuthResponse> => {
    const response = await axiosInstance.post('/auth/register/', userData);
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await axiosInstance.get('/auth/profile/');
    return response.data;
  },
};

// Chat API endpoints
export const chatApi = {
  getConversations: async (): Promise<Conversation[]> => {
    const response = await axiosInstance.get('/chat/conversations/');
    return response.data;
  },

  getConversation: async (id: string): Promise<Conversation> => {
    const response = await axiosInstance.get(`/chat/conversations/${id}/`);
    return response.data;
  },

  createConversation: async (data: { title?: string } = {}): Promise<Conversation> => {
    const response = await axiosInstance.post('/chat/conversations/', { 
      title: data.title || 'New conversation' 
    });
    return response.data;
  },

  updateConversation: async ({ id, ...data }: { id: string } & Partial<Conversation>): Promise<Conversation> => {
    const response = await axiosInstance.patch(`/chat/conversations/${id}/`, data);
    return response.data;
  },

  archiveConversation: async (id: string): Promise<Conversation> => {
    const response = await axiosInstance.post(`/chat/conversations/${id}/archive/`);
    return response.data;
  },

  unarchiveConversation: async (id: string): Promise<Conversation> => {
    const response = await axiosInstance.post(`/chat/conversations/${id}/unarchive/`);
    return response.data;
  },

  deleteConversation: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/chat/conversations/${id}/`);
  },

  getMessages: async (conversationId: string): Promise<Message[]> => {
    const response = await axiosInstance.get(`/chat/conversations/${conversationId}/messages/`);
    return response.data;
  },

  sendMessage: async ({ conversationId, content }: { conversationId: string; content: string }): Promise<Message> => {
    try {
      if (import.meta.env.DEV) {
        window.console.log(`Sending message to conversation ${conversationId}:`, { content });
      }
      
      // Use the RESTful nested endpoint for creating a message in a conversation
      const response = await axiosInstance.post(
        `/chat/conversations/${conversationId}/messages/`, 
        { content },
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      
      if (import.meta.env.DEV) {
        window.console.log('Message sent successfully:', response.data);
      }
      return response.data;
    } catch (error) {
      if (import.meta.env.DEV) {
        window.console.error('Failed to send message:', error);
      }
      throw error;
    }
  },

  // Stream a message response (for ChatGPT-like experience)
  streamMessage: async (
    { conversationId, content, onChunk }: 
    { conversationId: string; content: string; onChunk: (chunk: string) => void }
  ): Promise<void> => {
    try {
      if (import.meta.env.DEV) {
        window.console.log(`Streaming message to conversation ${conversationId}`);
      }
      
      // Set initial state - show "Thinking..." immediately
      onChunk("Thinking...");
      
      // Configure Axios for streaming SSE
      const response = await axiosInstance.post(
        `/chat/conversations/${conversationId}/stream_message/`,
        { content },
        {
          responseType: 'text',
          headers: {
            'Accept': 'text/event-stream',
            'Content-Type': 'application/json',
          },
          // Use Axios built-in transformResponse to process streaming data
          transformResponse: (data) => {
            return data; // Return raw data, we'll process it ourselves
          },
          // Important: Set a longer timeout for streaming
          timeout: 60000,
        }
      );
      
      if (response.status !== 200) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Process the response data as SSE
      let receivedText = '';
      
      if (typeof response.data === 'string') {
        const lines = response.data.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6));
              
              if (data.type === 'token' && data.content) {
                // If this is the first real content, replace "Thinking..."
                if (receivedText === "Thinking...") {
                  receivedText = data.content;
                } else {
                  // Don't duplicate "Final Response:" if it's already in the received text
                  if (receivedText.includes("Final Response:") && data.content.includes("Final Response:")) {
                    // Skip this token or extract only the new content
                    const newContent = data.content.replace("Final Response:", "").trim();
                    if (newContent) {
                      receivedText += newContent;
                    }
                  } else {
                    receivedText += data.content;
                  }
                }
                // Send the accumulated text to the UI
                onChunk(receivedText);
              } else if (data.type === 'done') {
                if (import.meta.env.DEV) {
                  window.console.log('Stream completed');
                }
              }
            } catch (e) {
              if (import.meta.env.DEV) {
                window.console.error('Error parsing SSE data:', e, line);
              }
            }
          }
        }
      } else if (response.data?.content) {
        // Handle regular JSON response as fallback
        const cleanContent = response.data.content.replace(/^Final Response:/, "").trim();
        onChunk(cleanContent || response.data.content);
      }

    } catch (error) {
      if (import.meta.env.DEV) {
        window.console.error('Error streaming message:', error);
      }
      // Replace "Thinking..." with an error message
      onChunk("Error: Unable to generate response. Please try again.");
      throw error;
    }
  },

  updateMessage: async ({ id, content }: { id: string; content: string }): Promise<Message> => {
    const response = await axiosInstance.patch(`/chat/messages/${id}/`, { content });
    return response.data;
  },

  deleteMessage: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/chat/messages/${id}/`);
  },
};

// News API endpoints
export const newsApi = {
  getNews: async (): Promise<NewsItem[]> => {
    const response = await axiosInstance.get('/news/');
    return response.data;
  },
};

export default axiosInstance; 