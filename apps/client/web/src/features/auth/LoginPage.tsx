import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  TextField,
  Typography,
  Container,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useAuthStore } from './store';
import { useNavigate } from 'react-router-dom';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(username, password);
    if (!error) {
      navigate('/chat');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #F5F7F5 0%, #E8F5E9 100%)',
      }}
    >
      <Container maxWidth="sm">
        <Card
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
          }}
        >
          <Typography
            variant="h1"
            sx={{
              fontSize: '2.5rem',
              color: 'primary.main',
              fontWeight: 'bold',
              textAlign: 'center',
              mb: 2,
            }}
          >
            Elf AI
          </Typography>

          <Typography variant="h2" sx={{ fontSize: '1.5rem', mb: 3, color: 'text.secondary' }}>
            Welcome back to the enchanted realm
          </Typography>

          {error && (
            <Alert severity="error" sx={{ width: '100%' }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <TextField
              fullWidth
              label="Username"
              variant="outlined"
              value={username}
              onChange={e => setUsername(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              variant="outlined"
              value={password}
              onChange={e => setPassword(e.target.value)}
              sx={{ mb: 3 }}
            />
            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              disabled={isLoading}
              sx={{
                height: 48,
                fontSize: '1.1rem',
              }}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Enter the Realm'}
            </Button>
          </Box>
        </Card>
      </Container>
    </Box>
  );
};
