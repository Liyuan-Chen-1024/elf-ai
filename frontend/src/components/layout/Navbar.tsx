import React, { useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  IconButton, 
  Typography, 
  Box, 
  Button, 
  Tooltip, 
  Avatar,
  Divider,
  Menu,
  MenuItem,
  ListItemIcon
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import { User } from '../../types';

interface NavbarProps {
  title?: string;
  toggleSidebar: () => void;
  user: User | null;
  onLogout?: () => void;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
}

function Navbar({ 
  title = 'ElfAI',
  toggleSidebar,
  user,
  onLogout,
  isDarkMode = false,
  onToggleTheme
}: NavbarProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);

  const handleProfileClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleClose();
    onLogout?.();
  };

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={toggleSidebar}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
        
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          {title}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {onToggleTheme && (
            <Tooltip title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}>
              <IconButton color="inherit" onClick={onToggleTheme} sx={{ ml: 1 }}>
                {isDarkMode ? <Brightness7Icon /> : <Brightness4Icon />}
              </IconButton>
            </Tooltip>
          )}
          
          {user ? (
            <>
              <Tooltip title="Account settings">
                <IconButton 
                  onClick={handleProfileClick}
                  aria-controls={menuOpen ? 'account-menu' : undefined}
                  aria-haspopup="true"
                  aria-expanded={menuOpen ? 'true' : undefined}
                  sx={{ ml: 1 }}
                >
                  <Avatar 
                    {...(user.avatar ? { src: user.avatar } : {})}
                    alt={user.name || 'User avatar'}
                    sx={{ width: 32, height: 32 }}
                  />
                </IconButton>
              </Tooltip>
              <Menu
                id="account-menu"
                anchorEl={anchorEl}
                open={menuOpen}
                onClose={handleClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <MenuItem onClick={handleClose}>
                  <ListItemIcon>
                    <AccountCircleIcon fontSize="small" />
                  </ListItemIcon>
                  Profile
                </MenuItem>
                <MenuItem onClick={handleClose}>
                  <ListItemIcon>
                    <SettingsIcon fontSize="small" />
                  </ListItemIcon>
                  Settings
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" />
                  </ListItemIcon>
                  Logout
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Button color="inherit">Login</Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar; 