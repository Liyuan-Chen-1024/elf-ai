import React from 'react';
import { Box, Alert } from '@mui/material';
import { THEME } from '../styles/theme';

interface ConversationContentProps {
  children: React.ReactNode;
  conversationError: Error | null;
}

/**
 * ConversationContent component wraps the message list with appropriate
 * styling and error handling.
 */
const ConversationContent: React.FC<ConversationContentProps> = ({ 
  children,
  conversationError 
}) => {
  return (
    <Box sx={{
      flex: 1,
      minHeight: 0,
      overflow: 'auto',
      px: { xs: 4, sm: 5 },
      py: { xs: 4, sm: 4 },
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'rgba(255, 255, 255, 0.7)',
    }}>
      {conversationError && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3,
            borderRadius: '12px',
            border: `1px solid ${THEME.colors.accent.red.border}`,
            flexShrink: 0,
            '& .MuiAlert-icon': {
              color: THEME.colors.accent.red.main,
            },
          }}
        >
          Error loading conversation: {
            conversationError instanceof Error 
              ? conversationError.message 
              : 'Unknown error'
          }
        </Alert>
      )}
      
      {children}
    </Box>
  );
};

export default ConversationContent; 