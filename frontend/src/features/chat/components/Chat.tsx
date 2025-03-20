import {
    Box,
    Button,
    Divider,
    Drawer,
    Typography,
    useMediaQuery,
    useTheme
} from '@mui/material';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { AddIcon } from '../../../components/AddIcon';
import { ElfSpinner } from '../../../components/ElfSpinner';
import { useChat } from '../hooks/useChat';
import { Conversation } from '../types';
import { ChatHeader } from './ChatHeader/ChatHeader';
import { ConversationList } from './ConversationList/ConversationList';
import { MessageInput } from './MessageInput';
import { MessageThread } from './MessageThread';
import { WelcomeScreen } from './shared/WelcomeScreen';

// Memoize the MessageInput component to prevent re-renders when parent changes
const MemoizedMessageInput = memo(MessageInput);

// Memoize the MessageThread component to prevent re-renders when parent changes
const MemoizedMessageThread = memo(MessageThread);

export const Chat = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const navigate = useNavigate();
  const { conversationId } = useParams();
  
  const {
    conversations,
    currentConversation,
    isLoading,
    error,
    isStreaming,
    sendMessage,
    editMessage,
    createConversation,
    selectConversation,
    renameConversation,
    deleteConversation,
    clearError
  } = useChat();

  // Memoize handlers to prevent re-creation on render
  const handleSendMessage = useCallback((content: string) => {
    if (currentConversation) {
      sendMessage(content);
    }
  }, [currentConversation, sendMessage]);

  const handleToggleDrawer = useCallback(() => {
    setDrawerOpen((prev) => !prev);
  }, []);

  const handleSelectConversation = useCallback((id: string | number) => {
    const conversation = conversations.find((c: Conversation) => String(c.id) === String(id));
    if (conversation) {
      selectConversation(conversation);
      navigate(`/chat/${conversation.id}`);
    }
  }, [conversations, selectConversation, navigate]);

  const handleCreateConversation = useCallback(async () => {
    try {
      const newConversation = await createConversation("New Conversation");
      console.log('Created new conversation:', newConversation);
      if (newConversation) {
        selectConversation(newConversation);
        navigate(`/chat/${newConversation.id}`);
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  }, [createConversation, selectConversation, navigate]);

  // Close drawer when switching to mobile
  useEffect(() => {
    if (isMobile) {
      setDrawerOpen(false);
    } else {
      setDrawerOpen(true);
    }
  }, [isMobile]);
  
  // Handle URL parameter for conversation selection
  useEffect(() => {
    if (!conversationId || conversations.length === 0) return;

    const targetConversation = conversations.find(
      (c) => String(c.id) === String(conversationId)
    );
    
    // Only select if we have a valid conversation and it's different from the current one
    if (targetConversation && (!currentConversation || currentConversation.id !== targetConversation.id)) {
      selectConversation(targetConversation);
    } else if (!targetConversation && conversations.length > 0) {
      // If conversation not found, navigate to the first one
      navigate(`/chat/${conversations[0].id}`);
    }
  }, [conversationId, conversations, currentConversation, selectConversation, navigate]);

  // Close drawer on mobile when a conversation is selected
  useEffect(() => {
    if (isMobile && currentConversation) {
      setDrawerOpen(false);
    }
  }, [currentConversation, isMobile]);
  
  const drawerWidth = 320;
  
  // Memoize the message thread props
  const messageThreadProps = useMemo(() => ({
    messages: currentConversation?.messages || [],
    isLoading,
    isStreaming,
    error,
    onEditMessage: editMessage,
    clearError
  }), [currentConversation?.messages, isLoading, isStreaming, error, editMessage, clearError]);

  // Memoize the message input props
  const messageInputProps = useMemo(() => ({
    onSendMessage: handleSendMessage,
    disabled: isLoading || isStreaming
  }), [handleSendMessage, isLoading, isStreaming]);
  
  if (isLoading && !currentConversation && conversations.length === 0) {
    return <ElfSpinner message="Loading conversations..." />;
  }
  
  return (
    <Box sx={{ height: 'calc(100vh - 64px)', display: 'flex', position: 'relative' }}>
      <Drawer
        variant="persistent"
        open={drawerOpen}
        sx={{
          position: 'relative',
          zIndex: 1,
          width: drawerWidth,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            position: 'static',
            background: theme.palette.grey[50],
            borderRight: `1px solid ${theme.palette.divider}`,
            height: '100%',
            boxSizing: 'border-box',
          },
        }}
      >
        <Box sx={{ 
          p: 1.5, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          height: '64px',
          boxSizing: 'border-box'
        }}>
          <Button
            fullWidth
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleCreateConversation}
            sx={{
              py: 1,
              px: 2,
              borderRadius: 28,
              textTransform: 'none',
              fontWeight: 'bold',
              fontSize: '0.95rem',
              boxShadow: '0 3px 8px rgba(0, 206, 172, 0.25)',
              backgroundColor: '#00CEAC',
              '&:hover': {
                backgroundColor: '#00B597',
                boxShadow: '0 4px 12px rgba(0, 206, 172, 0.35)',
              },
            }}
          >
            New Chat
          </Button>
        </Box>
        
        <Divider />
        
        <Box sx={{ overflowY: 'auto', height: 'calc(100% - 64px)' }}>
          {conversations.length === 0 ? (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No conversations yet
              </Typography>
            </Box>
          ) : (
            <ConversationList
              conversations={conversations}
              currentConversationId={currentConversation?.id}
              onSelectConversation={handleSelectConversation}
              onRenameConversation={renameConversation}
              onDeleteConversation={deleteConversation}
              onCreateNewChat={handleCreateConversation}
              onCreateConversation={handleCreateConversation}
            />
          )}
        </Box>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {!currentConversation ? (
          <WelcomeScreen
            drawerOpen={drawerOpen}
            isMobile={isMobile}
            handleDrawerToggle={handleToggleDrawer}
            createConversation={handleCreateConversation}
          />
        ) : (
          <>
            <ChatHeader
              conversation={currentConversation}
              onRename={(title: string) => renameConversation(currentConversation.id, title)}
              onDelete={() => deleteConversation(currentConversation.id)}
              isMobile={isMobile}
              onToggleDrawer={handleToggleDrawer}
            />
            <MemoizedMessageThread {...messageThreadProps} />
            <MemoizedMessageInput {...messageInputProps} />
          </>
        )}
      </Box>
    </Box>
  );
}; 