import { create } from 'zustand';
import { chatApi } from '../api/chatApi';
import type { Message } from '../types';

interface MessagesState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  streamingMessageId: string | null;
  
  // Actions
  fetchMessages: (conversationId: number) => Promise<Message[]>;
  sendMessage: (conversationId: number, content: string) => Promise<Message>;
  streamMessage: (conversationId: number, content: string) => Promise<{ close: () => void } | void>;
  editMessage: (messageId: number, content: string) => Promise<void>;
  deleteMessage: (messageId: number) => Promise<void>;
  setError: (error: string | null) => void;
}

export const useMessagesStore = create<MessagesState>((set, get) => ({
  messages: [],
  isLoading: false,
  error: null,
  streamingMessageId: null,
  
  fetchMessages: async (conversationId: number) => {
    try {
      set({ isLoading: true, error: null });
      const messages = await chatApi.getMessages(conversationId);
      set({ messages });
      return messages;
    } catch (error) {
      set({ error: 'Failed to fetch messages' });
      return [];
    } finally {
      set({ isLoading: false });
    }
  },
  
  sendMessage: async (conversationId: number, content: string) => {
    try {
      set({ isLoading: true, error: null });
      const message = await chatApi.createMessage(conversationId, content);
      set((state) => ({
        messages: [...state.messages, message],
      }));
      return message;
    } catch (error) {
      set({ error: 'Failed to send message' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  
  streamMessage: async (conversationId: number, content: string) => {
    try {
      set({ isLoading: true, error: null });
      
      // Create a placeholder for user message
      const tempUserMessage: Message = {
        id: Date.now(), // Temporary ID
        conversation_id: conversationId,
        content,
        role: 'user',
        sender: { id: 'user', name: 'User' },
        timestamp: new Date().toISOString(),
        isEdited: false
      };
      
      // Add the user message to the messages array
      set((state) => ({
        messages: [...state.messages, tempUserMessage],
      }));
      
      let assistantMessageContent = '';
      let assistantMessageId: string | null = null;
      
      const handler = chatApi.streamMessage(
        conversationId,
        content,
        {
          onToken: (token: string, messageId: string, status: string) => {
            // Save the messageId when we first get it
            if (messageId && !assistantMessageId) {
              assistantMessageId = messageId;
              set({ streamingMessageId: messageId });
            }
            
            // For a complete update, replace the content
            if (status === 'complete') {
              assistantMessageContent = token;
            } else {
              // For incremental updates, append the token
              assistantMessageContent += token;
            }
            
            // Update the UI with the streaming content
            set((state) => {
              // Check if we already have this message in our state
              const existingMessageIndex = state.messages.findIndex(
                (m) => String(m.id) === String(assistantMessageId)
              );
              
              if (existingMessageIndex !== -1) {
                // Update existing message
                const updatedMessages = [...state.messages];
                updatedMessages[existingMessageIndex] = {
                  ...updatedMessages[existingMessageIndex],
                  content: assistantMessageContent,
                };
                return { messages: updatedMessages };
              } else {
                // Create a new assistant message
                const tempAssistantMessage: Message = {
                  id: messageId || Date.now() + 1, // Use the real ID if available
                  conversation_id: conversationId,
                  content: assistantMessageContent,
                  role: 'assistant',
                  sender: { id: 'assistant', name: 'Elf Agent' },
                  timestamp: new Date().toISOString(),
                  isEdited: false
                };
                return { messages: [...state.messages, tempAssistantMessage] };
              }
            });
          },
          onComplete: () => {
            set({ isLoading: false, streamingMessageId: null });
          },
          onError: (error) => {
            set({
              error: 'Error while streaming message',
              isLoading: false,
              streamingMessageId: null
            });
            console.error('Streaming error:', error);
          }
        }
      );
      
      return handler;
    } catch (error) {
      set({
        error: 'Failed to stream message',
        isLoading: false,
        streamingMessageId: null
      });
      console.error('Failed to start streaming:', error);
      return Promise.reject(error);
    }
  },
  
  editMessage: async (messageId: number, content: string) => {
    try {
      set({ isLoading: true, error: null });
      const updatedMessage = await chatApi.updateMessage(messageId, content);
      
      set((state) => ({
        messages: state.messages.map((m) => 
          m.id === messageId ? updatedMessage : m
        ),
      }));
    } catch (error) {
      set({ error: 'Failed to edit message' });
    } finally {
      set({ isLoading: false });
    }
  },
  
  deleteMessage: async (messageId: number) => {
    try {
      set({ isLoading: true, error: null });
      await chatApi.deleteMessage(messageId);
      
      set((state) => ({
        messages: state.messages.filter((m) => m.id !== messageId),
      }));
    } catch (error) {
      set({ error: 'Failed to delete message' });
    } finally {
      set({ isLoading: false });
    }
  },
  
  setError: (error: string | null) => {
    set({ error });
  },
})); 