import React from 'react';
import { Box, Typography, Alert, Button } from '@mui/material';
import { THEME } from '../styles/theme';

interface EmptyConversationStateProps {
  onCreateConversation: () => void;
  isCreating: boolean;
  error: string | null;
}

/**
 * EmptyConversationState component displays a welcome message and create button
 * when no conversations exist.
 */
const EmptyConversationState: React.FC<EmptyConversationStateProps> = ({
  onCreateConversation,
  isCreating,
  error
}) => {
  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: 'calc(100vh - 70px)',
      gap: 2,
      backgroundColor: THEME.colors.background.surface,
      px: 2,
    }}>
      <Typography variant="h6">Welcome to Chat</Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Button 
        variant="contained" 
        color="primary"
        onClick={onCreateConversation}
        disabled={isCreating}
        sx={{
          background: THEME.colors.primary.gradient,
          borderRadius: '50px',
          padding: '10px 24px',
          textTransform: 'none',
          fontWeight: THEME.typography.fontWeight.semibold,
          '&:hover': {
            background: THEME.colors.primary.hoverGradient,
          }
        }}
      >
        {isCreating ? 'Creating...' : 'Start New Conversation :)'}
      </Button>
    </Box>
  );
};

export default EmptyConversationState; 