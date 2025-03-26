import React, { useState } from 'react';
import { Box } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { User } from '../../types';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
}

function Layout({ children, user }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
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

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const DRAWER_WIDTH = 280;
  const showSidebar = activeTab === 'chat' && sidebarOpen;

  return (
    <Box sx={{ 
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'hidden',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #eef1f5 100%)',
    }}>
      <Navbar 
        toggleSidebar={toggleSidebar}
        user={user}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
      
      <Box sx={{ 
        display: 'flex', 
        flexGrow: 1,
        height: 'calc(100vh - 64px)',
        overflow: 'hidden',
      }}>
        {activeTab === 'chat' && (
          <Sidebar 
            open={sidebarOpen} 
            activeTab={activeTab} 
            onTabChange={handleTabChange}
          />
        )}
        
        <Box 
          component="main" 
          sx={{ 
            flexGrow: 1,
            width: showSidebar ? `calc(100% - ${DRAWER_WIDTH}px)` : '100%',
            height: '100%',
            overflow: 'auto',
            transition: theme => theme.transitions.create(['width', 'margin'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}

export default Layout; 