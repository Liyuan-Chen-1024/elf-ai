import React from 'react';
import { Box, Typography } from '@mui/material';
import { THEME } from '../styles/theme';

interface ConversationHeaderProps {
  title: string;
}

/**
 * ConversationHeader component displays the title of the active conversation
 * with appropriate styling and branding.
 */
const ConversationHeader: React.FC<ConversationHeaderProps> = ({ title }) => {
  return (
    <>
      <Box sx={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        backdropFilter: THEME.blur.strong,
        WebkitBackdropFilter: THEME.blur.strong,
        borderBottom: 'none',
        px: { xs: 3, sm: 4 },
        py: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        flexShrink: 0,
        height: '56px',
        backgroundColor: THEME.colors.background.surface,
      }}>
        <Typography 
          variant="h6" 
          sx={{ 
            fontSize: THEME.typography.fontSize.xlarge,
            fontWeight: THEME.typography.fontWeight.semibold,
            letterSpacing: THEME.typography.spacing.tight,
            background: THEME.colors.primary.gradient,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            ml: 1.5,
          }}
        >
          {title}
        </Typography>
      </Box>

      {/* Header Border */}
      <Box 
        sx={{ 
          height: '1px', 
          width: '100%',
          mb: 1.5,
          background: THEME.colors.background.headerBorder,
        }} 
      />
    </>
  );
};

export default ConversationHeader; 