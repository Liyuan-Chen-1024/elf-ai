import React, { SyntheticEvent } from 'react';
import { Box, Typography, Button, Alert } from '@mui/material';
import { THEME } from '../styles/theme';
import PrimaryButton from './PrimaryButton';
import ContentLayout from './ContentLayout';

interface EmptyStateProps {
  message: string;
  submessage: string;
  actionButton?: {
    label: string;
    onClick: () => void;
    loading?: boolean;
    loadingLabel?: string;
  };
  error?: string | null;
  onClearError?: (event: SyntheticEvent<Element, Event>) => void;
  fullPage?: boolean;
}

/**
 * EmptyState component displayed when there is no content to show.
 * Shows a title and a description message, with optional action button and error display.
 */
const EmptyState: React.FC<EmptyStateProps> = ({ 
  message, 
  submessage, 
  actionButton,
  error,
  onClearError,
  fullPage 
}) => {
  const content = (
    <>
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
          mb: actionButton ? 3 : 0,
        }}
      >
        {submessage}
      </Typography>
      
      {error && (
        <Alert 
          severity="error" 
          {...(onClearError ? { onClose: onClearError } : {})}
          sx={{
            mt: 2,
            mb: 2,
            borderRadius: '8px',
            border: `1px solid ${THEME.colors.accent.red.border}`
          }}
        >
          {error}
        </Alert>
      )}
      
      {actionButton && (
        <PrimaryButton
          onClick={actionButton.onClick}
          loading={actionButton.loading ?? false}
        >
          {actionButton.loading && actionButton.loadingLabel 
            ? actionButton.loadingLabel 
            : actionButton.label}
        </PrimaryButton>
      )}
    </>
  );

  // If fullPage is true, wrap in ContentLayout for full page display
  if (fullPage) {
    return (
      <ContentLayout
        fullHeight
        centered
        sx={{ gap: 2, px: 2 }}
      >
        {content}
      </ContentLayout>
    );
  }

  // Otherwise just return the content in a flex box
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      flex: 1,
      minHeight: 0,
      py: 4,
    }}>
      {content}
    </Box>
  );
};

export default EmptyState; 