import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, IconButton, Alert, Menu, MenuItem, alpha, useTheme } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import MessageList from './components/MessageList';
import MessageInput from './components/MessageInput';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteIcon from '@mui/icons-material/Delete';
import { useConversations, useConversation } from '../../hooks/useChat';
import type { Message } from '../../types';

function ChatView() {
  const navigate = useNavigate();
  const theme = useTheme();
  const { conversationId } = useParams<{ conversationId?: string }>();
  
  const { 
    conversations, 
    deleteConversation,
    isDeleting: isConversationDeleting 
  } = useConversations();
  
  // Menu state for conversation options
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(menuAnchorEl);
  
  const {
    conversation: activeConversation,
    error: conversationError,
    streamedResponse,
    streamMessage,
    isSending,
    isStreaming,
    refetch
  } = useConversation(conversationId);

  // Debug message state
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

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
  const handleSendMessage = (content: string) => {
    if (!content.trim()) return;

    // Debug loading state
    if (import.meta.env.DEV) {
      window.console.log(`Sending message to conversation ${conversationId || 'new'}`);
    }

    // If we don't have a conversation yet (user on /chat), create one with first message
    if (!conversationId) {
      if (import.meta.env.DEV) {
        window.console.log('No active conversation, streaming first message...');
        setDebugInfo('Creating new conversation with first message...');
      }

      // Stream the message to a new conversation (will create conversation as a side effect)
      streamMessage({
        conversationId: 'new',
        content,
      });
      return;
    }

    // Stream the message
    streamMessage({
      conversationId,
      content,
    });
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
  const isCreatingConversation = !conversationId && (isSending || isStreaming);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        borderRadius: theme.shape.borderRadius / 2,
        backgroundColor: alpha(theme.palette.background.paper, 0.5),
        boxShadow: `0 0 20px ${alpha(theme.palette.primary.main, 0.05)}`,
      }}
    >
      {/* Chat header */}
      {activeConversation && (
        <Paper
          elevation={1}
          sx={{
            p: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Typography variant="h6">
            {activeConversation.title}
          </Typography>
          <div>
            <IconButton 
              aria-label="conversation options"
              aria-controls={menuOpen ? 'conversation-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={menuOpen ? 'true' : undefined}
              onClick={handleMenuOpen}
              disabled={isConversationDeleting}
            >
              <MoreVertIcon />
            </IconButton>
            <Menu
              id="conversation-menu"
              anchorEl={menuAnchorEl}
              open={menuOpen}
              onClose={handleMenuClose}
              MenuListProps={{
                'aria-labelledby': 'conversation-options-button',
              }}
            >
              <MenuItem onClick={handleDeleteConversation} disabled={isConversationDeleting}>
                <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
                Delete Conversation
              </MenuItem>
            </Menu>
          </div>
        </Paper>
      )}
      
      {/* Debug info (DEV only) */}
      {import.meta.env.DEV && debugInfo && (
        <Alert severity="warning" onClose={() => setDebugInfo(null)} sx={{ m: 2, mt: 0 }}>
          {debugInfo}
        </Alert>
      )}
      
      {/* Conversation error */}
      {conversationError && (
        <Alert severity="error" sx={{ m: 2, mt: 0 }}>
          Error loading conversation: {
            conversationError instanceof Error 
              ? conversationError.message 
              : 'Unknown error'
          }
        </Alert>
      )}
      
      {/* Chat body */}
      <Box 
        sx={{ 
          flexGrow: 1, 
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <MessageList 
          key={`messages-${conversationId || 'none'}`}
          messages={activeConversation?.messages || []}
          isLoading={isSending || isStreaming}
          streamedResponse={streamedResponse}
        />
      </Box>
      
      {/* Chat input */}
      <Box sx={{ px: { xs: 0.5, sm: 1, md: 2 }, pb: { xs: 0.5, sm: 1, md: 2 }, pt: 0 }}>
        <MessageInput 
          onSendMessage={handleSendMessage}
          isDisabled={isSending || isStreaming || isCreatingConversation || isConversationDeleting}
          placeholder={
            !activeConversation
              ? 'Type a message to start a new conversation...'
              : 'Type a message...'
          }
        />
      </Box>
    </Box>
  );
}

export default ChatView; 