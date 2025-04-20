import React from 'react';
import { Box } from '@mui/material';
import { useParams } from 'react-router-dom';
import { ConversationView, ConversationSidebar, ErrorBoundary, EmptyState } from '../index';
import { ChatProvider, useChatContext } from '../context';
import { THEME } from '../styles/theme';

/**
 * Welcome screen displayed when no conversation is selected
 */
const WelcomeView: React.FC = () => {
  const { createConversation, conversationError, clearConversationError, isCreatingConversation } =
    useChatContext();

  return (
    <EmptyState
      message="Welcome to ElfAI Chat"
      submessage="Select a conversation from the sidebar or create a new one"
      actionButton={{
        label: 'Start New Conversation',
        onClick: createConversation,
        loading: isCreatingConversation,
        loadingLabel: 'Creating...',
      }}
      error={conversationError}
      onClearError={clearConversationError}
      fullPage
    />
  );
};

/**
 * ChatContainer is the main layout component for the chat feature.
 * It provides the ChatContext to all child components and manages
 * the layout structure of the chat UI.
 */
const ChatContainer: React.FC = () => {
  const { conversationId } = useParams<{ conversationId?: string }>();

  return (
    <ErrorBoundary>
      <ChatProvider conversationId={conversationId}>
        <Box
          sx={{
            display: 'flex',
            height: THEME.layout.contentHeight,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {/* Always show sidebar for consistency */}
          <ConversationSidebar />

          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {conversationId ? (
              <ErrorBoundary>
                <ConversationView />
              </ErrorBoundary>
            ) : (
              <ErrorBoundary>
                <WelcomeView />
              </ErrorBoundary>
            )}
          </Box>
        </Box>
      </ChatProvider>
    </ErrorBoundary>
  );
};

export default ChatContainer;
