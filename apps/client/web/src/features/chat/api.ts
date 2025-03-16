import axios, { AxiosError } from 'axios';
import { Conversation, Message } from './types';

const API_BASE_URL = 'http://localhost:8000/api/v1';

// Configure axios to include credentials (cookies)
axios.defaults.withCredentials = true;

// Add retry logic with exponential backoff for rate limit errors
const retryWithBackoff = async <T>(fn: () => Promise<T>, maxRetries = 3, initialDelay = 500): Promise<T> => {
  let retries = 0;
  let delay = initialDelay;

  const execute = async (): Promise<T> => {
    try {
      return await fn();
    } catch (error: unknown) {
      const axiosError = error as AxiosError;
      if (axiosError.response && axiosError.response.status === 429 && retries < maxRetries) {
        console.log(`Rate limited, retrying in ${delay}ms (${retries + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        retries++;
        delay *= 2; // Exponential backoff
        return execute();
      }
      throw error;
    }
  };

  return execute();
};

// Add request throttling to prevent too many requests
const pendingRequests = new Map<string, Promise<any>>();
const throttleRequest = async <T>(key: string, requestFn: () => Promise<T>): Promise<T> => {
  // If there's already a pending request with this key, return that promise
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key) as Promise<T>;
  }
  
  // Otherwise, create a new request and store the promise
  try {
    // Add retry logic with exponential backoff
    const promise = retryWithBackoff(requestFn);
    pendingRequests.set(key, promise);
    const result = await promise;
    // Wait a bit before allowing another request with the same key
    setTimeout(() => {
      pendingRequests.delete(key);
    }, 500);
    return result;
  } catch (error) {
    pendingRequests.delete(key);
    throw error;
  }
};

class ChatApi {
  private authToken: string | null = null;

  // Authentication methods
  async login(username: string, password: string): Promise<string> {
    const response = await axios.post(`${API_BASE_URL}/auth/token/`, { username, password });
    const token = response.data.token;
    this.setAuthToken(token);
    return token;
  }

  logout(): void {
    this.setAuthToken(null);
  }

  setAuthToken(token: string | null): void {
    this.authToken = token;
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Token ${token}`;
      localStorage.setItem('authToken', token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('authToken');
    }
  }

  // Conversation methods
  async getConversations(): Promise<Conversation[]> {
    return throttleRequest('get-conversations', async () => {
      const response = await axios.get(`${API_BASE_URL}/chat/conversations/`);
      return response.data.results;
    });
  }

  async getConversation(id: number): Promise<Conversation> {
    const response = await axios.get(`${API_BASE_URL}/chat/conversations/${id}/`);
    return response.data;
  }

  async createConversation(title: string): Promise<Conversation> {
    return throttleRequest(`create-conversation-${title}`, async () => {
      const response = await axios.post(`${API_BASE_URL}/chat/conversations/`, { title });
      return response.data;
    });
  }

  async updateConversation(id: number, title: string): Promise<Conversation> {
    const response = await axios.put(`${API_BASE_URL}/chat/conversations/${id}/`, { title });
    return response.data;
  }

  async deleteConversation(id: number): Promise<void> {
    await axios.delete(`${API_BASE_URL}/chat/conversations/${id}/`);
  }

  // Message methods
  async getMessages(conversationId: number): Promise<Message[]> {
    const response = await axios.get(`${API_BASE_URL}/chat/messages/`, {
      params: { conversation_id: conversationId }
    });
    console.log(`Fetched messages for conversation ${conversationId}:`, response.data);
    return response.data.results;
  }

  async getMessage(conversationId: number, messageId: number): Promise<Message> {
    const response = await axios.get(`${API_BASE_URL}/chat/conversations/${conversationId}/messages/${messageId}/`);
    return response.data;
  }

  async createMessage(conversationId: number, content: string): Promise<Message> {
    return throttleRequest(`send-message-${conversationId}`, async () => {
      const response = await axios.post(`${API_BASE_URL}/chat/conversations/${conversationId}/send_message/`, { content });
      // The API now returns both user_message and assistant_message
      // We return just the assistant message for backward compatibility
      if (response.data.assistant_message) {
        return response.data.assistant_message;
      }
      return response.data;
    });
  }

  // Function to stream message
  streamMessage(
    conversationId: number, 
    content: string,
    options: {
      onToken: (token: string, status: string, isFullUpdate?: boolean) => void;
      onComplete: () => void;
      onError: (error: any) => void;
      signal?: AbortSignal;
    }
  ): (() => void) {
    const { onToken, onComplete, onError, signal } = options;
    
    // POST the initial request without using EventSource
    const postMessageAndStream = async () => {
      try {
        // Try a different URL format to match the backend's expected structure
        // For DRF action endpoints, the URL format might need adjustment
        const url = `${API_BASE_URL}/chat/conversations/${conversationId}/send_message/`;
        console.log("Streaming to URL:", url);
        
        // First POST the message
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${this.authToken}`,
            'Accept': 'application/json', // Change Accept header to JSON instead of event-stream
          },
          body: JSON.stringify({ content }),
          signal: signal || null,
        });
        
        console.log("Stream response status:", response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // For now, parse the JSON response
        const data = await response.json();
        console.log("Received response:", data);
        
        // Simulate a streaming response from the regular endpoint
        if (data.assistant_message && data.assistant_message.content) {
          // Emit the content as if it were streamed
          onToken(data.assistant_message.content, 'complete', true);
          // Signal completion
          onComplete();
        } else {
          throw new Error("No response content received");
        }
        
      } catch (error) {
        console.error('Error with streaming:', error);
        onError(error);
      }
    };
    
    // Start the request
    postMessageAndStream();
    
    // Return a cleanup function
    return () => {
      // The AbortController will handle cancellation
    };
  }

  async updateMessage(messageId: number, content: string): Promise<Message> {
    const response = await axios.put(`${API_BASE_URL}/chat/messages/${messageId}/`, { content });
    return response.data;
  }

  async deleteMessage(messageId: number): Promise<void> {
    await axios.delete(`${API_BASE_URL}/chat/messages/${messageId}/`);
  }
}

export const chatApi = new ChatApi(); 