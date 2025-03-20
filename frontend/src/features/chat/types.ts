import type { ReactNode } from 'react';

// UUID type for IDs
export type UUID = string | number;

export interface User {
  id: UUID;
  email: string;
  name: string;
  role: string;
}

export interface Sender {
  id: UUID;
  name: string;
}

export interface Message {
  id: UUID;
  conversation_id: UUID;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: string;
  is_deleted?: boolean;
  sender?: Sender;
  isEdited?: boolean;
  thinkingContent?: string;
  showThinking?: boolean;
  isThinking?: boolean;
}

export interface Conversation {
  id: UUID;
  title: string;
  createdAt: string;
  updatedAt: string;
  archived: boolean;
  messages: Message[];
  messageCount: number;
  lastMessage?: Message;
  participants: User[];
}

export interface ChatHookState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  isLoading: boolean;
  error: string | null;
  lastTokens: string[];
}

export interface MessageItemProps {
  message: Message;
  isThinking?: boolean;
  isLoading?: boolean;
  key?: string;
}

export interface MarkdownPreviewProps {
  children?: any;
  content: string;
  highlightMatches?: (text: string) => any;
  hasThinking?: boolean;
  onToggleThinking?: () => void;
}

export interface SearchResult {
  messages: Message[];
  totalCount: number;
}
