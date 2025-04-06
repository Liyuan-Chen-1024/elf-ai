import { Box } from '@mui/material';
import { useParams } from 'react-router-dom';
import ConversationView from './conversation/ConversationView';
import WelcomeScreen from './WelcomeScreen';
import ConversationSidebar from './sidebar/ConversationSidebar';

function ChatContainer() {
  const { conversationId } = useParams<{ conversationId?: string }>();
  
  return (
    <Box sx={{ 
      display: 'flex', 
      height: 'calc(100vh - 70px)', // Adjust based on your app's header height
      overflow: 'hidden',
      position: 'relative'
    }}>
      {conversationId && (
        <ConversationSidebar />
      )}
     
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
          <WelcomeScreen />
        )}
      </Box>
    </Box>
  );
}

export default ChatContainer;
