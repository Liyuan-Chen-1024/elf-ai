import axios from 'axios';
import { API_BASE_URL, ApiClient } from '../../../shared/api/api-client';
import type { Conversation } from '../types';

// Create an axios instance
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

interface ConversationListResponse {
  results: Conversation[];
}

interface TitleResponse {
  title: string;
}

/**
 * Conversations API service for managing chat conversations
 */
export class ConversationsApi extends ApiClient {
  /**
   * Get all active conversations
   */
  async getConversations(): Promise<Conversation[]> {
    this.ensureAuthenticated();
    return this.throttleRequest('get-conversations', async () => {
      const response = await axiosInstance.get<ConversationListResponse>(`/chat/conversations/`, {
        headers: {
          Authorization: `Token ${this.authToken}`,
        },
      });
      return response.data.results;
    });
  }

  /**
   * Get archived conversations
   */
  async getArchivedConversations(): Promise<Conversation[]> {
    this.ensureAuthenticated();
    console.log("Fetching archived conversations...");
    return this.throttleRequest('get-archived-conversations', async () => {
      const response = await axiosInstance.get<ConversationListResponse>(`/chat/conversations/archived/`, {
        headers: {
          Authorization: `Token ${this.authToken}`,
        },
      });
      console.log("Archived conversations response:", response);
      return response.data.results || [];
    });
  }

  /**
   * Get a single conversation by ID
   */
  async getConversation(id: number): Promise<Conversation> {
    this.ensureAuthenticated();
    const response = await axiosInstance.get<Conversation>(`/chat/conversations/${id}/`, {
      headers: {
        Authorization: `Token ${this.authToken}`,
      },
    });
    return response.data;
  }

  /**
   * Create a new conversation
   */
  async createConversation(title: string): Promise<Conversation> {
    this.ensureAuthenticated();
    return this.throttleRequest(`create-conversation-${title}`, async () => {
      const response = await axiosInstance.post<Conversation>(`/chat/conversations/`, { title }, {
        headers: {
          Authorization: `Token ${this.authToken}`,
        },
      });
      return response.data;
    });
  }

  /**
   * Update an existing conversation
   */
  async updateConversation(id: number, title: string): Promise<Conversation> {
    this.ensureAuthenticated();
    const response = await axiosInstance.put<Conversation>(`/chat/conversations/${id}/`, { title }, {
      headers: {
        Authorization: `Token ${this.authToken}`,
      },
    });
    return response.data;
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(id: number): Promise<void> {
    this.ensureAuthenticated();
    await axiosInstance.delete(`/chat/conversations/${id}/`, {
      headers: {
        Authorization: `Token ${this.authToken}`,
      },
    });
  }

  /**
   * Archive a conversation
   */
  async archiveConversation(id: number): Promise<Conversation> {
    this.ensureAuthenticated();
    const response = await axiosInstance.post<Conversation>(`/chat/conversations/${id}/archive/`, {}, {
      headers: {
        Authorization: `Token ${this.authToken}`,
      },
    });
    return response.data;
  }

  /**
   * Unarchive a conversation
   */
  async unarchiveConversation(id: number): Promise<Conversation> {
    this.ensureAuthenticated();
    const response = await axiosInstance.post<Conversation>(`/chat/conversations/${id}/unarchive/`, {}, {
      headers: {
        Authorization: `Token ${this.authToken}`,
      },
    });
    return response.data;
  }

  /**
   * Generate a title for a conversation
   */
  async generateTitle(conversationId: number): Promise<string> {
    this.ensureAuthenticated();
    const response = await axiosInstance.post<TitleResponse>(`/chat/conversations/${conversationId}/generate_title/`, {}, {
      headers: {
        Authorization: `Token ${this.authToken}`,
      },
    });
    return response.data.title;
  }

  /**
   * Search conversations
   */
  async searchConversations(query: string): Promise<Conversation[]> {
    this.ensureAuthenticated();
    try {
      const response = await axiosInstance.get<ConversationListResponse>(`/chat/conversations/search/?q=${query}`, {
        headers: {
          Authorization: `Token ${this.authToken}`,
        },
      });
      return response.data.results || [];
    } catch (error) {
      console.error('Error searching conversations:', error);
      return [];
    }
  }

  /**
   * Get a conversation's title
   */
  async getConversationTitle(id: number): Promise<string> {
    this.ensureAuthenticated();
    const response = await axiosInstance.get<TitleResponse>(`/chat/conversations/${id}/title/`, {
      headers: {
        Authorization: `Token ${this.authToken}`,
      },
    });
    return response.data.title;
  }
}

export const conversationsApi = new ConversationsApi(); 