import type { Conversation, Message } from '../types';
import { authApi } from './auth.api';
import { conversationsApi } from './conversations.api';
import { messagesApi } from './messages.api';

// Export all API services
export const chatApi = {
  // Auth
  login: authApi.login.bind(authApi),
  logout: authApi.logout.bind(authApi),
  setAuthToken: authApi.setAuthToken.bind(authApi),
  isAuthenticated: authApi.isAuthenticated.bind(authApi),
  
  // Conversations
  getConversations: messagesApi.getConversations.bind(messagesApi),
  getArchivedConversations: conversationsApi.getArchivedConversations.bind(conversationsApi),
  getConversation: conversationsApi.getConversation.bind(conversationsApi),
  createConversation: conversationsApi.createConversation.bind(conversationsApi),
  updateConversation: conversationsApi.updateConversation.bind(conversationsApi),
  deleteConversation: conversationsApi.deleteConversation.bind(conversationsApi),
  archiveConversation: messagesApi.archiveConversation.bind(messagesApi),
  unarchiveConversation: messagesApi.unarchiveConversation.bind(messagesApi),
  generateTitle: conversationsApi.generateTitle.bind(conversationsApi),
  searchConversations: conversationsApi.searchConversations.bind(conversationsApi),
  getConversationTitle: conversationsApi.getConversationTitle.bind(conversationsApi),
  
  // Messages
  getMessages: messagesApi.getMessages.bind(messagesApi),
  getMessage: messagesApi.getMessage.bind(messagesApi),
  streamMessage: messagesApi.streamMessage.bind(messagesApi),
  updateMessage: messagesApi.updateMessage.bind(messagesApi),
  deleteMessage: messagesApi.deleteMessage.bind(messagesApi),
  renameConversation: messagesApi.renameConversation.bind(messagesApi),
};

// Re-export types properly with isolatedModules
export type { Conversation, Message };

