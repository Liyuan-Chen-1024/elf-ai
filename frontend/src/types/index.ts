// User related types
export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  avatar: string;
}

// Message related types
export interface MessageSender {
  id: 'user' | 'agent';
}

export interface Message {
  id: string;
  conversationId: string;
  content: string;
  sender: MessageSender;
  timestamp: string;
  isEdited: boolean;
  role: 'user' | 'agent' | 'system';
  is_deleted?: boolean;
  agent_message_id: string;
  is_generating: boolean;
  status_generating: string;
}

// Conversation related types
export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  archived: boolean;
  messages: Message[];
  messageCount: number;
  lastMessage: Message | null;
  participants: MessageSender[];
}

// API Request and Response types
export interface MessageCreateRequest {
  content: string;
}

export interface MessageUpdateRequest {
  content: string;
}

// News related types
export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  publishedAt: string;
  source: string;
  imageUrl?: string;
}

// Application state types
export interface AppState {
  activeTab: 'chat' | 'news' | 'profile';
  sidebarOpen: boolean;
}

// Theme types
export type ThemeMode = 'light' | 'dark';

// API Error types
export interface ApiError {
  message: string;
  detail?: string;
  statusCode?: number;
}
