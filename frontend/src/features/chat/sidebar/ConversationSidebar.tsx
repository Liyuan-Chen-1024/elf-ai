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
  Button,
  alpha
} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useConversations } from '../../../hooks/useChat';
import { Conversation } from '../../../types';

const DRAWER_WIDTH = 220;

function Sidebar() {
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
  
  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    // Stop the event from bubbling up and selecting the conversation
    e.stopPropagation();
    if (import.meta.env.DEV) {
      window.console.log('Deleting conversation from sidebar:', id);
    }
    deleteConversation(id, {
      onSuccess: () => {
        // Navigate to main chat route if we deleted the active conversation
        if (id === conversationId) {
          navigate('/chat');
        }
      }
    });
  };

  return (
    <Drawer
      variant="permanent"
      open={true}
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
        py: 1.5,
        px: 2,
        overflow: 'hidden'
      }}>
        {/* New Chat Button */}
        <Button
          variant="contained"
          startIcon={<AddIcon fontSize="small" />}
          onClick={handleNewChat}
          disabled={isCreating}
          fullWidth
          sx={{
            mb: 1.5,
            borderRadius: 1.5,
            padding: '4px 12px',
            height: '32px',
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.8rem',
            background: theme => `linear-gradient(135deg, ${theme.palette.primary.main} 0%, #FF7597 100%)`,
            boxShadow: '0 2px 8px rgba(124, 77, 255, 0.2)',
            '&:hover': {
              boxShadow: '0 4px 12px rgba(124, 77, 255, 0.3)',
              background: theme => `linear-gradient(135deg, ${theme.palette.primary.main} 0%, #FF7597 100%)`,
              opacity: 0.9,
            },
          }}
        >
          New Chat
        </Button>
        
        {/* Separator */}
        <Box 
          sx={{ 
            height: '1px', 
            width: '100%',
            mb: 1.5,
            background: 'linear-gradient(90deg, rgba(124, 77, 255, 0.08) 0%, rgba(255, 117, 151, 0.08) 100%)',
          }} 
        />
        
        {/* Conversations Header */}
        <Typography 
          variant="subtitle2" 
          sx={{ 
            px: 1.5, 
            mb: 1,
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
                  sx={{ mb: 0.75 }}
                >
                  <ListItemButton 
                    dense
                    selected={conversationId === conversation.id}
                    onClick={() => handleConversationClick(conversation)}
                    sx={{
                      borderRadius: 1.5,
                      py: 1,
                      pl: 1.5,
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
                        fontSize: '0.9rem',
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
                        <DeleteIcon fontSize="small" />
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