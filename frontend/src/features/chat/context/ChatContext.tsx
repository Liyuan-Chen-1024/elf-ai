import React, { createContext, useContext, ReactNode } from 'react';
import { 
  useConversations, 
  useConversationActions,
  useMessageActions,
  useMessages 
} from '../hooks';
import { Conversation, Message } from '../../../types';

// Define the shape of the context
interface ChatContextValue {
  // Conversation data and state
  conversations: Conversation[];
  isLoadingConversations: boolean;
  isCreatingConversation: boolean;
  isDeletingConversation: boolean;
  conversationError: string | null;
  
  // Message data and state
  currentConversation?: Conversation;
  messages: Message[];
  isLoadingMessages: boolean;
  isSendingMessage: boolean;
  messageError: string | null;
  
  // Conversation actions
  createConversation: () => Promise<Conversation | null>;
  deleteConversation: (id: string, isActive: boolean) => Promise<boolean>;
  clearConversationError: () => void;
  
  // Message actions
  sendMessage: (content: string) => Promise<boolean>;
  clearMessageError: () => void;
}

// Create the context
const ChatContext = createContext<ChatContextValue | undefined>(undefined);

interface ChatProviderProps {
  children: ReactNode;
  // Optional: If not provided, no messages will be loaded
  conversationId?: string | undefined;
}

// Default empty message data - used when no conversation is active
const emptyMessageData = {
  messages: [] as Message[],
  isLoading: false,
  conversation: undefined,
  error: null
};

// Default empty message actions - used when no conversation is active
const emptyMessageActions = {
  sendMessage: async () => false, 
  clearError: () => {}, 
  error: null, 
  isSending: false 
};

// Provider component
export const ChatProvider: React.FC<ChatProviderProps> = ({ 
  children,
  conversationId
}) => {
  const hasActiveConversation = !!conversationId && conversationId.trim() !== '';
  const activeConversationId = hasActiveConversation ? conversationId : '';
  
  // Conversation data and actions - these hooks are always called
  const {
    conversations,
    isLoading: isLoadingConversations
  } = useConversations();
  
  const {
    createConversation,
    deleteConversation,
    clearError: clearConversationError,
    error: conversationError,
    isCreating: isCreatingConversation,
    isDeleting: isDeletingConversation
  } = useConversationActions();
  
  // Always call the hooks, but with an empty ID if there's no active conversation
  // This ensures hook call order remains consistent
  const messagesResult = useMessages(activeConversationId);
  
  // Get messages data from result if we have an active conversation, otherwise use empty data
  const {
    messages = [],
    isLoading: isLoadingMessages,
    conversation: currentConversation
  } = hasActiveConversation ? messagesResult : emptyMessageData;
  
  // Always call the message actions hook, but with an empty ID if there's no active conversation
  const messageActionsResult = useMessageActions(activeConversationId);
  
  // Get message actions from result if we have an active conversation, otherwise use empty actions
  const {
    sendMessage,
    clearError: clearMessageError,
    error: messageError,
    isSending: isSendingMessage
  } = hasActiveConversation ? messageActionsResult : emptyMessageActions;
  
  // Value to provide to consumers
  const contextValue: ChatContextValue = {
    // Conversation data and state
    conversations,
    isLoadingConversations,
    isCreatingConversation,
    isDeletingConversation,
    conversationError,
    
    // Message data and state
    currentConversation,
    messages,
    isLoadingMessages,
    isSendingMessage,
    messageError,
    
    // Conversation actions
    createConversation,
    deleteConversation,
    clearConversationError,
    
    // Message actions
    sendMessage,
    clearMessageError
  };
  
  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};

// Custom hook for consuming the context
export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
}; 