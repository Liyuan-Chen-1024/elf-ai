import { useState, useEffect, useRef } from 'react';
import { Box, Typography, Alert } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { useConversations, useMessage } from '../../../hooks/useChat';
import fetchClient from '../../../services/fetchClient';

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
  const { conversationId } = useParams<{ conversationId: string }>();
  
  const { 
    conversations, 
    isLoading,
    isDeleting: isConversationDeleting
  } = useConversations();
  
  const {
    conversation: activeConversation,
    error: conversationError,
    streamedResponse,
    isSending,
    refetch,
    sendMessage
  } = useMessage(conversationId || '');

  // Force refetch when conversationId changes
  useEffect(() => {
    if (conversationId && refetch) {
      if (import.meta.env.DEV) {
        window.console.log(`Selected conversation changed to ${conversationId}, refetching...`);
      }
      // Abort any active streams when changing conversations
      fetchClient.abortStreamsByUrl('/chat/conversations/');
      refetch();
    }
  }, [conversationId, refetch]);

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;
    
    try {
      const response = await sendMessage({
        conversationId: conversationId,
        content: message
      });

      if (import.meta.env.DEV) {
        console.log('Message sent, response:', response);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };


  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 70px)',
      maxHeight: 'calc(100vh - 70px)',
      overflow: 'hidden',
      px: 2,
      backgroundColor: THEME.colors.background.surface,
    }}>
      {!isLoading && conversations.length === 0 ? (
        <Box sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%'
        }}>
          <Typography variant="h6">No conversations found</Typography>
        </Box>
      ) : (
        <>
          {/* Header */}
          <Box sx={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            backdropFilter: THEME.blur.strong,
            WebkitBackdropFilter: THEME.blur.strong,
            borderBottom: 'none',
            px: { xs: 3, sm: 4 },
            py: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            flexShrink: 0,
            height: '56px',
          }}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontSize: '1.8rem',
                fontWeight: 600,
                letterSpacing: '-0.01em',
                background: 'linear-gradient(135deg, #7C4DFF 0%, #FF7597 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                ml: 1.5,
              }}
            >
              {activeConversation?.title || 'New conversation'}
            </Typography>
          </Box>

          <Box 
              sx={{ 
                height: '1px', 
                width: '100%',
                mb: 1.5,
                background: 'linear-gradient(90deg, rgba(124, 77, 255, 0.08) 0%, rgba(255, 117, 151, 0.08) 100%)',
              }} 
            />
               
          {/* Messages */}
          <Box sx={{
            flex: 1,
            minHeight: 0,
            overflow: 'auto',
            px: { xs: 4, sm: 5 },
            py: { xs: 4, sm: 4 },
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
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
            
            <MessageList
              messages={activeConversation?.messages || []}
              isLoading={isSending }
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
            py: 2,
            flexShrink: 0,
            display: 'flex',
            justifyContent: 'center',
            width: '100%',
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
                conversationId={conversationId}
                isLoading={isSending || isConversationDeleting || isLoading}
                placeholder="Ask me anything..."
              />
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
}

export default ChatView; 