import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { Conversation, Message } from '../types';

// API base URL - use environment variable or default to localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// Cast axios to any to avoid TypeScript errors
const api = (axios as any).create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Use token from localStorage or environment variable
const envToken = import.meta.env.VITE_AUTH_TOKEN;
const storedToken = localStorage.getItem('token');
const token = storedToken || envToken;

if (token) {
  console.log('Setting chat API token:', token);
  // Django REST Framework typically expects "Token" format unless using JWT
  api.defaults.headers.common['Authorization'] = `Token ${token}`;
  
  // Save the token to localStorage if it came from env
  if (envToken && !storedToken) {
    localStorage.setItem('token', envToken);
  }
}

// Create axios interceptor to add the token to every request
api.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    const currentToken = localStorage.getItem('token') || import.meta.env.VITE_AUTH_TOKEN;
    if (currentToken) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Token ${currentToken}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Chat API methods - all connect directly to the backend
export const chatApi = {
  // Get a specific conversation
  getConversation: async (conversationId: string | number): Promise<Conversation> => {
    try {
      const response = await api.get(`/chat/conversations/${conversationId}/`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch conversation ${conversationId}:`, error);
      throw error;
    }
  },

  // Get all conversations
  getConversations: async (): Promise<Conversation[]> => {
    try {
      const response = await api.get('/chat/conversations/');
      
      // Handle paginated response format
      if (response.data && response.data.results) {
        console.log('Received paginated conversations:', response.data);
        return response.data.results;
      }
      // Handle non-paginated format (direct array)
      return response.data;
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      throw error;
    }
  },

  // Get messages for a conversation
  getMessages: async (conversationId: string | number): Promise<Message[]> => {
    try {
      const response = await api.get(`/chat/conversations/${conversationId}/messages/`);
      
      // Handle paginated response format
      if (response.data && response.data.results) {
        console.log('Received paginated messages:', response.data);
        return response.data.results;
      }
      // Handle non-paginated format (direct array)
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch messages for conversation ${conversationId}:`, error);
      throw error;
    }
  },

  // Create a new conversation
  createConversation: async (title: string): Promise<Conversation> => {
    try {
      const response = await api.post('/chat/conversations/', { title });
      return response.data;
    } catch (error) {
      console.error('Failed to create conversation:', error);
      throw error;
    }
  },

  // Update a conversation (used for renaming)
  updateConversation: async (conversationId: string | number, title: string): Promise<Conversation> => {
    try {
      const response = await api.put(`/chat/conversations/${conversationId}/`, { title });
      return response.data;
    } catch (error) {
      console.error(`Failed to update conversation ${conversationId}:`, error);
      throw error;
    }
  },

  // Send a message - alias for createMessage for simplicity
  sendMessage: async (conversationId: string | number, content: string): Promise<Message> => {
    try {
      const response = await api.post(`/chat/conversations/${conversationId}/messages/`, { content });
      return response.data;
    } catch (error) {
      console.error(`Failed to send message to conversation ${conversationId}:`, error);
      throw error;
    }
  },

  // Create a message in a conversation
  createMessage: async (conversationId: string | number, content: string): Promise<Message> => {
    try {
      const response = await api.post(`/chat/conversations/${conversationId}/messages/`, { content });
      
      // Transform the API response to ensure correct sender format
      if (response.data) {
        return {
          ...response.data,
          // Ensure assistant messages have correct sender information
          sender: { 
            id: 'assistant', 
            name: 'Elf Agent' 
          }
        };
      }
      
      throw new Error('Invalid response format');
    } catch (error) {
      console.error(`Failed to create message in conversation ${conversationId}:`, error);
      throw error;
    }
  },

  // Edit a message
  editMessage: async (messageId: string | number, content: string): Promise<Message> => {
    try {
      const response = await api.put(`/chat/messages/${messageId}/`, { content });
      return response.data;
    } catch (error) {
      console.error(`Failed to edit message ${messageId}:`, error);
      throw error;
    }
  },

  // Update a message - alias for editMessage for consistency
  updateMessage: async (messageId: string | number, content: string): Promise<Message> => {
    return chatApi.editMessage(messageId, content);
  },

  // Delete a message
  deleteMessage: async (messageId: string | number): Promise<void> => {
    try {
      await api.delete(`/chat/messages/${messageId}/`);
    } catch (error) {
      console.error(`Failed to delete message ${messageId}:`, error);
      throw error;
    }
  },

  // Rename a conversation
  renameConversation: async (conversationId: string | number, title: string): Promise<Conversation> => {
    try {
      const response = await api.put(`/chat/conversations/${conversationId}/`, { title });
      return response.data;
    } catch (error) {
      console.error(`Failed to rename conversation ${conversationId}:`, error);
      throw error;
    }
  },

  // Archive a conversation
  archiveConversation: async (conversationId: string | number): Promise<Conversation> => {
    try {
      const response = await api.post(`/chat/conversations/${conversationId}/archive/`);
      return response.data;
    } catch (error) {
      console.error(`Failed to archive conversation ${conversationId}:`, error);
      throw error;
    }
  },

  // Unarchive a conversation
  unarchiveConversation: async (conversationId: string | number): Promise<Conversation> => {
    try {
      const response = await api.post(`/chat/conversations/${conversationId}/unarchive/`);
      return response.data;
    } catch (error) {
      console.error(`Failed to unarchive conversation ${conversationId}:`, error);
      throw error;
    }
  },

  // Delete a conversation
  deleteConversation: async (conversationId: string | number): Promise<void> => {
    try {
      await api.delete(`/chat/conversations/${conversationId}/`);
    } catch (error) {
      console.error(`Failed to delete conversation ${conversationId}:`, error);
      throw error;
    }
  },

  // Search conversations
  searchConversations: async (query: string): Promise<Conversation[]> => {
    try {
      const response = await api.get('/chat/conversations/search/', { params: { query } });
      
      // Handle paginated response format
      if (response.data && response.data.results) {
        console.log('Received paginated conversation search results:', response.data);
        return response.data.results;
      }
      // Handle non-paginated format (direct array)
      return response.data;
    } catch (error) {
      console.error('Failed to search conversations:', error);
      throw error;
    }
  },

  // Generate title for a conversation
  generateTitle: async (conversationId: string | number): Promise<string> => {
    try {
      const response = await api.post(`/chat/conversations/${conversationId}/generate-title/`);
      return response.data.title;
    } catch (error) {
      console.error(`Failed to generate title for conversation ${conversationId}:`, error);
      throw error;
    }
  },

  // Search messages in a conversation
  searchMessages: async (conversationId: string | number, query: string): Promise<Message[]> => {
    try {
      const response = await api.get(`/chat/conversations/${conversationId}/messages/search/`, {
        params: { query }
      });
      
      // Handle paginated response format
      if (response.data && response.data.results) {
        console.log('Received paginated search results:', response.data);
        return response.data.results;
      }
      // Handle non-paginated format (direct array)
      return response.data;
    } catch (error) {
      console.error(`Failed to search messages in conversation ${conversationId}:`, error);
      throw error;
    }
  },

  // Stream a message (for real-time updates)
  streamMessage: async (
    conversationId: string | number, 
    content: string,
    callbacks: {
      onToken: (token: string, messageId: string, status: string) => void;
      onComplete: () => void;
      onError: (error: any) => void;
    }
  ) => {
    let retryCount = 0;
    const maxRetries = 3;
    const baseDelay = 1000; // Start with 1 second delay
    
    const attemptStream = async () => {
      try {
        const token = localStorage.getItem('token');
        console.log('Starting message stream...');
        
        const response = await fetch(`${API_BASE_URL}/chat/conversations/${conversationId}/stream_message/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${token}`
          },
          body: JSON.stringify({ content }),
        });

        // Handle rate limiting
        if (response.status === 429) {
          if (retryCount < maxRetries) {
            const delay = baseDelay * Math.pow(2, retryCount);
            console.log(`Rate limited. Retrying in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
            retryCount++;
            
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, delay));
            return attemptStream();
          } else {
            throw new Error('Rate limit exceeded. Please try again later.');
          }
        }

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Set up the SSE reader
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('ReadableStream not supported');
        }

        const decoder = new TextDecoder();
        let buffer = '';
        let messageIdReceived = '';

        const processStream = async () => {
          console.log('Processing stream...');
          try {
            while (true) {
              const { done, value } = await reader.read();
              
              if (done) {
                console.log('Stream completed');
                callbacks.onComplete();
                break;
              }
              
              const chunk = decoder.decode(value, { stream: true });
              console.log('Received chunk:', chunk);
              buffer += chunk;
              
              // Process all complete events (separated by double newline)
              const lines = buffer.split('\n\n');
              buffer = lines.pop() || '';
              
              for (const line of lines) {
                if (!line.trim() || !line.startsWith('data:')) continue;
                
                try {
                  const jsonStr = line.slice(5).trim();
                  console.log('Parsing JSON:', jsonStr);
                  const data = JSON.parse(jsonStr);
                  
                  // Save message ID if we receive one
                  if (data.messageId) {
                    messageIdReceived = data.messageId;
                  }
                  
                  if (data.type === 'token') {
                    // Token by token updates
                    console.log('Token update:', data.content);
                    callbacks.onToken(
                      data.content || '', 
                      messageIdReceived || '', 
                      data.status || 'generating'
                    );
                  } else if (data.type === 'update') {
                    // Full content replacement
                    console.log('Full content update:', data.content);
                    callbacks.onToken(
                      data.content || '', 
                      messageIdReceived || '', 
                      'complete'
                    );
                  } else if (data.type === 'done') {
                    // Stream is complete
                    console.log('Stream done signal received');
                    callbacks.onComplete();
                  }
                } catch (e) {
                  console.error('Error parsing SSE data:', e, line);
                }
              }
            }
          } catch (e) {
            console.error('Error in processStream:', e);
            callbacks.onError(e);
          }
        };

        processStream();

        return {
          close: () => {
            console.log('Closing stream...');
            reader.cancel();
          }
        };
      } catch (error) {
        console.error(`Failed to stream message to conversation ${conversationId}:`, error);
        
        // If we have retries left and it's a network error, retry
        if (retryCount < maxRetries && 
            (error instanceof TypeError || 
             (error instanceof Error && error.message.includes('network')))) {
          const delay = baseDelay * Math.pow(2, retryCount);
          console.log(`Network error. Retrying in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
          retryCount++;
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, delay));
          return attemptStream();
        }
        
        callbacks.onError(error);
        return Promise.reject(error);
      }
    };
    
    return attemptStream();
  }
}; 