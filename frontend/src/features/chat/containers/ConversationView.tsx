import React from 'react';
import { useParams } from 'react-router-dom';
import MessageList from './MessageList';
import MessageInput from '../components/MessageInput';

import { 
  EmptyState,
  ConversationHeader,
  ConversationContent,
  ContentLayout,
  InputBar,
  LoadingSpinner
} from '../index';
import { useChatContext } from '../context';

/**
 * ConversationView is the main container for a chat conversation.
 * It handles:
 * - Orchestrating the layout of conversation components
 * - Using the ChatContext to access data and actions
 * - Managing conversation lifecycle
 */
const ConversationView: React.FC = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  
  // Access all data and actions from the chat context
  const { 
    // Conversation data
    conversations, 
    isLoadingConversations,
    isDeletingConversation,
    isCreatingConversation,
    
    // Conversation actions
    createConversation,
    conversationError,
    
    // Message data
    currentConversation: activeConversation,
    isLoadingMessages,
    isSendingMessage,
    messageError,
    
    // Message actions
    sendMessage,
  } = useChatContext();

  // Determine what to render based on state
  if (!isLoadingConversations && conversations.length === 0) {
    return (
      <EmptyState
        message="Welcome to Chat"
        submessage="Create your first conversation to get started"
        actionButton={{
          label: "Start New Conversation :)",
          onClick: createConversation,
          loading: isCreatingConversation,
          loadingLabel: "Creating..."
        }}
        error={conversationError}
        fullPage
      />
    );
  }

  // Show loading state when loading messages for a selected conversation
  if (conversationId && isLoadingMessages && !activeConversation) {
    return (
      <ContentLayout fullHeight centered>
        <LoadingSpinner 
          message="Loading conversation..." 
          fullPage
        />
      </ContentLayout>
    );
  }

  return (
    <ContentLayout
      fullHeight
      sx={{ overflow: 'hidden' }}
    >
      <ConversationHeader 
        title={activeConversation?.title || 'New conversation'} 
      />
      
      <ConversationContent
        conversationError={messageError}
      >
        <MessageList
          messages={activeConversation?.messages || []}
          isLoading={isSendingMessage}
          key={`message-list-${conversationId}`}
        />
      </ConversationContent>

      <InputBar>
        <MessageInput
          onSendMessage={sendMessage}
          conversationId={conversationId || ''}
          isLoading={isSendingMessage || isDeletingConversation || isLoadingConversations}
          placeholder="Ask me anything..."
        />
      </InputBar>
    </ContentLayout>
  );
};

export default ConversationView; 