import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, IconButton, Alert, Menu, MenuItem } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import MessageList from './components/MessageList';
import MessageInput from './components/MessageInput';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteIcon from '@mui/icons-material/Delete';
import { useConversations, useConversation } from '../../hooks/useChat';
import { Conversation, Message } from '../../types';

function ChatView() {
  const navigate = useNavigate();
  const { conversationId } = useParams<{ conversationId: string }>();
  
  const { 
    conversations, 
    createConversation, 
    deleteConversation,
    isCreating,
    isDeleting 
  } = useConversations();
  
  // Menu state for conversation options
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(menuAnchorEl);
  
  const {
    conversation: activeConversation,
    streamMessage,
    isSending,
    isStreaming,
    streamedResponse,
    error: conversationError,
    refetch
  } = useConversation(conversationId);

  // Debug message state
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  // Force refetch when conversationId changes
  useEffect(() => {
    if (conversationId) {
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
    if (conversationId) {
      // If there's an active conversation, use it
      if (import.meta.env.DEV) {
        window.console.log('Sending message to existing conversation:', conversationId);
      }
      streamMessage({ conversationId, content });
    } else {
      // Otherwise, create a new conversation first
      if (import.meta.env.DEV) {
        window.console.log('Creating new conversation for message');
      }
      
      try {
        createConversation({ title: 'New conversation' }, {
          onSuccess: (newConversation: Conversation) => {
            if (import.meta.env.DEV) {
              window.console.log('New conversation created:', newConversation);
            }
            
            const newId = newConversation.id;
            // Navigate to the new conversation instead of just selecting it
            navigate(`/chat/${newId}`);
            
            // Send the message to the new conversation after a short delay
            window.setTimeout(() => {
              if (import.meta.env.DEV) {
                window.console.log('Sending message to new conversation:', newId);
              }
              streamMessage({ conversationId: newId, content });
            }, 100);
          }
        });
      } catch (err) {
        if (import.meta.env.DEV) {
          window.console.error('Error creating conversation:', err);
          setDebugInfo('Error creating conversation: ' + (err instanceof Error ? err.message : String(err)));
        }
      }
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

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 64px)', // Adjust for app bar height
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
              disabled={isDeleting}
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
              <MenuItem onClick={handleDeleteConversation} disabled={isDeleting}>
                <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
                Delete Conversation
              </MenuItem>
            </Menu>
          </div>
        </Paper>
      )}
      
      {/* Debug info (only in development) */}
      {import.meta.env.DEV && debugInfo && (
        <Alert severity="warning" onClose={() => setDebugInfo(null)} sx={{ mb: 2 }}>
          {debugInfo}
        </Alert>
      )}
      
      {/* Conversation error */}
      {conversationError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Error loading conversation: {
            conversationError instanceof Error 
              ? conversationError.message 
              : 'Unknown error'
          }
        </Alert>
      )}
      
      {/* Chat body */}
      <Box sx={{ flexGrow: 1, mb: 2, overflow: 'auto' }}>
        <MessageList 
          key={`messages-${conversationId || 'none'}`}
          messages={activeConversation?.messages || []}
          isLoading={isSending || isStreaming}
          streamedResponse={streamedResponse}
        />
      </Box>
      
      {/* Chat input */}
      <MessageInput 
        onSendMessage={handleSendMessage}
        isDisabled={isSending || isStreaming || isCreating || isDeleting}
        placeholder={
          !activeConversation
            ? 'Type a message to start a new conversation...'
            : 'Type a message...'
        }
      />
    </Box>
  );
}

export default ChatView; 