import React from 'react';
import { Box } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import { User } from '../../types';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  onLogout?: () => void;
}

function Layout({ children, user, onLogout }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine active tab from URL
  const getActiveTab = () => {
    if (location.pathname.startsWith('/chat')) return 'chat';
    if (location.pathname.startsWith('/news')) return 'news';
    if (location.pathname.startsWith('/profile')) return 'profile';
    return 'chat'; // Default
  };

  const activeTab = getActiveTab();

  // Handle tab change
  const handleTabChange = (tab: 'chat' | 'news' | 'profile') => {
    navigate(`/${tab}`);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #eef1f5 100%)',
      }}
    >
      <Navbar user={user} activeTab={activeTab} onTabChange={handleTabChange} onLogout={onLogout} />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          height: 'calc(100vh - 64px)',
          overflow: 'auto',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

export default Layout;
