import React from 'react';
import { Alert, AlertProps } from '@mui/material';
import { THEME } from '../styles/theme';

interface ErrorAlertProps {
  error: string;
  sx?: AlertProps['sx'];
  showPrefix?: boolean;
}

/**
 * Reusable error alert component with consistent styling
 * for displaying error messages across the application.
 */
const ErrorAlert: React.FC<ErrorAlertProps> = ({ error, sx = {}, showPrefix = true }) => {
  return (
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
        ...sx,
      }}
    >
      {showPrefix ? 'Error: ' : ''}
      {error}
    </Alert>
  );
};

export default ErrorAlert;
