import {
    alpha,
    Box,
    Button,
    Divider,
    Drawer,
    Fade,
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
    messages,
    isLoading,
    error,
    streamingContent,
    createConversation,
    selectConversation,
    sendMessage,
    handleSendMessageStreaming,
    editMessage,
    deleteMessage,
    renameConversation,
    deleteConversation,
    toggleThinking
  } = useChat();

  // Memoize handlers to prevent re-creation on render
  const handleSendMessage = useCallback((content: string) => {
    if (currentConversation) {
      handleSendMessageStreaming(content);
    }
  }, [currentConversation, handleSendMessageStreaming]);

  const handleEditMessage = useCallback((messageId: string, content: string) => {
    editMessage(messageId, content);
  }, [editMessage]);

  const handleDeleteMessage = useCallback((messageId: string) => {
    deleteMessage(messageId);
  }, [deleteMessage]);

  const handleCopyMessage = useCallback((content: string) => {
    navigator.clipboard.writeText(content).catch(err => {
      console.error('Failed to copy: ', err);
    });
  }, []);

  const handleToggleDrawer = useCallback(() => {
    setDrawerOpen((prev: boolean) => !prev);
  }, []);

  const handleSelectConversation = useCallback((id: string | number) => {
    const conversation = conversations.find((c: Conversation) => String(c.id) === String(id));
    
    if (conversation) {
      selectConversation(conversation);
      navigate(`/chat/${conversation.id}`);
    }
  }, [conversations, selectConversation, navigate]);

  const handleCreateConversation = useCallback(() => {
    createConversation("New Conversation");
  }, [createConversation]);

  const handleNewChatClick = useCallback(() => {
    handleCreateConversation();
  }, [handleCreateConversation]);

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
    if (conversationId) {
      // Look for the conversation in active conversations
      const activeConvo = conversations.find(
        (c: Conversation) => String(c.id) === String(conversationId)
      );
      
      if (activeConvo) {
        selectConversation(activeConvo);
        return;
      }
      
      // If not found and we have conversations, select the first one
      if (conversations.length > 0) {
        selectConversation(conversations[0]);
        navigate(`/chat/${conversations[0].id}`);
      }
    } else if (conversations.length > 0) {
      // No conversation ID but we have active conversations, select the first one
      selectConversation(conversations[0]);
      navigate(`/chat/${conversations[0].id}`);
    }
  }, [conversationId, conversations, selectConversation, navigate]);

  // Close drawer on mobile when a conversation is selected
  useEffect(() => {
    if (isMobile && currentConversation) {
      setDrawerOpen(false);
    }
  }, [currentConversation, isMobile]);
  
  // Memoize key UI elements to prevent unnecessary re-renders
  const drawerWidth = 320;
  
  // Memoize the message thread props to prevent unnecessary re-renders
  const messageThreadProps = useMemo(() => ({
    messages,
    isLoading,
    streamingContent,
    error,
    onEditMessage: handleEditMessage,
    onDeleteMessage: handleDeleteMessage,
    onToggleThinking: toggleThinking
  }), [
    messages,
    isLoading,
    streamingContent,
    error,
    handleEditMessage,
    handleDeleteMessage,
    toggleThinking
  ]);

  // Memoize the message input props
  const messageInputProps = useMemo(() => ({
    onSendMessage: handleSendMessage,
    disabled: isLoading
  }), [handleSendMessage, isLoading]);
  
  if (isLoading && !currentConversation) {
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
            onClick={handleNewChatClick}
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
              onCreateConversation={createConversation}
              onRenameConversation={renameConversation}
              onDeleteConversation={deleteConversation}
              onCreateNewChat={handleCreateConversation}
            />
          )}
        </Box>
      </Drawer>

      {/* Main content area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100%', 
          overflow: 'hidden',
          bgcolor: theme.palette.background.default,
          width: '100%',
          position: 'relative',
        }}
      >
        {/* Chat header with conversation title */}
        {currentConversation && (
          <Box sx={{ 
            position: 'sticky',
            top: 0,
            zIndex: 10,
            bgcolor: theme.palette.background.default,
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          }}>
            <ChatHeader
              conversation={currentConversation}
              onToggleDrawer={handleToggleDrawer}
              onRename={(title: string) => renameConversation(currentConversation.id, title)}
              onDelete={() => deleteConversation(currentConversation.id)}
              isMobile={isMobile}
            />
          </Box>
        )}

        {/* Message thread or welcome screen */}
        <Box
          sx={{
            flexGrow: 1,
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            padding: '0 0 80px',
            position: 'relative',
            height: currentConversation ? 'calc(100% - 56px)' : '100%', // Adjust height based on whether there's a conversation header
          }}
        >
          {currentConversation ? (
            <MemoizedMessageThread {...messageThreadProps} />
          ) : (
            <Fade in={true}>
              <Box sx={{ flexGrow: 1 }}>
                <WelcomeScreen
                  drawerOpen={drawerOpen}
                  isMobile={isMobile}
                  handleDrawerToggle={handleToggleDrawer}
                  createConversation={createConversation}
                />
              </Box>
            </Fade>
          )}
        </Box>

        {/* Message input area */}
        {currentConversation && (
          <Box sx={{ 
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            bgcolor: theme.palette.background.paper,
            boxShadow: '0 -2px 10px rgba(0,0,0,0.05)',
            borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            padding: '12px 16px',
            zIndex: 10,
          }}>
            <MemoizedMessageInput {...messageInputProps} />
          </Box>
        )}
      </Box>
    </Box>
  );
}; 