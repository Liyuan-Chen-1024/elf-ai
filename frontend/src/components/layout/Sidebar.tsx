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
  Divider,
  IconButton,
  Toolbar,
  Typography,
  Badge,
  Tooltip,
} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import NewspaperIcon from '@mui/icons-material/Newspaper';
import PersonIcon from '@mui/icons-material/Person';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useConversations } from '../../hooks/useChat';
import { Conversation } from '../../types';

const DRAWER_WIDTH = 280;

interface SidebarProps {
  open: boolean;
  activeTab: 'chat' | 'news' | 'profile';
  onTabChange: (tab: 'chat' | 'news' | 'profile') => void;
}

function Sidebar({ open, activeTab, onTabChange }: SidebarProps) {
  const navigate = useNavigate();
  const { conversationId } = useParams<{ conversationId?: string }>();
  
  const { 
    conversations, 
    createConversation,
    deleteConversation,
    isCreating,
    isDeleting
  } = useConversations();

  // Main navigation tabs
  const mainTabs = [
    { id: 'chat' as const, label: 'Chat', icon: <ChatIcon />, count: conversations.length },
    { id: 'news' as const, label: 'News', icon: <NewspaperIcon />, count: 0 },
    { id: 'profile' as const, label: 'Profile', icon: <PersonIcon />, count: 0 },
  ];

  const handleTabClick = (tabId: 'chat' | 'news' | 'profile') => {
    onTabChange(tabId);
  };

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

  return (
    <Drawer
      variant="persistent"
      open={open}
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
        },
      }}
    >
      <Toolbar /> {/* Spacer to position below app bar */}
      
      {/* Main navigation */}
      <Box sx={{ overflow: 'auto', mt: 2 }}>
        <List>
          {mainTabs.map((tab) => (
            <ListItem key={tab.id} disablePadding>
              <ListItemButton 
                selected={activeTab === tab.id}
                onClick={() => handleTabClick(tab.id)}
              >
                <ListItemIcon>
                  {tab.count > 0 ? (
                    <Badge badgeContent={tab.count} color="primary">
                      {tab.icon}
                    </Badge>
                  ) : (
                    tab.icon
                  )}
                </ListItemIcon>
                <ListItemText primary={tab.label} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        
        <Divider sx={{ my: 2 }} />
        
        {/* Chat section - only visible when Chat tab is active */}
        {activeTab === 'chat' && (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, mb: 1 }}>
              <Typography variant="h6">Conversations</Typography>
              <IconButton 
                color="primary" 
                size="small" 
                aria-label="new chat"
                onClick={handleNewChat}
                disabled={isCreating}
              >
                <AddIcon />
              </IconButton>
            </Box>
            
            <List>
              {conversations.length === 0 ? (
                <ListItem>
                  <ListItemText 
                    primary="No conversations yet" 
                    secondary="Start a new chat to begin" 
                    primaryTypographyProps={{ variant: 'body2' }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                </ListItem>
              ) : (
                conversations.map((conversation) => (
                  <ListItem 
                    key={conversation.id} 
                    disablePadding
                    secondaryAction={
                      <Tooltip title="Delete conversation">
                        <IconButton 
                          edge="end" 
                          aria-label="delete" 
                          size="small"
                          onClick={(e) => handleDeleteClick(conversation.id, e)}
                          disabled={isDeleting}
                          sx={{ opacity: 0.7 }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    }
                    sx={{ pr: 6 }} // Add padding for the delete button
                  >
                    <ListItemButton 
                      selected={conversationId === conversation.id}
                      onClick={() => handleConversationClick(conversation)}
                    >
                      <ListItemIcon>
                        <ChatIcon color={conversation.archived ? 'disabled' : 'primary'} />
                      </ListItemIcon>
                      <ListItemText 
                        primary={conversation.title} 
                        secondary={conversation.lastMessage?.content?.substring(0, 20) + '...'}
                        primaryTypographyProps={{
                          noWrap: true,
                          color: conversation.archived ? 'text.disabled' : 'text.primary',
                        }}
                        secondaryTypographyProps={{
                          noWrap: true,
                          variant: 'caption',
                          color: 'text.secondary',
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                ))
              )}
            </List>
          </>
        )}
      </Box>
    </Drawer>
  );
}

export default Sidebar; 