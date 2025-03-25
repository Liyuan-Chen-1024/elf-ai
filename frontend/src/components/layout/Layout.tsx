import React, { useState } from 'react';
import { Box, AppBar, Toolbar, IconButton, Typography, Avatar } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
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

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed">
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open sidebar"
            edge="start"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            ElfAI
          </Typography>
          {user && (
            <Avatar 
              alt={user.username} 
              {...(user.avatar ? { src: user.avatar } : {})}
              sx={{ width: 36, height: 36 }}
            />
          )}
        </Toolbar>
      </AppBar>
      
      <Sidebar 
        open={sidebarOpen} 
        activeTab={activeTab} 
        onTabChange={handleTabChange}
      />
      
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: 3, 
          pt: 10, 
          width: { sm: `calc(100% - ${sidebarOpen ? 280 : 0}px)` }, 
          ml: { sm: sidebarOpen ? '280px' : 0 },
          transition: theme => theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

export default Layout; 