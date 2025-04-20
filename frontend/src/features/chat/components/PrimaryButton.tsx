import React from 'react';
import { Button, ButtonProps, CircularProgress } from '@mui/material';
import { THEME } from '../styles/theme';

interface PrimaryButtonProps extends Omit<ButtonProps, 'variant' | 'color'> {
  loading?: boolean;
  children: React.ReactNode;
}

/**
 * PrimaryButton provides consistent styling for primary actions
 * throughout the application, with support for loading state.
 */
const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  loading = false,
  disabled = false,
  children,
  sx = {},
  ...props
}) => {
  return (
    <Button
      variant="contained"
      disabled={disabled || loading}
      startIcon={loading ? <CircularProgress size={20} color="inherit" /> : props.startIcon}
      sx={{
        background: THEME.colors.primary.gradient,
        borderRadius: '50px',
        padding: '10px 24px',
        textTransform: 'none',
        fontWeight: THEME.typography.fontWeight.semibold,
        '&:hover': {
          background: THEME.colors.primary.hoverGradient,
        },
        ...sx,
      }}
      {...props}
    >
      {children}
    </Button>
  );
};

export default PrimaryButton;
