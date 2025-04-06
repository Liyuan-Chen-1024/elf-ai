import { Conversation, Message } from '../types';
import fetchClient from './fetchClient';

// Types for streaming response chunks
interface StreamingChunkBase {
  type: string;
  message_id: string;
}

interface StreamingStart extends StreamingChunkBase {
  type: 'start';
}

interface StreamingChunk extends StreamingChunkBase {
  type: 'chunk';
  content: string;
}

interface StreamingEnd extends StreamingChunkBase {
  type: 'end';
  content: string;
}

interface StreamingError extends StreamingChunkBase {
  type: 'error';
  error: string;
}

export type StreamingResponse = 
  | StreamingStart
  | StreamingChunk
  | StreamingEnd
  | StreamingError;

// Super simple global state for streaming content
export const streamState = {
  // Map of message IDs to their content
  contents: new Map<string, string>(),
  
  // Set content for a message
  setContent(messageId: string, content: string) {
    this.contents.set(messageId, content);
    window.console.log(`Updated content for ${messageId}, length: ${content.length}`);
  },
  
  // Get content for a message
  getContent(messageId: string): string {
    return this.contents.get(messageId) || '';
  },
  
  // Clear content for a message
  clearContent(messageId: string) {
    this.contents.delete(messageId);
  }
};

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
    const response = await fetchClient.post<Conversation>('/chat/conversations/', {});
    return response.data;
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
    onStream?: (conversationId: string, messageId: string, chunk: StreamingResponse | string) => void;
  }): Promise<{ user_message: Message; agent_message: Message }> => {
    // Send the message
    const response = await fetchClient.post<{ user_message: Message; agent_message: Message }>(
      `/chat/conversations/${conversationId}/messages/`, 
      { content }
    );

    // Only setup streaming if callback was provided
    if (onStream) {
      const agentMessageId = response.data.agent_message.id;
      fetchClient.stream(
        `/chat/conversations/${conversationId}/messages/${agentMessageId}/stream/`,
        {
          headers: {
            'Content-Type': 'application/json',
          }
        },
        (chunk) => {
          onStream(conversationId, agentMessageId, chunk);
        }
      );
    }
    return response.data;
  }
};
