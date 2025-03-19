import { create } from 'zustand';
import type { Conversation, Message } from '../types';
import { messagesApi } from '../api/messages.api';

interface ChatState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  lastTokens: number;
}

interface ChatActions {
  setConversations: (conversations: Conversation[]) => void;
  setCurrentConversation: (conversation: Conversation | null) => void;
  setMessages: (messages: Message[]) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setLastTokens: (tokens: number) => void;
  sendMessage: (content: string) => Promise<void>;
}

type ChatStore = ChatState & ChatActions;

const initialState: ChatState = {
  conversations: [],
  currentConversation: null,
  messages: [],
  isLoading: false,
  error: null,
  lastTokens: 0,
};

export const useChatStore = create<ChatStore>((set, get) => ({
  ...initialState,

  setConversations: (conversations: Conversation[]) => set({ conversations }),
  setCurrentConversation: (currentConversation: Conversation | null) => set({ currentConversation }),
  setMessages: (messages: Message[]) => set({ messages }),
  setIsLoading: (isLoading: boolean) => set({ isLoading }),
  setError: (error: string | null) => set({ error }),
  setLastTokens: (lastTokens: number) => set({ lastTokens }),

  sendMessage: async (content: string) => {
    const state = get();
    if (!state.currentConversation) {
      set({ error: 'No conversation selected' });
      return;
    }

    try {
      set({ isLoading: true, error: null });

      const newMessage: Message = {
        id: Math.random().toString(36).substring(7),
        conversation_id: state.currentConversation.id,
        content,
        role: 'user',
        timestamp: new Date().toISOString(),
        sender: {
          id: 'user',
          name: 'User'
        }
      };

      set((state) => ({
        messages: [...state.messages, newMessage],
      }));

      const assistantMessage: Message = {
        id: Math.random().toString(36).substring(7),
        conversation_id: state.currentConversation.id,
        content: '',
        role: 'assistant',
        timestamp: new Date().toISOString(),
        sender: {
          id: 'assistant',
          name: 'Assistant'
        }
      };

      set((state) => ({
        messages: [...state.messages, assistantMessage],
      }));

      let streamingContent = '';

      await messagesApi.streamMessage(
        state.currentConversation.id.toString(),
        content,
        (token: string) => {
          streamingContent += token;
          set((state) => {
            const messages = [...state.messages];
            const lastMessage = messages[messages.length - 1];
            if (lastMessage && lastMessage.sender?.id === 'assistant') {
              lastMessage.content = streamingContent;
              lastMessage.showThinking = false;
            }
            return { messages };
          });
        },
        (error: string) => {
          set({ error });
        },
        () => {
          set((state) => ({
            lastTokens: state.lastTokens + streamingContent.length,
          }));
        }
      );
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'An error occurred',
      });
    } finally {
      set({ isLoading: false });
    }
  },
})); 