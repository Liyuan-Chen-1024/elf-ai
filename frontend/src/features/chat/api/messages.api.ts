import axios from 'axios';
import type { AxiosInstance } from 'axios';
import { API_BASE_URL, ApiClient } from '../../../shared/api/api-client';
import { Message, Conversation, UUID } from '../types';

interface MessageListResponse {
  results: Message[];
}

interface ConversationListResponse {
  results: Conversation[];
}

interface AssistantMessageResponse {
  assistant_message: Message;
}

interface APIMessage extends Omit<Message, 'timestamp'> {
  timestamp?: string;
  createdAt?: string;
}

interface APIMessageListResponse {
  results: APIMessage[];
}

/**
 * Messages API service for handling chat messages
 */
export class MessagesApi extends ApiClient {
  constructor() {
    super();
  }

  /**
   * Get all conversations
   */
  async getConversations(): Promise<Conversation[]> {
    this.ensureAuthenticated();
    console.log('Fetching conversations...');
    try {
      const response = await this.getAxiosInstance().get<ConversationListResponse>(
        `${API_BASE_URL}/chat/conversations/`,
        {
          headers: {
            Authorization: `Token ${this.authToken}`,
          },
        }
      );
      console.log('Raw conversations response:', response);
      return response.data.results;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  }

  /**
   * Get messages for a conversation
   */
  async getMessages(conversationId: UUID): Promise<Message[]> {
    this.ensureAuthenticated();
    console.log('Fetching messages for conversation:', conversationId);
    try {
      const response = await this.getAxiosInstance().get<APIMessageListResponse>(`${API_BASE_URL}/chat/messages/`, {
        params: { conversation_id: conversationId },
        headers: {
          Authorization: `Token ${this.authToken}`,
        },
      });
      console.log('Raw API response:', response);
      console.log('Response data:', response.data);
      
      // Transform messages to ensure they match our interface
      const messages = response.data.results.map(msg => ({
        ...msg,
        sender: msg.sender || { 
          id: msg.role === 'user' ? 'user' : 'assistant',
          name: msg.role === 'user' ? 'User' : 'Assistant'
        },
        timestamp: msg.timestamp || msg.createdAt || new Date().toISOString(),
        isEdited: msg.isEdited || false,
        role: msg.role || (msg.sender?.id === 'user' ? 'user' : 'assistant'),
      }));
      
      console.log('Transformed messages:', messages);
      return messages;
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }

  /**
   * Get a single message
   */
  async getMessage(conversationId: UUID, messageId: UUID): Promise<Message> {
    this.ensureAuthenticated();
    const response = await this.getAxiosInstance().get<Message>(
      `${API_BASE_URL}/chat/conversations/${conversationId}/messages/${messageId}/`,
      {
        headers: {
          Authorization: `Token ${this.authToken}`,
        },
      }
    );
    return response.data;
  }

  /**
   * Stream a message to a conversation
   * This is the primary method for sending messages
   */
  async streamMessage(
    conversationId: UUID,
    content: string,
    onToken: (token: string) => void,
    onError: (error: string) => void,
    onComplete: () => void
  ): Promise<void> {
    this.ensureAuthenticated();
    
    try {
      const response = await fetch(`${API_BASE_URL}/chat/conversations/${conversationId}/stream_message/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          'Authorization': `Token ${this.authToken}`,
        },
        body: JSON.stringify({ content })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No reader available');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              switch (data.type) {
                case 'token':
                  onToken(data.content);
                  break;
                case 'error':
                  onError(data.content);
                  break;
                case 'done':
                  onComplete();
                  return;
              }
            } catch (error) {
              console.error('Error parsing SSE data:', error);
              onError('Failed to parse server response');
            }
          }
        }
      }
    } catch (error) {
      console.error('Error streaming message:', error);
      onError(error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  /**
   * Update an existing message
   */
  async updateMessage(messageId: UUID, content: string): Promise<Message> {
    this.ensureAuthenticated();
    const response = await this.getAxiosInstance().put<Message>(`${API_BASE_URL}/chat/messages/${messageId}/`, { content }, {
      headers: {
        Authorization: `Token ${this.authToken}`,
      },
    });
    return response.data;
  }

  /**
   * Delete a message
   */
  async deleteMessage(messageId: UUID): Promise<void> {
    this.ensureAuthenticated();
    await this.getAxiosInstance().delete(`${API_BASE_URL}/chat/messages/${messageId}/`, {
      headers: {
        Authorization: `Token ${this.authToken}`,
      },
    });
  }

  /**
   * Archive a conversation
   */
  async archiveConversation(conversationId: UUID): Promise<void> {
    this.ensureAuthenticated();
    await this.getAxiosInstance().post(`${API_BASE_URL}/chat/conversations/${conversationId}/archive/`, null, {
      headers: {
        Authorization: `Token ${this.authToken}`,
      },
    });
  }

  /**
   * Unarchive a conversation
   */
  async unarchiveConversation(conversationId: UUID): Promise<void> {
    this.ensureAuthenticated();
    await this.getAxiosInstance().post(`${API_BASE_URL}/chat/conversations/${conversationId}/unarchive/`, null, {
      headers: {
        Authorization: `Token ${this.authToken}`,
      },
    });
  }

  /**
   * Rename a conversation
   */
  async renameConversation(conversationId: UUID, title: string): Promise<void> {
    this.ensureAuthenticated();
    await this.getAxiosInstance().put(`${API_BASE_URL}/chat/conversations/${conversationId}/`, { title }, {
      headers: {
        Authorization: `Token ${this.authToken}`,
      },
    });
  }
}

export const messagesApi = new MessagesApi(); 