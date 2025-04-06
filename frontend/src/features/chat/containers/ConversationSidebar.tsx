import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Drawer } from '@mui/material';
import { Conversation } from '../../../types';
import SidebarContent from '../components/SidebarContent';
import { useChatContext } from '../context';

const DRAWER_WIDTH = 220;

/**
 * ConversationSidebar container component that handles:
 * - Navigation logic for selecting conversations
 * - Connecting SidebarContent with the ChatContext
 */
const ConversationSidebar: React.FC = () => {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  
  // Get data and actions from the context
  const { 
    conversations,
    createConversation,
    deleteConversation,
    isCreatingConversation,
    isDeletingConversation
  } = useChatContext();

  const handleConversationClick = (conversation: Conversation) => {
    navigate(`/chat/${conversation.id}`);
  };
  
  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    // Stop the event from bubbling up and selecting the conversation
    e.stopPropagation();
    // Use the shared deleteConversation action with the isActive flag
    deleteConversation(id, id === conversationId);
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
      <SidebarContent
        conversations={conversations}
        activeConversationId={conversationId}
        isCreating={isCreatingConversation}
        isDeleting={isDeletingConversation}
        onNewChat={createConversation}
        onConversationClick={handleConversationClick}
        onDeleteClick={handleDeleteClick}
      />
    </Drawer>
  );
};

export default ConversationSidebar; 