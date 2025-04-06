import { Conversation, Message } from '../types';
import fetchClient from './fetchClient';

// API base URL - same as what fetchClient uses
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Super simple global state for streaming content
export const streamState = {
  // Map of message IDs to their content
  contents: new Map<string, string>(),
  
  // Set content for a message
  setContent(messageId: string, content: string) {
    this.contents.set(messageId, content);
    console.log(`Updated content for ${messageId}, length: ${content.length}`);
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
    const response = await fetchClient.post<Conversation>('/chat/conversations/');
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
    onStream?: (chunk: string) => void;
  }): Promise<{ user_message: Message; agent_message: Message }> => {
    // Send the message
    const response = await fetchClient.post<{ user_message: Message; agent_message: Message }>(
      `/chat/conversations/${conversationId}/messages/`, 
      { content }
    );

    // Find any message that is currently generating
    const generatingMessage = [response.data.user_message, response.data.agent_message]
      .find(msg => msg.is_generating);

    // If we have a generating message, set up streaming
    if (generatingMessage && generatingMessage.id) {
      console.log(`Setting up stream for message ${generatingMessage.id}`);
      
      // Initialize stream state with initial content
      const initialContent = generatingMessage.content || '';
      streamState.setContent(generatingMessage.id, initialContent);
      
      try {
        // Simple stream handler that just updates content
        const handleStreamResponse = async (response: Response) => {
          if (!response.body) return;
          
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              console.log('Stream completed');
              break;
            }
            
            // Decode the chunk and add to buffer
            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;
            
            // Process SSE messages
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep the last potentially incomplete line
            
            for (const line of lines) {
              if (!line.trim() || !line.startsWith('data:')) continue;
              
              try {
                const data = JSON.parse(line.substring(5).trim());
                
                if (data.type === 'token' && data.content) {
                  // Update our simple stream state
                  const currentContent = streamState.getContent(generatingMessage.id);
                  const newContent = currentContent + data.content;
                  streamState.setContent(generatingMessage.id, newContent);
                  
                  // Call the onStream callback if provided
                  if (onStream) onStream(data.content);
                }
              } catch (err) {
                console.warn('Error parsing SSE message:', err);
              }
            }
          }
        };
        
        // Use fetchClient for streaming to ensure all headers match regular requests
        const streamUrl = `/chat/conversations/${conversationId}/messages/${generatingMessage.id}/stream/`;
        
        // First get the stream response using fetchClient
        try {
          // Get CSRF token from cookie if available
          const csrfToken = document.cookie
            .split('; ')
            .find(row => row.startsWith('csrftoken='))
            ?.split('=')[1];

          const streamResponse = await fetch(`${API_BASE_URL}${streamUrl}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'text/event-stream',
              'Authorization': localStorage.getItem('authToken') ? `Token ${localStorage.getItem('authToken')}` : '',
              ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {})
            },
            body: JSON.stringify({ content }),
            credentials: 'include'
          });

          // Only process if we got a valid response
          if (streamResponse.ok) {
            // Process the stream
            handleStreamResponse(streamResponse);
          } else {
            console.error('Failed to start stream, status:', streamResponse.status);
          }
        } catch (streamErr) {
          console.error('Error initiating stream:', streamErr);
        }
        
      } catch (error) {
        console.error('Error setting up stream:', error);
      }
    }

    return response.data;
  }
};
