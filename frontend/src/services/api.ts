import { Conversation, Message, User, NewsItem } from '../types';
import fetchClient from './fetchClient';
import { SSEMessage } from './types';

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

// Chat API endpoints
export const chatApi = {
  getConversations: async (): Promise<Conversation[]> => {
    const response = await fetchClient.get<Conversation[]>('/chat/conversations/');
    return response.data;
  },

  getConversation: async (id: string): Promise<Conversation> => {
    const response = await fetchClient.get<Conversation>(`/chat/conversations/${id}/`);
    return response.data;
  },

  createConversation: async ({ title }: { title?: string } = {}): Promise<Conversation> => {
    try {
      // Try with JSON content type first
      try {
        const response = await fetchClient.post<Conversation>('/chat/conversations/', { title }, {
          headers: { 'Content-Type': 'application/json' }
        });
        window.console.log('Created conversation with JSON format');
        return response.data;
      } catch (jsonError) {
        // Define a type for API errors
        type ApiError = { status: number; message: string };
        
        if (typeof jsonError === 'object' && jsonError && 
            'status' in jsonError && 
            (jsonError as ApiError).status === 415) {
          window.console.log('JSON format rejected, trying form data');
          
          // Try with form data as a fallback
          const formData = new FormData();
          if (title) {
            formData.append('title', title);
          }
          
          const response = await fetchClient.post<Conversation>('/chat/conversations/', formData);
          window.console.log('Created conversation with FormData format');
          return response.data;
        } else {
          // Not a content type issue, rethrow
          throw jsonError;
        }
      }
    } catch (error) {
      window.console.error('Failed to create conversation:', error);
      throw error;
    }
  },

  updateConversation: async ({ id, title }: { id: string; title: string }): Promise<Conversation> => {
    const response = await fetchClient.patch<Conversation>(`/chat/conversations/${id}/`, { title });
    return response.data;
  },

  archiveConversation: async (id: string): Promise<Conversation> => {
    const response = await fetchClient.patch<Conversation>(`/chat/conversations/${id}/`, { is_archived: true });
    return response.data;
  },

  unarchiveConversation: async (id: string): Promise<Conversation> => {
    const response = await fetchClient.patch<Conversation>(`/chat/conversations/${id}/`, { is_archived: false });
    return response.data;
  },

  deleteConversation: async (id: string): Promise<void> => {
    await fetchClient.delete(`/chat/conversations/${id}/`);
  },

  getMessages: async (conversationId: string): Promise<Message[]> => {
    const response = await fetchClient.get<Message[]>(`/chat/conversations/${conversationId}/messages/`);
    return response.data;
  },

  sendMessage: async ({ conversationId, content }: { conversationId: string; content: string }): Promise<Message> => {
    try {
      // Try with JSON content type first
      try {
        const response = await fetchClient.post<Message>(
          `/chat/conversations/${conversationId}/messages/`, 
          { content },
          {
            headers: { 'Content-Type': 'application/json' }
          }
        );
        window.console.log('Message sent with JSON format');
        return response.data;
      } catch (jsonError) {
        // Check if it's a content type issue (415)
        type ApiError = { status: number; message: string };
        
        if (typeof jsonError === 'object' && jsonError && 
            'status' in jsonError && 
            (jsonError as ApiError).status === 415) {
          window.console.log('JSON format rejected, trying form data');
          
          // Try with form data as a fallback
          const formData = new FormData();
          formData.append('content', content);
          
          const response = await fetchClient.post<Message>(
            `/chat/conversations/${conversationId}/messages/`, 
            formData
          );
          window.console.log('Message sent with FormData format');
          return response.data;
        } else {
          // Not a content type issue, rethrow
          throw jsonError;
        }
      }
    } catch (error) {
      window.console.error('Failed to send message:', error);
      throw error;
    }
  },

  // Stream a response from the AI assistant (renamed from streamMessage)
  streamResponse: async (
    { conversationId, content, onChunk }: 
    { conversationId: string; content: string; onChunk: (chunk: string) => void }
  ): Promise<void> => {
    try {
      if (import.meta.env.DEV) {
        window.console.log(`Streaming response for conversation ${conversationId}`);
      }
      
      // Basic validation to prevent obvious errors
      if (!conversationId) {
        onChunk("Error: Missing conversation ID");
        throw new Error('Missing conversation ID');
      }
      
      // First send the message normally to ensure it's saved
      try {
        await chatApi.sendMessage({ conversationId, content });
        window.console.log("Message sent successfully, now streaming AI response");
      } catch (sendError) {
        window.console.error("Failed to send message:", sendError);
        // Continue with streaming anyway - the conversation may still exist
      }
      
      // Set initial state - show "Thinking..." immediately
      onChunk("Thinking...");
      
      // Track full content
      let fullContent = "";

      // Try streaming with different content types if needed
      try {
        // Try with JSON content type first
        await fetchClient.stream<SSEMessage>(
          `/chat/conversations/${conversationId}/responses/stream/`,
          { content },
          {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'text/event-stream',
            }
          },
          (data) => {
            if (data.type === 'token' && data.content) {
              // If this is the first real content, clear "Thinking..."
              if (fullContent === "") {
                // Clear the thinking indicator before adding content
                onChunk("");
              }
              
              // Append to our tracking variable and send just the new token
              fullContent += data.content;
              onChunk(data.content);
            } else if (data.type === 'error') {
              window.console.error('Error from server:', data.content);
              onChunk(`\n\nError: ${data.content}`);
            }
          }
        );
      } catch (streamError) {
        // Check if it's a content type issue (415)
        type ApiError = { status: number; message: string };
        
        if (typeof streamError === 'object' && streamError && 
            'status' in streamError && 
            (streamError as ApiError).status === 415) {
          window.console.log('JSON stream format rejected, trying form data');
          
          // Try with form data as a fallback
          const formData = new FormData();
          formData.append('content', content);
          
          await fetchClient.stream<SSEMessage>(
            `/chat/conversations/${conversationId}/responses/stream/`,
            formData,
            {
              headers: {
                'Accept': 'text/event-stream',
              }
            },
            (data) => {
              if (data.type === 'token' && data.content) {
                // If this is the first real content, clear "Thinking..."
                if (fullContent === "") {
                  // Clear the thinking indicator before adding content
                  onChunk("");
                }
                
                // Append to our tracking variable and send just the new token
                fullContent += data.content;
                onChunk(data.content);
              } else if (data.type === 'error') {
                window.console.error('Error from server:', data.content);
                onChunk(`\n\nError: ${data.content}`);
              }
            }
          );
        } else {
          // If it's not a content type issue, rethrow
          throw streamError;
        }
      }
    } catch (error) {
      window.console.error('Error streaming response:', error);
      onChunk("\n\nError: Unable to stream response. Please try again.");
    }
  },

  updateMessage: async ({ id, content }: { id: string; content: string }): Promise<Message> => {
    const response = await fetchClient.patch<Message>(`/chat/messages/${id}/`, { content });
    return response.data;
  },

  deleteMessage: async (id: string): Promise<void> => {
    await fetchClient.delete(`/chat/messages/${id}/`);
  },
};

// News API endpoints
export const newsApi = {
  getNews: async (): Promise<NewsItem[]> => {
    const response = await fetchClient.get<NewsItem[]>('/news/');
    return response.data;
  },
}; 