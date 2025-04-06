import React, { SyntheticEvent } from 'react';
import { Box, Typography, Button, CircularProgress, Alert } from '@mui/material';
import { THEME } from '../styles/theme';

interface WelcomeScreenProps {
  onNewChat: () => void;
  isCreating: boolean;
  error: string | null;
  onClearError?: (event: SyntheticEvent<Element, Event>) => void;
}

/**
 * WelcomeScreen component displayed when no conversation is selected.
 * Provides a button to start a new conversation.
 */
const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onNewChat,
  isCreating,
  error,
  onClearError
}) => {
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      gap: 2
    }}>
      <Typography 
        variant="h5"
        sx={{
          fontSize: THEME.typography.fontSize.large,
          fontWeight: THEME.typography.fontWeight.semibold,
          color: THEME.colors.text.primary
        }}
      >
        Welcome to Chat
      </Typography>
      
      {error && (
        <Alert 
          severity="error" 
          onClose={onClearError ? onClearError : undefined}
          sx={{
            borderRadius: '8px',
            border: `1px solid ${THEME.colors.accent.red.border}`
          }}
        >
          {error}
        </Alert>
      )}

      <Button 
        variant="contained" 
        onClick={onNewChat}
        disabled={isCreating}
        startIcon={isCreating ? <CircularProgress size={20} color="inherit" /> : null}
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
        {isCreating ? 'Creating...' : 'Start New Conversation! :)'}
      </Button>
    </Box>
  );
}

export default WelcomeScreen; 