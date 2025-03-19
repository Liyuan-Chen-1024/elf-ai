import { create } from 'zustand';
import { Conversation, UUID } from '../types';
import { messagesApi } from '../api/messages.api';

interface ConversationsState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  isLoading: boolean;
  error: string | null;
  setConversations: (conversations: Conversation[]) => void;
  setCurrentConversation: (conversation: Conversation | null) => void;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (id: UUID, updates: Partial<Conversation>) => void;
  deleteConversation: (id: UUID) => void;
  archiveConversation: (id: UUID) => Promise<void>;
  unarchiveConversation: (id: UUID) => Promise<void>;
  renameConversation: (id: UUID, title: string) => Promise<void>;
}

export const useConversationsStore = create<ConversationsState>((set) => ({
  conversations: [],
  currentConversation: null,
  isLoading: false,
  error: null,

  setConversations: (conversations) => set({ conversations }),

  setCurrentConversation: (conversation) => set({ currentConversation: conversation }),

  addConversation: (conversation) => set((state) => ({
    conversations: [...state.conversations, conversation],
    currentConversation: conversation,
  })),

  updateConversation: (id, updates) => set((state) => ({
    conversations: state.conversations.map((c) =>
      c.id === id ? { ...c, ...updates } : c
    ),
    currentConversation:
      state.currentConversation?.id === id
        ? { ...state.currentConversation, ...updates }
        : state.currentConversation,
  })),

  deleteConversation: (id) => set((state) => ({
    conversations: state.conversations.filter((c) => c.id !== id),
    currentConversation:
      state.currentConversation?.id === id ? null : state.currentConversation,
  })),

  archiveConversation: async (id) => {
    try {
      await messagesApi.archiveConversation(id);
      set((state) => ({
        conversations: state.conversations.map((c) =>
          c.id === id ? { ...c, archived: true } : c
        ),
        currentConversation:
          state.currentConversation?.id === id
            ? { ...state.currentConversation, archived: true }
            : state.currentConversation,
      }));
    } catch (error) {
      console.error('Failed to archive conversation:', error);
      throw error;
    }
  },

  unarchiveConversation: async (id) => {
    try {
      await messagesApi.unarchiveConversation(id);
      set((state) => ({
        conversations: state.conversations.map((c) =>
          c.id === id ? { ...c, archived: false } : c
        ),
        currentConversation:
          state.currentConversation?.id === id
            ? { ...state.currentConversation, archived: false }
            : state.currentConversation,
      }));
    } catch (error) {
      console.error('Failed to unarchive conversation:', error);
      throw error;
    }
  },

  renameConversation: async (id, title) => {
    try {
      await messagesApi.renameConversation(id, title);
      set((state) => ({
        conversations: state.conversations.map((c) =>
          c.id === id ? { ...c, title } : c
        ),
        currentConversation:
          state.currentConversation?.id === id
            ? { ...state.currentConversation, title }
            : state.currentConversation,
      }));
    } catch (error) {
      console.error('Failed to rename conversation:', error);
      throw error;
    }
  },
})); 