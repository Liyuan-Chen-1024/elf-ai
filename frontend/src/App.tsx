import React, { useState, useEffect } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Loader from './components/common/Loader';
import NewsView from './features/news/NewsView';
import ProfileView from './features/profile/ProfileView';
import LoginPage from './features/auth/LoginPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useAuth } from './hooks/useAuth';
import './styles/global.css';
import theme from './styles/theme';
import { AxiosError } from 'axios';
import { ChatContainer } from './features/chat';

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: (failureCount: number, error: unknown) => {
        // Don't retry 429 errors - they'll only make things worse
        if (error instanceof AxiosError && error.response?.status === 429) {
          return false;
        }
        // For other errors, retry a limited number of times
        return failureCount < 2;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    },
  },
});

// Auth Guard component to protect routes
function AuthGuard() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [authInitialized, setAuthInitialized] = useState(false);

  // Set auth as initialized after first load
  useEffect(() => {
    if (!isLoading) {
      setAuthInitialized(true);
    }
  }, [isLoading]);

  // Show loading spinner only on initial auth check
  if (isLoading && !authInitialized) {
    return <Loader message="Authenticating..." />;
  }

  // Redirect to login if not authenticated and auth process has completed
  if (!isAuthenticated && authInitialized) {
    return <Navigate to="/login" replace />;
  }

  // Render the child routes
  return <Outlet context={user} />;
}

// Main layout wrapper with tabs
function MainLayout() {
  const { user, logout } = useAuth();
  
  return (
    <Layout user={user} onLogout={logout}>
      <Outlet />
    </Layout>
  );
}

// Main App component with routes
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            
            {/* Protected routes */}
            <Route element={<AuthGuard />}>
              <Route element={<MainLayout />}>
                <Route index element={<Navigate to="/chat" replace />} />
                
                {/* Main tabs */}
                <Route path="/chat" element={<ChatContainer />} />
                <Route path="/chat/:conversationId" element={<ChatContainer />} />
                
                <Route path="/news" element={<NewsView />} />
                <Route path="/profile" element={<ProfileView />} />
              </Route>
            </Route>
            
            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}

export default App;
