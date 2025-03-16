import { create } from 'zustand';
import { chatApi, type Conversation } from './api';

interface ChatState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  isLoading: boolean;
  error: string | null;
  streamingMessageId: string | null;
  actions: {
    fetchConversations: () => Promise<void>;
    createConversation: (title: string) => Promise<void>;
    selectConversation: (id: string) => Promise<void>;
    clearConversation: (id: string) => Promise<void>;
    deleteConversation: (id: string) => Promise<void>;
    sendMessage: (content: string) => Promise<void>;
    streamMessage: (content: string) => Promise<void>;
    editMessage: (messageId: string, content: string) => Promise<void>;
    deleteMessage: (messageId: string) => Promise<void>;
    setError: (error: string | null) => void;
  };
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  currentConversation: null,
  isLoading: false,
  error: null,
  streamingMessageId: null,

  actions: {
    fetchConversations: async () => {
      try {
        set({ isLoading: true, error: null });
        const conversations = await chatApi.getConversations();
        set({ conversations });
      } catch (error) {
        set({ error: 'Failed to fetch conversations' });
      } finally {
        set({ isLoading: false });
      }
    },

    createConversation: async (title: string) => {
      try {
        set({ isLoading: true, error: null });
        const conversation = await chatApi.createConversation(title);
        set(state => ({
          conversations: [conversation, ...state.conversations],
          currentConversation: conversation,
        }));
      } catch (error) {
        set({ error: 'Failed to create conversation' });
      } finally {
        set({ isLoading: false });
      }
    },

    selectConversation: async (id: string) => {
      try {
        set({ isLoading: true, error: null });
        const conversation = await chatApi.getConversation(id);
        set({ currentConversation: conversation });
      } catch (error) {
        set({ error: 'Failed to load conversation' });
      } finally {
        set({ isLoading: false });
      }
    },

    clearConversation: async (id: string) => {
      try {
        set({ isLoading: true, error: null });
        await chatApi.clearConversation(id);
        set(state => ({
          currentConversation: state.currentConversation
            ? { ...state.currentConversation, messages: [] }
            : null,
        }));
      } catch (error) {
        set({ error: 'Failed to clear conversation' });
      } finally {
        set({ isLoading: false });
      }
    },

    deleteConversation: async (id: string) => {
      try {
        set({ isLoading: true, error: null });
        await chatApi.deleteConversation(id);
        set(state => ({
          conversations: state.conversations.filter(c => c.id !== id),
          currentConversation:
            state.currentConversation?.id === id ? null : state.currentConversation,
        }));
      } catch (error) {
        set({ error: 'Failed to delete conversation' });
      } finally {
        set({ isLoading: false });
      }
    },

    sendMessage: async (content: string) => {
      const { currentConversation } = get();
      if (!currentConversation) return;

      try {
        set({ isLoading: true, error: null });
        const message = await chatApi.sendMessage(currentConversation.id, content);
        set(state => ({
          currentConversation: state.currentConversation
            ? {
                ...state.currentConversation,
                messages: [...state.currentConversation.messages, message],
              }
            : null,
        }));
      } catch (error) {
        set({ error: 'Failed to send message' });
      } finally {
        set({ isLoading: false });
      }
    },

    streamMessage: async (content: string) => {
      const { currentConversation } = get();
      if (!currentConversation) return;

      try {
        set({ error: null });
        const eventSource = chatApi.streamMessage(currentConversation.id, content);

        eventSource.onmessage = event => {
          const data = JSON.parse(event.data);

          if (data.type === 'token') {
            set(state => {
              const currentConv = state.currentConversation;
              if (!currentConv) return state;

              const messages = [...currentConv.messages];
              const lastMessage = messages.find(m => m.id === data.messageId);

              if (lastMessage) {
                lastMessage.content += data.content;
              } else {
                messages.push({
                  id: data.messageId,
                  role: 'assistant',
                  content: data.content,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  is_edited: false,
                  edited_at: null,
                });
              }

              return {
                currentConversation: {
                  ...currentConv,
                  messages,
                },
                streamingMessageId: data.messageId,
              };
            });
          } else if (data.type === 'done') {
            set({ streamingMessageId: null });
            eventSource.close();
          }
        };

        eventSource.onerror = () => {
          set({ error: 'Streaming error occurred', streamingMessageId: null });
          eventSource.close();
        };
      } catch (error) {
        set({ error: 'Failed to stream message', streamingMessageId: null });
      }
    },

    editMessage: async (messageId: string, content: string) => {
      try {
        set({ isLoading: true, error: null });
        const updatedMessage = await chatApi.editMessage(messageId, content);
        set(state => {
          const currentConv = state.currentConversation;
          if (!currentConv) return state;

          return {
            currentConversation: {
              ...currentConv,
              messages: currentConv.messages.map(m => (m.id === messageId ? updatedMessage : m)),
            },
          };
        });
      } catch (error) {
        set({ error: 'Failed to edit message' });
      } finally {
        set({ isLoading: false });
      }
    },

    deleteMessage: async (messageId: string) => {
      try {
        set({ isLoading: true, error: null });
        await chatApi.deleteMessage(messageId);
        set(state => {
          const currentConv = state.currentConversation;
          if (!currentConv) return state;

          return {
            currentConversation: {
              ...currentConv,
              messages: currentConv.messages.filter(m => m.id !== messageId),
            },
          };
        });
      } catch (error) {
        set({ error: 'Failed to delete message' });
      } finally {
        set({ isLoading: false });
      }
    },

    setError: (error: string | null) => set({ error }),
  },
}));
