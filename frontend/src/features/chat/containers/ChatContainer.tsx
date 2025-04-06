import React from 'react';
import { Box } from '@mui/material';
import { useParams } from 'react-router-dom';
import { 
  ConversationView, 
  ConversationSidebar
} from '../index';
import WelcomeContainer from './WelcomeContainer';
import { ChatProvider } from '../context';

/**
 * ChatContainer is the main layout component for the chat feature.
 * It provides the ChatContext to all child components and manages
 * the layout structure of the chat UI.
 */
const ChatContainer: React.FC = () => {
  const { conversationId } = useParams<{ conversationId?: string }>();
  
  return (
    <ChatProvider>
      <Box sx={{ 
        display: 'flex', 
        height: 'calc(100vh - 70px)', // Adjust based on your app's header height
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Always show sidebar for consistency */}
        <ConversationSidebar />
       
        <Box sx={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative'
        }}>
          {conversationId ? (
            <ConversationView />
          ) : (
            <WelcomeContainer />
          )}
        </Box>
      </Box>
    </ChatProvider>
  );
};

export default ChatContainer; 