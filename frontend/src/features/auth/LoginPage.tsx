import LockIcon from '@mui/icons-material/Lock';
import PersonIcon from '@mui/icons-material/Person';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Fade,
    InputAdornment,
    Paper,
    TextField,
    Typography,
    useTheme,
    Zoom
} from '@mui/material';
import { styled } from '@mui/material/styles';
import React, { useState } from 'react';
import { useAuth } from './AuthContext';

// Define keyframe animations using styled API
const FloatingAnimation = styled('div')`
  @keyframes float {
    0% { transform: translateY(0px); }
    50% { transform: translateY(-8px); }
    100% { transform: translateY(0px); }
  }
  animation: float 8s ease-in-out infinite;
`;

const PulsingAnimation = styled('div')`
  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.03); }
    100% { transform: scale(1); }
  }
  animation: pulse 4s ease-in-out infinite;
`;

export const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error } = useAuth();
  const theme = useTheme();
  const [showElements, setShowElements] = useState(false);

  React.useEffect(() => {
    // Trigger animations after component mount
    setShowElements(true);
  }, []);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    await login(username, password);
  };

  const handleUsernameChange = (e: any) => {
    setUsername(e.target.value);
  };

  const handlePasswordChange = (e: any) => {
    setPassword(e.target.value);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.secondary.light} 100%)`,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"%3E%3Cpath d="M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5z" fill="%23ffffff" fill-opacity="0.05"/%3E%3C/svg%3E")',
          opacity: 0.8,
        },
      }}
    >
      {/* Floating shapes - reduced number and slowed down animations */}
      <Zoom in={showElements} style={{ transitionDelay: '200ms' }}>
        <FloatingAnimation 
          style={{
            position: 'absolute',
            top: '20%',
            left: '15%',
            width: 70,
            height: 70,
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
            opacity: 0.6,
          }}
        />
      </Zoom>
      
      <Zoom in={showElements} style={{ transitionDelay: '400ms' }}>
        <FloatingAnimation
          style={{
            position: 'absolute',
            bottom: '25%',
            right: '15%',
            width: 100,
            height: 100,
            borderRadius: '30%',
            background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.light} 100%)`,
            opacity: 0.4,
            animationDelay: '2s',
          }}
        />
      </Zoom>
      
      {/* Login Card - simplified animation */}
      <Fade in={showElements} timeout={1000}>
        <Box
          sx={{
            width: '90%',
            maxWidth: 420,
            borderRadius: '16px',
            overflow: 'hidden',
            position: 'relative',
            backdropFilter: 'blur(10px)',
            background: 'rgba(255, 255, 255, 0.9)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          }}
        >
          <Paper
            elevation={8}
            sx={{
              borderRadius: 4,
              overflow: 'hidden',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 6,
                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              },
            }}
          >
            <Box sx={{ p: 4 }}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  mb: 4,
                }}
              >
                <Zoom in={showElements} style={{ transitionDelay: '800ms' }}>
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                      mb: 2,
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                    }}
                  >
                    <Typography
                      variant="h4"
                      component="span"
                      sx={{
                        color: 'white',
                        fontWeight: 'bold',
                      }}
                    >
                      E
                    </Typography>
                  </Box>
                </Zoom>

                <Fade in={showElements} style={{ transitionDelay: '1000ms' }}>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 700,
                      background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      mb: 1,
                    }}
                  >
                    ElfAI
                  </Typography>
                </Fade>

                <Fade in={showElements} style={{ transitionDelay: '1200ms' }}>
                  <Typography variant="body1" color="text.secondary" align="center">
                    Enter the magical realm of AI assistance
                  </Typography>
                </Fade>
              </Box>

              {error && (
                <Fade in={!!error}>
                  <Alert 
                    severity="error" 
                    sx={{ 
                      mb: 3, 
                      borderRadius: 2,
                    }}
                  >
                    {error}
                  </Alert>
                </Fade>
              )}

              <Box component="form" onSubmit={handleSubmit}>
                <Fade in={showElements} style={{ transitionDelay: '1400ms' }}>
                  <TextField
                    fullWidth
                    label="Username"
                    variant="outlined"
                    value={username}
                    onChange={handleUsernameChange}
                    margin="normal"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon color="primary" />
                        </InputAdornment>
                      ),
                      sx: { borderRadius: 2 }
                    }}
                  />
                </Fade>

                <Fade in={showElements} style={{ transitionDelay: '1600ms' }}>
                  <TextField
                    fullWidth
                    label="Password"
                    type="password"
                    variant="outlined"
                    value={password}
                    onChange={handlePasswordChange}
                    margin="normal"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon color="primary" />
                        </InputAdornment>
                      ),
                      sx: { borderRadius: 2 }
                    }}
                    sx={{ mt: 2, mb: 3 }}
                  />
                </Fade>

                <Fade in={showElements} style={{ transitionDelay: '1800ms' }}>
                  <Button
                    fullWidth
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={isLoading || !username || !password}
                    sx={{
                      height: 56,
                      fontSize: '1.1rem',
                      borderRadius: 2,
                      textTransform: 'none',
                      background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                      transition: 'all 0.3s',
                      '&:hover': {
                        boxShadow: '0 6px 25px rgba(0, 0, 0, 0.2)',
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    {isLoading ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      'Enter the Realm'
                    )}
                  </Button>
                </Fade>
              </Box>

              <Fade in={showElements} style={{ transitionDelay: '2000ms' }}>
                <Typography
                  variant="body2"
                  align="center"
                  sx={{
                    mt: 3,
                    color: 'text.secondary',
                    fontSize: '0.875rem',
                  }}
                >
                  Don't have an account? Please contact your administrator.
                </Typography>
              </Fade>
            </Box>
          </Paper>
        </Box>
      </Fade>
    </Box>
  );
};
