import React from 'react';
import { Box, Typography } from '@mui/material';
import { THEME } from '../styles/theme';

interface EmptyStateProps {
  message: string;
  submessage: string;
}

/**
 * EmptyState component displayed when there are no messages in the conversation.
 * Shows a title and a description message.
 */
const EmptyState: React.FC<EmptyStateProps> = ({ message, submessage }) => (
  <Box sx={{ 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    justifyContent: 'center',
    flex: 1,
    minHeight: 0,
    py: 4,
  }}>
    <Typography 
      variant="h5" 
      sx={{ 
        color: THEME.colors.text.primary,
        fontWeight: THEME.typography.fontWeight.semibold,
        fontSize: THEME.typography.fontSize.large,
        letterSpacing: THEME.typography.spacing.tighter,
        mb: 1,
      }}
    >
      {message}
    </Typography>
    <Typography 
      variant="body2" 
      sx={{ 
        color: THEME.colors.text.secondary,
        fontSize: THEME.typography.fontSize.regular,
      }}
    >
      {submessage}
    </Typography>
  </Box>
);

export default EmptyState; 