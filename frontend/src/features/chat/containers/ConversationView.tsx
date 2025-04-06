import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import MessageList from './MessageList';
import MessageInput from '../components/MessageInput';
import { useConversations } from '../hooks/conversations';
import { useMessages } from '../hooks/messages';
import fetchClient from '../../../services/fetchClient';
import { 
  EmptyConversationState,
  ConversationHeader,
  ConversationContent
} from '../index';
import { THEME } from '../styles/theme';

/**
 * ConversationView is the main container for a chat conversation.
 * It handles:
 * - Data fetching and state management for conversations and messages
 * - Creating new conversations
 * - Sending messages
 * - Orchestrating the layout of conversation components
 */
const ConversationView: React.FC = () => {
  const navigate = useNavigate();
  const { conversationId } = useParams<{ conversationId: string }>();
  const [createError, setCreateError] = useState<string | null>(null);
  
  // Fetch conversations data
  const { 
    conversations, 
    isLoading,
    isDeleting: isConversationDeleting,
    createConversation,
    isCreating
  } = useConversations();
  
  // Fetch active conversation data and message handling
  const {
    conversation: activeConversation,
    error: conversationError,
    isSending,
    refetch,
    sendMessage
  } = useMessages(conversationId || '');

  // Force refetch when conversationId changes and abort existing streams
  useEffect(() => {
    if (conversationId && refetch) {
      if (import.meta.env.DEV) {
        console.log(`Selected conversation changed to ${conversationId}, refetching...`);
      }
      // Abort any active streams when changing conversations
      fetchClient.abortStreamsByUrl('/chat/conversations/');
      refetch();
    }
  }, [conversationId, refetch]);

  // Handle sending a new message
  const handleSendMessage = (message: string) => {
    if (!message.trim()) return;
    
    sendMessage({
      conversationId: conversationId || '',
      content: message,
    });
  };

  // Handle creating a new conversation
  const handleCreateConversation = async () => {
    try {
      setCreateError(null);
      const newConversation = await createConversation();
      navigate(`/chat/${newConversation.id}`);
    } catch (error) {
      console.error('Failed to create conversation:', error);
      setCreateError('Failed to create conversation. Please try again.');
    }
  };

  // Determine what to render based on state
  if (!isLoading && conversations.length === 0) {
    return (
      <EmptyConversationState
        onCreateConversation={handleCreateConversation}
        isCreating={isCreating}
        error={createError}
      />
    );
  }

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 70px)',
      maxHeight: 'calc(100vh - 70px)',
      overflow: 'hidden',
      backgroundColor: THEME.colors.background.surface,
    }}>
      <ConversationHeader 
        title={activeConversation?.title || 'New conversation'} 
      />
      
      <ConversationContent
        conversationError={conversationError}
      >
        <MessageList
          messages={activeConversation?.messages || []}
          isLoading={isSending}
          key={`message-list-${conversationId}`}
        />
      </ConversationContent>

      <Box sx={{
        position: 'sticky',
        bottom: 0,
        zIndex: 10,
        width: '100%',
        background: THEME.colors.background.surface,
        borderTop: `1px solid ${THEME.colors.background.inputBorder}`,
        py: 2,
        flexShrink: 0,
        display: 'flex',
        justifyContent: 'center',
      }}>
        <Box sx={{ 
          width: '90%',
          maxWidth: '1200px',
          minWidth: '300px',
          '& textarea': {
            maxHeight: '100px',
            minHeight: '50px',
            height: '50px',
            overflow: 'auto'
          }
        }}>
          <MessageInput
            onSendMessage={handleSendMessage}
            conversationId={conversationId || ''}
            isLoading={isSending || isConversationDeleting || isLoading}
            placeholder="Ask me anything..."
          />
        </Box>
      </Box>
    </Box>
  );
};

export default ConversationView; 