import React, { useState, useEffect } from 'react';
import { Box, Typography, IconButton, Alert, Menu, MenuItem } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import MessageList from './components/MessageList';
import MessageInput from './components/MessageInput';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useConversations, useConversation, CHAT_QUERY_KEYS } from '../../hooks/useChat';
import type { Message } from '../../types';
import { useQueryClient } from '@tanstack/react-query';

const THEME = {
  colors: {
    primary: {
      main: '#7C4DFF',
      light: '#9E7EFF',
      gradient: 'linear-gradient(135deg, #7C4DFF 0%, #FF7597 100%)',
    },
    background: {
      surface: '#FFFFFF',
      header: 'linear-gradient(180deg, rgba(247, 249, 252, 0.9) 0%, rgba(247, 249, 252, 0.6) 100%)',
      headerBorder: 'linear-gradient(90deg, rgba(124, 77, 255, 0.08) 0%, rgba(255, 117, 151, 0.08) 100%)',
    },
    text: {
      primary: '#1C1C1E',
      secondary: '#6C6C70',
    },
  },
  shadows: {
    header: '0 1px 0 rgba(0, 0, 0, 0.06)',
    container: '0 4px 24px rgba(0, 0, 0, 0.04)',
  },
  blur: {
    strong: 'blur(20px)',
    subtle: 'blur(12px)',
  },
};

function ChatView() {
  const navigate = useNavigate();
  const { conversationId } = useParams<{ conversationId?: string }>();
  
  const { 
    conversations, 
    deleteConversation,
    createConversation,
    isDeleting: isConversationDeleting,
    isCreating: isConversationCreating
  } = useConversations();
  
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  const {
    conversation: activeConversation,
    error: conversationError,
    streamedResponse,
    streamMessage,
    isSending,
    isStreaming,
    refetch
  } = useConversation(conversationId);

  const queryClient = useQueryClient();

  // Force refetch when conversationId changes
  useEffect(() => {
    if (conversationId && refetch) {
      if (import.meta.env.DEV) {
        window.console.log(`Selected conversation changed to ${conversationId}, refetching...`);
      }
      refetch();
    }
  }, [conversationId, refetch]);

  // Debug conversation loading
  useEffect(() => {
    if (import.meta.env.DEV && activeConversation) {
      window.console.log(
        'Active conversation:', 
        activeConversation.id, 
        'Title:', activeConversation.title,
        'Messages:', activeConversation.messages?.length || 0
      );
      window.console.log('Message content:', 
        activeConversation.messages?.map((m: Message) => ({
          id: m.id,
          content: m.content?.substring(0, 30) + '...',
          role: m.role
        }))
      );
    }
  }, [activeConversation]);

  // Handle sending a message
  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;
    
    try {
      // If we don't have a conversation ID, create a new conversation first
      if (!conversationId) {
        const newConversation = await createConversation({ title: message.substring(0, 30) + '...' });
        
        // Verify we have a valid conversation object
        if (!newConversation?.id) {
          throw new Error('Failed to create new conversation');
        }

        // Navigate to the new conversation
        navigate(`/chat/${newConversation.id}`);
        
        // Add the user's message immediately to the UI
        const userMessage: Message = {
          id: 'temp-user-' + Date.now(),
          role: 'user',
          content: message,
          conversationId: newConversation.id,
          sender: { id: 'user' },
          timestamp: new Date().toISOString(),
          isEdited: false
        };

        queryClient.setQueryData(
          CHAT_QUERY_KEYS.conversation(newConversation.id),
          {
            ...newConversation,
            messages: [userMessage],
            lastMessage: userMessage
          }
        );

        // Now stream the message to the new conversation
        try {
          await streamMessage({ 
            conversationId: newConversation.id, 
            content: message 
          });
        } catch (_streamError) {
          // If streaming fails immediately, wait a bit longer and try again
          await new Promise(resolve => window.setTimeout(resolve, 500));
          await streamMessage({ 
            conversationId: newConversation.id, 
            content: message 
          });
        }
      } else {
        // We have a conversation ID, add user message immediately
        // At this point we know conversationId is defined because we're in the else block
        const currentConversationId = conversationId as string;
        
        const userMessage: Message = {
          id: 'temp-user-' + Date.now(),
          role: 'user',
          content: message,
          conversationId: currentConversationId,
          sender: { id: 'user' },
          timestamp: new Date().toISOString(),
          isEdited: false
        };

        // Update the conversation in the query cache with the new user message
        queryClient.setQueryData(
          CHAT_QUERY_KEYS.conversation(currentConversationId),
          (oldData: { messages?: Message[]; } | undefined) => ({
            ...oldData,
            messages: [...(oldData?.messages || []), userMessage],
            lastMessage: userMessage
          })
        );

        // Stream the assistant's response
        await streamMessage({ conversationId: currentConversationId, content: message });
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        window.console.error('Error sending message:', error);
      }
      setDebugInfo(error instanceof Error ? error.message : 'Failed to send message');
    }
  };
  
  // Handle menu open
  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };
  
  // Handle menu close
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };
  
  // Handle conversation delete
  const handleDeleteConversation = () => {
    if (conversationId) {
      if (import.meta.env.DEV) {
        window.console.log('Deleting conversation:', conversationId);
      }
      
      // Close the menu first
      handleMenuClose();
      
      // Delete the conversation
      deleteConversation(conversationId, {
        onSuccess: () => {
          // Navigate to main chat view after deletion
          navigate('/chat');
        }
      });
    }
  };

  // Navigate to first conversation if none selected
  useEffect(() => {
    if (conversations.length > 0 && !conversationId) {
      if (import.meta.env.DEV) {
        window.console.log('Auto-navigating to first conversation:', conversations[0].id);
      }
      navigate(`/chat/${conversations[0].id}`);
    }
  }, [conversations, conversationId, navigate]);

  // Show loading state while creating conversation 
  const isCreatingConversation = !conversationId && (isSending || isStreaming || isConversationCreating);

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 105px)', // Account for the top app bar
      maxHeight: 'calc(100vh - 105px)',
      overflow: 'hidden',
      backgroundColor: THEME.colors.background.surface,
    }}>
      {/* Header */}
      <Box sx={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        background: THEME.colors.background.header,
        backdropFilter: THEME.blur.strong,
        WebkitBackdropFilter: THEME.blur.strong,
        borderBottom: '1px solid',
        borderImage: THEME.colors.background.headerBorder,
        borderImageSlice: 1,
        boxShadow: THEME.shadows.header,
        px: { xs: 3, sm: 4 },
        py: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
        height: '56px',
      }}>
        <Typography 
          variant="h6" 
          sx={{ 
            fontSize: '1.125rem',
            fontWeight: 600,
            letterSpacing: '-0.02em',
            color: THEME.colors.text.primary,
            background: THEME.colors.primary.gradient,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          New conversation
        </Typography>
        
        <IconButton
          onClick={handleMenuOpen}
          sx={{
            width: 36,
            height: 36,
            color: THEME.colors.text.secondary,
            '&:hover': {
              backgroundColor: 'rgba(124, 77, 255, 0.08)',
              transform: 'scale(1.05)',
            },
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <MoreVertIcon />
        </IconButton>
        
        <Menu
          anchorEl={menuAnchorEl}
          open={Boolean(menuAnchorEl)}
          onClose={handleMenuClose}
          sx={{
            '& .MuiPaper-root': {
              mt: 1,
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: THEME.blur.subtle,
              WebkitBackdropFilter: THEME.blur.subtle,
              border: '1px solid rgba(0, 0, 0, 0.08)',
              boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)',
            }
          }}
        >
          <MenuItem 
            onClick={handleDeleteConversation}
            sx={{
              color: '#FF3B30',
              fontSize: '0.9375rem',
              py: 1.5,
              px: 2,
              minWidth: 160,
              '&:hover': {
                backgroundColor: 'rgba(255, 59, 48, 0.08)',
              },
              transition: 'background-color 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            Delete conversation
          </MenuItem>
        </Menu>
      </Box>

      {/* Messages */}
      <Box sx={{
        flex: 1,
        minHeight: 0,
        overflow: 'auto',
        px: { xs: 3, sm: 4 },
        py: { xs: 3, sm: 4 },
        display: 'flex',
        flexDirection: 'column',
      }}>
        {conversationError && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3,
              borderRadius: '12px',
              border: '1px solid rgba(255, 59, 48, 0.12)',
              flexShrink: 0,
              '& .MuiAlert-icon': {
                color: '#FF3B30',
              },
            }}
          >
            Error loading conversation: {
              conversationError instanceof Error 
                ? conversationError.message 
                : 'Unknown error'
            }
          </Alert>
        )}
        
        {debugInfo && (
          <Alert 
            severity="info" 
            sx={{ 
              mb: 3,
              borderRadius: '12px',
              border: '1px solid rgba(0, 122, 255, 0.12)',
              flexShrink: 0,
              '& .MuiAlert-icon': {
                color: '#007AFF',
              },
            }}
          >
            {debugInfo}
          </Alert>
        )}
        
        <MessageList
          messages={activeConversation?.messages || []}
          isLoading={isSending || isStreaming}
          streamedResponse={streamedResponse || ''}
        />
      </Box>

      {/* Input */}
      <Box sx={{
        position: 'sticky',
        bottom: 0,
        zIndex: 10,
        background: THEME.colors.background.surface,
        borderTop: '1px solid rgba(0, 0, 0, 0.08)',
        px: { xs: 3, sm: 4 },
        py: { xs: 2, sm: 2.5 },
        flexShrink: 0,
        height: '150px',
      }}>
        <MessageInput
          onSendMessage={handleSendMessage}
          conversationId={conversationId}
          isLoading={isSending || isStreaming || isCreatingConversation || isConversationDeleting}
          placeholder="Ask me anything..."
        />
      </Box>
    </Box>
  );
}

export default ChatView; 