import { Box, CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ElfSpinner } from './components/ElfSpinner';
import { Header } from './components/Header';
import { AuthProvider, useAuth } from './features/auth/AuthContext';
import { LoginPage } from './features/auth/LoginPage';
import { Chat } from './features/chat/components/Chat';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { ProfileContainer } from './features/profile/ProfileContainer';
import lightTheme from './theme';
import { API_BASE_URL } from './shared/api/api-client';

const AppRoutes = () => {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  
  // Debug what user info we have
  console.log('User in AppRoutes:', user);
  console.log('Is authenticated:', isAuthenticated);
  console.log('Auth token:', localStorage.getItem('token'));
  console.log('Env token:', import.meta.env.VITE_AUTH_TOKEN);
  
  // Format the user's display name
  const getDisplayName = () => {
    if (!user) return 'User';
    return user.name;
  };
  
  if (isLoading) {
    return <ElfSpinner message="Preparing your experience..." />;
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header onLogout={logout} username={getDisplayName()} />
      <Box component="main" sx={{ flexGrow: 1 }}>
        <Routes>
          <Route path="/chat" element={<Chat />} />
          <Route path="/chat/:conversationId" element={<Chat />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile" element={<ProfileContainer />} />
          <Route path="/" element={<Navigate to="/chat" replace />} />
          <Route path="*" element={<Navigate to="/chat" replace />} />
        </Routes>
      </Box>
    </Box>
  );
};

function App() {
  // Debug token on mount
  useEffect(() => {
    console.log('App mounted. Token in localStorage:', localStorage.getItem('token'));
    console.log('Env token:', import.meta.env.VITE_AUTH_TOKEN);
    
    const envToken = import.meta.env.VITE_AUTH_TOKEN;
    if (envToken && !localStorage.getItem('token')) {
      console.log('Setting token from env to localStorage:', envToken);
      localStorage.setItem('token', envToken);
    }
  }, []);
  
  // Fetch CSRF token on app initialization
  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/csrf/`, {
          method: 'GET',
          credentials: 'include',
        });
        if (response.ok) {
          console.log('CSRF token cookie has been set');
        } else {
          console.error('Failed to fetch CSRF token:', response.status);
        }
      } catch (error) {
        console.error('Error fetching CSRF token:', error);
      }
    };
    
    fetchCsrfToken();
  }, []);
  
  return (
    <ThemeProvider theme={lightTheme}>
      <CssBaseline />
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
