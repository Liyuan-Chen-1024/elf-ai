import React from 'react';
import { Box, Typography } from '@mui/material';
import { Message } from '../../../types';
import { THEME } from '../styles/theme';

interface UserMessageProps {
  message: Message;
}

/**
 * UserMessage component displays messages from the user.
 * It renders them in a styled bubble aligned to the right.
 */
const UserMessage: React.FC<UserMessageProps> = ({ message }) => {
  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      mb: 2,
      pr: { xs: 2, sm: 3 },
      '&:last-child': { mb: 0 },
    }}>
      <Box sx={{
        display: 'flex',
        justifyContent: 'flex-end',
        width: '100%',
      }}>
        <Box 
          sx={{
            wordBreak: 'break-word',
            p: { xs: 2, sm: 2.5 },
            background: THEME.colors.background.user,
            color: THEME.colors.text.primary,
            borderRadius: '12px',
            width: 'auto',
            maxWidth: '85%',
            position: 'relative',
            border: `1px solid ${THEME.colors.background.user}`,
          }}
        > 
          <Typography 
            component="div" 
            sx={{ 
              whiteSpace: 'pre-wrap',
              fontFamily: 'inherit',
              fontSize: THEME.typography.fontSize.regular,
              lineHeight: 1.6,
              letterSpacing: THEME.typography.spacing.tight,
              minHeight: '20px',
            }}
          >
            {message.content || ''}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default UserMessage; 