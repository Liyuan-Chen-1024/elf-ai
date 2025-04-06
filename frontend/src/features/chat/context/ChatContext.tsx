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

// Provider component
export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // For the selected conversation ID, we default to empty string
  // This will be updated by the conversation component based on the route
  const [selectedConversationId, setSelectedConversationId] = React.useState<string>('');
  
  // Conversation data and actions
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
  
  // Message data and actions for the selected conversation
  const {
    messages = [],
    isLoading: isLoadingMessages,
    conversation: currentConversation
  } = useMessages(selectedConversationId);
  
  const {
    sendMessage,
    clearError: clearMessageError,
    error: messageError,
    isSending: isSendingMessage
  } = useMessageActions(selectedConversationId);
  
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