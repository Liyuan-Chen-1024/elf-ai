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
      const url = `${API_BASE_URL}/chat/conversations/${conversationId}/stream_message/`;
      console.log('Starting stream request to:', url);
      
      // Get the token from localStorage
      const authToken = localStorage.getItem('authToken') || localStorage.getItem('token');
      
      // Get CSRF token from cookies
      const csrfToken = this.getCsrfToken();
      console.log('Using CSRF token:', csrfToken || 'none available');
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Token ${authToken}`,
      };
      
      // Add CSRF token if available
      if (csrfToken) {
        headers['X-CSRFToken'] = csrfToken;
      }
      
      console.log('Request headers:', headers);
      
      const response = await fetch(url, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ content })
      });

      console.log('Stream response status:', response.status);
      
      if (!response.ok) {
        const errorMessage = `HTTP error! status: ${response.status}`;
        console.error('Stream request failed:', errorMessage);
        onError(errorMessage);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        onError('No reader available');
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log('Stream complete');
          onComplete();
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        console.log('Received chunk:', chunk);
        buffer += chunk;
        
        // Process complete SSE messages (they end with double newlines)
        const messages = buffer.split('\n\n');
        buffer = messages.pop() || ''; // Keep any incomplete message
        
        for (const message of messages) {
          if (!message.trim()) continue;
          
          // SSE messages start with "data: "
          if (message.startsWith('data: ')) {
            try {
              const data = JSON.parse(message.slice(6));
              console.log('Parsed SSE data:', data);
              
              if (data.type === 'token' && data.content) {
                onToken(data.content);
              } else if (data.type === 'error') {
                onError(data.content || 'Unknown error');
              } else if (data.type === 'done') {
                onComplete();
                return;
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error in streamMessage:', error);
      onError(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Get CSRF token from cookies specifically
   */
  private getCsrfToken(): string | null {
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
    return cookieValue;
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

  /**
   * Create a new conversation
   */
  async createConversation(title?: string): Promise<Conversation> {
    this.ensureAuthenticated();
    console.log('Creating conversation with title:', title);
    try {
      const response = await this.getAxiosInstance().post<Conversation>(
        `${API_BASE_URL}/chat/conversations/`,
        { title: title || 'New conversation' },
        {
          headers: {
            Authorization: `Token ${this.authToken}`,
          },
        }
      );
      console.log('Created conversation:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(conversationId: UUID): Promise<void> {
    this.ensureAuthenticated();
    console.log('Deleting conversation:', conversationId);
    try {
      await this.getAxiosInstance().delete(
        `${API_BASE_URL}/chat/conversations/${conversationId}/`,
        {
          headers: {
            Authorization: `Token ${this.authToken}`,
          },
        }
      );
      console.log('Successfully deleted conversation:', conversationId);
    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw error;
    }
  }
}

export const messagesApi = new MessagesApi(); 