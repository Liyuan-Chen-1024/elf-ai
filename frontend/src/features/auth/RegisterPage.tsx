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
} from '@mui/material';
import { useAuth } from '../../hooks/useAuth';

interface RegisterPageProps {
  onLoginClick?: () => void;
}

function RegisterPage({ onLoginClick }: RegisterPageProps) {
  const { register, isRegisterLoading, registerError } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Clear form error when inputs change
  useEffect(() => {
    if (username || email || password || confirmPassword) {
      setFormError(null);
    }
  }, [username, email, password, confirmPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    // Form validation
    if (!username.trim()) {
      setFormError('Username is required');
      return;
    }
    
    if (!email.trim()) {
      setFormError('Email is required');
      return;
    }
    
    if (!password.trim()) {
      setFormError('Password is required');
      return;
    }
    
    if (password !== confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }
    
    register({
      username: username.trim(),
      email: email.trim(),
      password: password.trim(),
    });
  };

  // Display either form validation errors or auth errors
  const displayError = formError || (registerError ? registerError.message : null);

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h4" gutterBottom>
          ElfAI
        </Typography>
        
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography component="h2" variant="h5" gutterBottom>
            Create an Account
          </Typography>
          
          {displayError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {displayError}
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
              disabled={isRegisterLoading}
              error={!!formError && !username.trim()}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isRegisterLoading}
              error={!!formError && !email.trim()}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isRegisterLoading}
              error={!!formError && !password.trim()}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type="password"
              id="confirmPassword"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isRegisterLoading}
              error={!!formError && (password !== confirmPassword)}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              sx={{ mt: 3, mb: 2 }}
              disabled={isRegisterLoading || !username || !email || !password || !confirmPassword}
            >
              {isRegisterLoading ? <CircularProgress size={24} /> : 'Register'}
            </Button>

            {onLoginClick && (
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Typography variant="body2">
                  Already have an account?{' '}
                  <Link 
                    component="button" 
                    variant="body2" 
                    onClick={onLoginClick}
                  >
                    Sign in
                  </Link>
                </Typography>
              </Box>
            )}
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}

export default RegisterPage; 