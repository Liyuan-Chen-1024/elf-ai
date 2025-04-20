import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button } from '@mui/material';
import ErrorAlert from './ErrorAlert';
import ContentLayout from './ContentLayout';
import { THEME } from '../styles/theme.tsx';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary catches JavaScript errors anywhere in its child component tree,
 * logs those errors, and displays a fallback UI instead of crashing.
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error, errorInfo: null };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // You can also log the error to an error reporting service
    window.console.error('Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  override render(): ReactNode {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ContentLayout fullHeight centered>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              gap: 3,
              padding: 3,
              maxWidth: '600px',
            }}
          >
            <Typography
              variant="h5"
              sx={{
                color: THEME.colors.text.primary,
                fontWeight: THEME.typography.fontWeight.semibold,
              }}
            >
              Something went wrong
            </Typography>

            {this.state.error && <ErrorAlert error={this.state.error.message} />}

            <Button
              variant="contained"
              onClick={this.handleReset}
              sx={{
                mt: 2,
                background: THEME.colors.primary.main,
                borderRadius: '50px',
                padding: '10px 24px',
                textTransform: 'none',
                fontWeight: THEME.typography.fontWeight.semibold,
              }}
            >
              Try Again
            </Button>
          </Box>
        </ContentLayout>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
