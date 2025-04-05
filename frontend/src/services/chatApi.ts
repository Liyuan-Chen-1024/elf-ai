import { Conversation, Message } from '../types';
import fetchClient from './fetchClient';
import { SSEMessage } from './types';

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

  createConversation: async ({ title }: { title?: string } = {}): Promise<Conversation> => {
    const response = await fetchClient.post<Conversation>('/chat/conversations/', { title }, {
      headers: { 'Content-Type': 'application/json' }
    });
    return response.data;
  },

  updateConversation: async ({ id, title }: { id: string; title: string }): Promise<Conversation> => {
    const response = await fetchClient.patch<Conversation>(`/chat/conversations/${id}/`, { title });
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
    const response = await fetchClient.post<Message>(
      `/chat/conversations/${conversationId}/messages/`, 
      { content },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
    window.console.log('Message sent with JSON format');
    return response.data;
  },

  streamMessage: async (
    { conversationId, messageId, content, onChunk }: 
    { conversationId: string; messageId: string; content: string; onChunk: (chunk: string) => void }
  ): Promise<void> => {
    let fullContent = '';
    await fetchClient.stream<SSEMessage>(
      `/chat/conversations/${conversationId}/messages/${messageId}/stream/`,
      { content },
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream, application/json',
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
  }

};
