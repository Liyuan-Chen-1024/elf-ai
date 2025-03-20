import {
    Box,
    Button,
    Divider,
    Drawer,
    Typography,
    useMediaQuery,
    useTheme,
    Container,
    Paper
} from '@mui/material';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';

import { ElfSpinner } from '../../../components/ElfSpinner';
import { useChat } from '../hooks/useChat';
import { Conversation } from '../types';
import { ChatHeader } from './ChatHeader/ChatHeader';
import { ConversationList } from './ConversationList/ConversationList';
import { MessageInput } from './MessageInput';
import { MessageThread } from './MessageThread';
import { WelcomeScreen } from './shared/WelcomeScreen';
import { MessageList } from './MessageList';
import { useIsMobile } from '../../../shared/hooks/useIsMobile';

// Memoize the MessageInput component to prevent re-renders when parent changes
const MemoizedMessageInput = memo(MessageInput);

// Memoize the MessageThread component to prevent re-renders when parent changes
const MemoizedMessageThread = memo(MessageThread);

// Modern styled container with subtle glass effect and gradient border
const ChatContainer = styled(Paper)(({ theme }) => ({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  overflow: 'hidden',
  borderRadius: theme.shape.borderRadius * 2,
  backgroundColor: 'rgba(255, 255, 255, 0.8)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  boxShadow: `0 10px 30px rgba(0, 0, 0, 0.05), 
               inset 0 0 0 1px rgba(255, 255, 255, 0.5)`,
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '3px',
    background: 'linear-gradient(90deg, #00b09b, #96c93d)',
  },
}));

// Styled message thread container
const MessageThreadContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  flexGrow: 1,
  overflow: 'auto', // Changed from 'hidden' to 'auto' to enable scrolling
});

// Styled new chat button
const NewChatButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 3,
  padding: theme.spacing(1.2, 2),
  textTransform: 'none',
  fontWeight: 'bold',
  boxShadow: '0 3px 8px rgba(0, 206, 172, 0.25)',
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
    boxShadow: '0 4px 12px rgba(0, 206, 172, 0.35)',
  },
}));

// Styled sidebar container
const SidebarContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  borderRadius: theme.shape.borderRadius * 2,
  backgroundColor: 'rgba(255, 255, 255, 0.8)',
  backdropFilter: 'blur(5px)',
  border: '1px solid rgba(0, 0, 0, 0.05)',
  overflow: 'hidden',
}));

export const Chat = () => {
  const theme = useTheme();
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
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
    console.log('Selecting conversation from sidebar:', id);
    navigate(`/chat/${id}`);
  }, [navigate]);

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
    // If we have a conversation ID from the URL, select that conversation
    if (conversationId && conversations.length > 0) {
      console.log('Selecting conversation from URL param:', conversationId);
      const conversation = conversations.find(c => String(c.id) === conversationId);
      
      if (conversation) {
        // Select this conversation
        selectConversation(conversation);
      } else {
        console.warn(`Conversation ${conversationId} not found, navigating to /chat`);
        navigate('/chat');
      }
    }
  }, [conversationId, conversations, selectConversation, navigate]);

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
  
  // Set appropriate sidebar visibility when mobile state changes
  useEffect(() => {
    setDrawerOpen(!isMobile);
  }, [isMobile]);
  
  // Handle input changes with debounce for typing indicator
  const handleInputChange = (value: string) => {
    setInputValue(value);
    
    if (value && !isTyping) {
      setIsTyping(true);
    } else if (!value && isTyping) {
      setIsTyping(false);
    }
  };
  
  // Handle sending a message
  const handleSendMessageToChat = async () => {
    if (!inputValue.trim()) return;
    
    const message = inputValue;
    setInputValue('');
    setIsTyping(false);
    
    if (!currentConversation) {
      // If no conversation exists, create one first
      const newConversation = await createConversation('New Conversation');
      if (newConversation) {
        await sendMessage(message);
      }
    } else {
      // Otherwise, send in current conversation
      await sendMessage(message);
    }
  };
  
  if (isLoading && !currentConversation && conversations.length === 0) {
    return <ElfSpinner message="Loading conversations..." />;
  }
  
  return (
    <Container 
      maxWidth="xl" 
      sx={{ 
        height: 'calc(100vh - 64px)',
        pt: 2,
        pb: 2,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        gap: 2, 
        flexGrow: 1,
        overflow: 'hidden'
      }}>
        {drawerOpen && (
          <SidebarContainer sx={{ 
            width: { xs: '100%', md: 300 }, 
            flexShrink: 0,
            display: { xs: isMobile && !drawerOpen ? 'none' : 'block', md: 'block' }
          }}>
            <Box sx={{ p: 2, borderBottom: '1px solid rgba(0, 0, 0, 0.05)' }}>
              <NewChatButton
                fullWidth
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateConversation}
              >
                New Chat
              </NewChatButton>
            </Box>
            
            <Box sx={{ overflowY: 'auto', flexGrow: 1 }}>
              <ConversationList
                conversations={conversations}
                currentConversationId={currentConversation?.id}
                onSelectConversation={handleSelectConversation}
                onRenameConversation={renameConversation}
                onDeleteConversation={deleteConversation}
                onCreateNewChat={handleCreateConversation}
                onCreateConversation={handleCreateConversation}
              />
            </Box>
          </SidebarContainer>
        )}
        
        <ChatContainer elevation={3} sx={{ 
          flexGrow: 1,
          display: { xs: isMobile && drawerOpen ? 'none' : 'flex', md: 'flex' }
        }}>
          <MessageThreadContainer>
            <MessageList 
              messages={currentConversation?.messages || []}
              isLoading={isLoading}
              onMessageEdit={editMessage}
            />
          </MessageThreadContainer>
          
          <Box sx={{ p: 2, borderTop: '1px solid rgba(0, 0, 0, 0.05)' }}>
            <MessageInput
              value={inputValue}
              onChange={handleInputChange}
              onSend={handleSendMessageToChat}
              isDisabled={isLoading}
              placeholder="Type your message..."
              onToggleSidebar={handleToggleDrawer}
              showSidebarToggle={isMobile}
            />
          </Box>
        </ChatContainer>
      </Box>
    </Container>
  );
}; 