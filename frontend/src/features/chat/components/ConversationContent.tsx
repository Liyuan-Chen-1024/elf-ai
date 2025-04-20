import React from 'react';
import { Box } from '@mui/material';
import ErrorAlert from './ErrorAlert';

interface ConversationContentProps {
  children: React.ReactNode;
  conversationError: string | null;
}

/**
 * ConversationContent component wraps the message list with appropriate
 * styling and error handling.
 */
const ConversationContent: React.FC<ConversationContentProps> = ({
  children,
  conversationError,
}) => {
  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        overflow: 'auto',
        px: { xs: 4, sm: 5 },
        py: { xs: 4, sm: 4 },
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
      }}
    >
      {conversationError && (
        <ErrorAlert
          error={`Unable to load conversation: ${conversationError}`}
          showPrefix={false}
        />
      )}

      {children}
    </Box>
  );
};

export default ConversationContent;
