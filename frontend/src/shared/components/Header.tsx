import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import {
    AppBar,
    Avatar,
    Box,
    Button,
    Menu,
    MenuItem,
    Tab,
    Tabs,
    Toolbar,
    Typography,
    useMediaQuery,
    useTheme
} from '@mui/material';
import React, { useState, MouseEvent, SyntheticEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ElfLogoIcon } from '../../features/chat/ElfIcon';

interface HeaderProps {
  username: string;
  onLogout: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Header({ username, onLogout, activeTab, onTabChange }: HeaderProps) {
  const theme = useTheme();
  const _isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const _navigate = useNavigate();

  const handleUserMenuOpen = (event: any) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleTabChange = (_event: any, newValue: string) => {
    onTabChange(newValue);
  };

  const handleLogout = () => {
    handleUserMenuClose();
    onLogout();
  };

  const handleProfileClick = () => {
    handleUserMenuClose();
    onTabChange('profile');
  };

  return (
    <AppBar 
      position="static" 
      color="default" 
      sx={{ 
        boxShadow: 1,
        width: '100%'
      }}
    >
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
        {/* Logo and app name */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
            <ElfLogoIcon sx={{ fontSize: 18 }} />
          </Avatar>
          <Typography
            variant="h6"
            sx={{ fontWeight: 600, fontSize: '1.1rem', display: { xs: 'none', sm: 'block' } }}
          >
            Elf AI
          </Typography>
        </Box>

        {/* Navigation tabs */}
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          sx={{ mx: 2 }}
        >
          <Tab value="chat" label="Chat" />
          {/* Future tabs can be added here */}
        </Tabs>

        {/* User account dropdown */}
        <Box>
          <Button
            onClick={handleUserMenuOpen}
            sx={{ 
              textTransform: 'none', 
              borderRadius: '20px',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)'
              }
            }}
            endIcon={
              <Avatar 
                sx={{ 
                  width: 32, 
                  height: 32, 
                  bgcolor: 'primary.dark',
                  color: 'white',
                  fontSize: '0.875rem',
                  ml: 1
                }}
              >
                {username[0]?.toUpperCase()}
              </Avatar>
            }
          >
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {username}
            </Typography>
          </Button>
          
          <Menu
            anchorEl={userMenuAnchor}
            open={Boolean(userMenuAnchor)}
            onClose={handleUserMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem onClick={handleProfileClick}>
              <AccountCircleIcon fontSize="small" sx={{ mr: 1 }} />
              Profile
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              Logout
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
