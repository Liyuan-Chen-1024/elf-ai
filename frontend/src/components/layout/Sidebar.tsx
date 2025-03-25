import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Drawer,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
  Typography,
  Paper,
  InputBase,
  alpha
} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import { useConversations } from '../../hooks/useChat';
import { Conversation } from '../../types';

const DRAWER_WIDTH = 280;

interface SidebarProps {
  open: boolean;
  activeTab: 'chat' | 'news' | 'profile';
  onTabChange: (tab: 'chat' | 'news' | 'profile') => void;
}

function Sidebar({ open, activeTab }: SidebarProps) {
  const navigate = useNavigate();
  const { conversationId } = useParams<{ conversationId?: string }>();
  
  const { 
    conversations, 
    createConversation,
    deleteConversation,
    isCreating,
    isDeleting
  } = useConversations();

  const handleConversationClick = (conversation: Conversation) => {
    navigate(`/chat/${conversation.id}`);
  };

  const handleNewChat = () => {
    createConversation(
      { title: 'New conversation' },
      {
        onSuccess: (newConversation: Conversation) => {
          navigate(`/chat/${newConversation.id}`);
        }
      }
    );
  };
  
  const handleDeleteClick = (conversationId: string, e: React.MouseEvent) => {
    // Stop the event from bubbling up and selecting the conversation
    e.stopPropagation();
    if (import.meta.env.DEV) {
      window.console.log('Deleting conversation from sidebar:', conversationId);
    }
    deleteConversation(conversationId, {
      onSuccess: () => {
        // Navigate to main chat route if we deleted the active conversation
        if (conversationId === conversationId) {
          navigate('/chat');
        }
      }
    });
  };

  // Only render the sidebar if we're on the chat tab
  if (activeTab !== 'chat') {
    return null;
  }

  if (!open) {
    return null;
  }

  return (
    <Drawer
      variant="permanent"
      open={open}
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        height: '100%',
        '& .MuiDrawer-paper': {
          position: 'relative',
          width: DRAWER_WIDTH,
          height: '100%',
          boxSizing: 'border-box',
          border: 'none',
          borderRight: '1px solid',
          borderColor: 'divider',
          boxShadow: 'none',
          overflow: 'hidden'
        },
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%', 
        py: 1,
        px: 1.5,
        overflow: 'hidden'
      }}>
        {/* Search and New Chat */}
        <Paper
          component="form"
          sx={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: theme => alpha(theme.palette.primary.main, 0.04),
            borderRadius: 2,
            p: '2px 8px',
            mb: 1.5,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <IconButton sx={{ p: '4px' }} aria-label="search">
            <SearchIcon fontSize="small" />
          </IconButton>
          <InputBase
            sx={{ ml: 1, flex: 1, fontSize: '0.85rem' }}
            placeholder="Search conversations"
            inputProps={{ 'aria-label': 'search conversations' }}
          />
          <Tooltip title="New conversation">
            <IconButton 
              color="primary" 
              size="small" 
              aria-label="new chat"
              onClick={handleNewChat}
              disabled={isCreating}
              sx={{
                p: '4px',
                borderRadius: '50%',
                '&:hover': {
                  backgroundColor: theme => alpha(theme.palette.primary.main, 0.15),
                }
              }}
            >
              <AddIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Paper>
        
        {/* Conversations Header */}
        <Typography 
          variant="subtitle2" 
          sx={{ 
            px: 1, 
            mb: 0.5, 
            fontWeight: 600,
            fontSize: '0.75rem',
            color: 'text.secondary',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}
        >
          Recent Conversations
        </Typography>
        
        {/* Conversations List */}
        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
          <List disablePadding dense>
            {conversations.length === 0 ? (
              <ListItem sx={{ py: 1.5, px: 1 }}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 1.5, 
                    width: '100%',
                    backgroundColor: theme => alpha(theme.palette.background.paper, 0.5),
                    border: '1px dashed',
                    borderColor: 'divider',
                    borderRadius: 1.5
                  }}
                >
                  <ListItemText 
                    primary="No conversations yet" 
                    secondary="Start a new chat to begin" 
                    primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                </Paper>
              </ListItem>
            ) : (
              conversations.map((conversation) => (
                <ListItem 
                  key={conversation.id} 
                  disablePadding
                  sx={{ mb: 0.5 }}
                >
                  <ListItemButton 
                    dense
                    selected={conversationId === conversation.id}
                    onClick={() => handleConversationClick(conversation)}
                    sx={{
                      borderRadius: 1.5,
                      py: 0.5,
                      '&.Mui-selected': {
                        backgroundColor: theme => alpha(theme.palette.primary.main, 0.1),
                        '&:hover': {
                          backgroundColor: theme => alpha(theme.palette.primary.main, 0.15),
                        }
                      }
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <ChatIcon 
                        color={conversation.archived ? 'disabled' : 'primary'} 
                        fontSize="small"
                      />
                    </ListItemIcon>
                    <ListItemText 
                      primary={conversation.title} 
                      secondary={
                        conversation.lastMessage?.content 
                          ? conversation.lastMessage.content.substring(0, 25) + (conversation.lastMessage.content.length > 25 ? '...' : '') 
                          : 'New conversation'
                      }
                      primaryTypographyProps={{
                        noWrap: true,
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        color: conversation.archived ? 'text.disabled' : 'text.primary',
                      }}
                      secondaryTypographyProps={{
                        noWrap: true,
                        variant: 'caption',
                        fontSize: '0.75rem',
                        color: 'text.secondary',
                      }}
                      sx={{ my: 0 }}
                    />
                    <Tooltip title="Delete conversation">
                      <IconButton 
                        edge="end" 
                        aria-label="delete" 
                        size="small"
                        onClick={(e) => handleDeleteClick(conversation.id, e)}
                        disabled={isDeleting}
                        sx={{ 
                          opacity: 0.7,
                          padding: '2px',
                          '&:hover': { 
                            opacity: 1,
                            color: 'error.main' 
                          }
                        }}
                      >
                        <DeleteIcon sx={{ fontSize: '1rem' }} />
                      </IconButton>
                    </Tooltip>
                  </ListItemButton>
                </ListItem>
              ))
            )}
          </List>
        </Box>
      </Box>
    </Drawer>
  );
}

export default Sidebar; 