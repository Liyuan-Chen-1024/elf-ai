import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Container,
  Link,
  Divider,
} from '@mui/material';
import { useAuth } from '../../hooks/useAuth';
import { AxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';

interface LoginPageProps {
  onRegisterClick?: () => void;
}

function LoginPage({ onRegisterClick }: LoginPageProps) {
  const { login, isLoginLoading, loginError, isAuthenticated } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const navigate = useNavigate();

  // Redirect when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      if (import.meta.env.DEV) {
        window.console.log('User authenticated, redirecting to /chat');
      }
      navigate('/chat');
    }
  }, [isAuthenticated, navigate]);

  // Clear form error when inputs change
  useEffect(() => {
    if (username || password) {
      setFormError(null);
    }
  }, [username, password]);
  
  // Toggle debug info with keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+D to toggle debug info
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setShowDebugInfo(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    if (!username.trim()) {
      setFormError('Username is required');
      return;
    }
    
    if (!password.trim()) {
      setFormError('Password is required');
      return;
    }
    
    // Show API URL in development mode
    if (import.meta.env.DEV) {
      window.console.log('Login attempt using API URL:', import.meta.env.VITE_API_URL);
      window.console.log('Login credentials:', { username: username.trim() });
    }
    
    login({ username: username.trim(), password: password.trim() });
  };

  // Format error message from the API
  const getErrorMessage = () => {
    if (!loginError) return null;
    
    if (loginError instanceof AxiosError) {
      const status = loginError.response?.status;
      const data = loginError.response?.data;
      
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

  // Test login with default credentials (for development only)
  const handleTestLogin = () => {
    if (import.meta.env.DEV) {
      setUsername('admin');
      setPassword('password');
      login({ username: 'admin', password: 'password' });
    }
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
                  <strong>Hint:</strong> Try using username <code>admin</code> and password <code>password</code>
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
              onChange={(e) => setUsername(e.target.value)}
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
              onChange={(e) => setPassword(e.target.value)}
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

            {onRegisterClick && (
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Typography variant="body2">
                  Don&apos;t have an account?{' '}
                  <Link 
                    component="button" 
                    variant="body2" 
                    onClick={onRegisterClick}
                  >
                    Register
                  </Link>
                </Typography>
              </Box>
            )}
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
                  wordBreak: 'break-all'
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
                      Status: {loginError instanceof AxiosError ? loginError.response?.status || 'No status' : 'N/A'}
                    </Typography>
                    <Typography variant="caption" display="block">
                      URL: {loginError instanceof AxiosError ? loginError.config?.url || 'No URL' : 'N/A'}
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