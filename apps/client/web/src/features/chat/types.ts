export interface Message {
  id: number;
  conversation_id: number;
  content: string;
  role: 'user' | 'assistant' | 'system';
  is_from_user: boolean;
  created_at: string;
  updated_at: string;
  is_edited: boolean;
  edited_at: string | null;
  is_deleted: boolean;
}

export interface Conversation {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  messages?: Message[];
}
