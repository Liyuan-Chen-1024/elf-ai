import { Conversation, Message } from '../types';
import fetchClient from './fetchClient';
import { SSEMessage } from './types';

// Global state for streaming messages
// This is a direct approach that bypasses React Query's caching
export const streamState = {
  activeStreams: new Map<string, string>(),
  listeners: new Set<(messageId: string, content: string) => void>(),

  // Add content to a streaming message
  addContent(messageId: string, chunk: string) {
    const currentContent = this.activeStreams.get(messageId) || '';
    const newContent = currentContent + chunk;
    
    console.log(`Adding chunk to message ${messageId}:`, {
      currentContent,
      chunkToAdd: chunk,
      newContent
    });
    
    this.activeStreams.set(messageId, newContent);
    
    // Notify listeners about the content update - do this asynchronously
    // to avoid blocking the main thread
    setTimeout(() => {
      this.listeners.forEach(listener => {
        try {
          listener(messageId, newContent);
        } catch (error) {
          console.error('Error in stream listener:', error);
        }
      });
    }, 0);
  },

  // Subscribe to content updates
  subscribe(callback: (messageId: string, content: string) => void) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  },

  // Mark a stream as complete
  completeStream(messageId: string) {
    // Keep the content but mark it as complete
    this.listeners.forEach(listener => listener(messageId, '[DONE]'));
  }
};

// Get API URL from environment or use default
const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Log the API URL in development mode
if (import.meta.env.DEV) {
  window.console.log('🔧 API Base URL configured as:', apiBaseUrl);
}

interface PaginatedResponse<T> {
  results: T[];
}

// Chat API endpoints
export const chatApi = {
  getConversations: async (): Promise<Conversation[]> => {
    const response = await fetchClient.get<PaginatedResponse<Conversation>>('/chat/conversations/');
    return response.data.results;
  },

  getConversation: async (id: string): Promise<Conversation> => {
    const response = await fetchClient.get<Conversation>(`/chat/conversations/${id}/`);
    return response.data;
  },

  createConversation: async (): Promise<Conversation> => {
    try {
      const response = await fetchClient.post<Conversation>('/chat/conversations/');
      
      if (!response.data || typeof response.data !== 'object') {
        console.error('Invalid response from create conversation', response);
        throw new Error('Invalid server response');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  },

  updateConversation: async ({ id, title }: { id: string; title: string }): Promise<Conversation> => {
    const response = await fetchClient.patch<Conversation>(`/chat/conversations/${id}/`, { title });
    return response.data;
  },

  deleteConversation: async (id: string): Promise<string> => {
    await fetchClient.delete(`/chat/conversations/${id}/`);
    return id;
  },

  getMessages: async (conversationId: string): Promise<Message[]> => {
    const response = await fetchClient.get<Message[]>(`/chat/conversations/${conversationId}/messages/`);
    return response.data;
  },

  sendMessage: async ({ 
    conversationId, 
    content,
    onStream
  }: { 
    conversationId: string; 
    content: string;
    onStream?: (chunk: string) => void;
  }): Promise<{ user_message: Message; agent_message: Message }> => {
    try {
      // Send the message
      const response = await fetchClient.post<{ user_message: Message; agent_message: Message }>(
        `/chat/conversations/${conversationId}/messages/`, 
        { content },
        {
          headers: { 'Content-Type': 'application/json' }
        }
      );

      // Validate response format
      if (!response.data || !response.data.user_message || !response.data.agent_message) {
        console.error('Invalid response format from sendMessage:', response);
        throw new Error('Invalid response format from server');
      }

      // Find any message that is currently generating
      const generatingMessage = [response.data.user_message, response.data.agent_message]
        .find(msg => msg.is_generating);

      // If a message is generating and we have a stream callback, start streaming
      if (generatingMessage && onStream) {
        console.log(`Starting stream for message ${generatingMessage.id}`);

        try {
          // Start the stream
          await fetchClient.stream<SSEMessage>(
            `/chat/conversations/${conversationId}/messages/${generatingMessage.id}/stream/`,
            { content },
            {
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'text/event-stream, application/json',
              }
            },
            (data) => {
              if (data.type === 'token' && data.content) {
                // Forward the token to the callback
                onStream(data.content);
              } else if (data.type === 'error') {
                console.error('Error from server:', data.content);
                onStream(`\n\nError: ${data.content}`);
              } else if (data.type === 'done') {
                console.log('Stream complete');
                onStream('[DONE]');
              }
            }
          );
        } catch (streamError) {
          console.error('Error during streaming:', streamError);
          // Don't re-throw, just log the error to continue with the flow
        }
      }

      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }
};
