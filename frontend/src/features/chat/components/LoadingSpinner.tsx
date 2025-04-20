import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { THEME } from '../styles/theme';

interface LoadingSpinnerProps {
  message?: string;
  fullPage?: boolean;
}

/**
 * LoadingSpinner provides a consistent loading indicator
 * with optional message text.
 */
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading...',
  fullPage = false,
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        ...(fullPage && {
          height: THEME.layout.contentHeight,
          width: '100%',
        }),
        padding: 4,
        gap: 2,
      }}
    >
      <CircularProgress
        size={40}
        sx={{
          color: THEME.colors.primary.main,
          animation: `${THEME.animations.pulse} 2s infinite`,
        }}
      />

      {message && (
        <Typography
          variant="body1"
          sx={{
            color: THEME.colors.text.secondary,
            fontWeight: THEME.typography.fontWeight.medium,
          }}
        >
          {message}
        </Typography>
      )}
    </Box>
  );
};

export default LoadingSpinner;
