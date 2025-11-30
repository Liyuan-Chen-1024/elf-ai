import React from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Container,
  Divider,
} from '@mui/material';
import { ApiError } from '../../services/fetchClient';
import { useLoginForm } from './hooks';

function LoginPage() {
  const {
    username,
    setUsername,
    password,
    setPassword,
    formError,
    loginError,
    isLoginLoading,
    showDebugInfo,
    handleSubmit,
    handleTestLogin,
  } = useLoginForm();

  // Format error message from the API
  const getErrorMessage = () => {
    if (!loginError) return null;

    if (loginError instanceof ApiError) {
      const status = loginError.status;
      const data = loginError.data;

      // Handle different error types
      if (status === 404) {
        return 'API endpoint not found. Please check the server configuration.';
      } else if (status === 401) {
        return 'Invalid username or password.';
      } else if (status === 429) {
        return 'Too many login attempts. Please try again later.';
      } else if (data?.detail) {
        return data.detail;
      }
    }

    return loginError.message;
  };

  // Display either form validation errors or auth errors
  const errorMessage = formError || getErrorMessage();

  // Get API URL for debug info
  const getApiUrl = () => {
    return import.meta.env.VITE_API_URL || 'http://localhost:8000';
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h4" gutterBottom>
          ElfAI
        </Typography>

        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography component="h2" variant="h5" gutterBottom>
            Sign in
          </Typography>

          {errorMessage && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errorMessage}
              {import.meta.env.DEV && (
                <Box sx={{ mt: 1, fontSize: '0.9em' }}>
                  <strong>Hint:</strong> Try using username <code>admin</code> and password{' '}
                  <code>password</code>
                </Box>
              )}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Username"
              name="username"
              autoComplete="username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              disabled={isLoginLoading}
              error={!!formError && !username.trim()}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={isLoginLoading}
              error={!!formError && !password.trim()}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              sx={{ mt: 3, mb: 2 }}
              disabled={isLoginLoading || !username || !password}
            >
              {isLoginLoading ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>
          </Box>

          {/* Debug information (visible in development mode or when enabled) */}
          {(import.meta.env.DEV || showDebugInfo) && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="caption" color="text.secondary">
                Debug info (Ctrl+Shift+D to toggle):
              </Typography>
              <Box
                sx={{
                  mt: 1,
                  p: 1,
                  bgcolor: 'grey.100',
                  borderRadius: 1,
                  fontSize: '0.75rem',
                  fontFamily: 'monospace',
                  wordBreak: 'break-all',
                }}
              >
                <Typography variant="caption" display="block">
                  API URL: {getApiUrl()}
                </Typography>
                <Typography variant="caption" display="block">
                  Auth Status: {loginError ? 'Error' : isLoginLoading ? 'Loading' : 'Idle'}
                </Typography>
                {loginError && (
                  <>
                    <Typography variant="caption" display="block">
                      Error Type: {loginError.name}
                    </Typography>
                    <Typography variant="caption" display="block">
                      Status:{' '}
                      {loginError instanceof ApiError
                        ? loginError.status || 'No status'
                        : 'N/A'}
                    </Typography>
                    <Typography variant="caption" display="block">
                      URL:{' '}
                      {loginError instanceof ApiError
                        ? 'See console' || 'No URL'
                        : 'N/A'}
                    </Typography>
                  </>
                )}
                {import.meta.env.DEV && (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={handleTestLogin}
                    sx={{ mt: 1, fontSize: '0.75rem' }}
                  >
                    Test Login (admin/password)
                  </Button>
                )}
              </Box>
            </>
          )}
        </Paper>
      </Box>
    </Container>
  );
}

export default LoginPage;
