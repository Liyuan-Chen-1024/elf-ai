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
  ListItemIcon,
  Tabs,
  Tab,
} from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import ChatIcon from '@mui/icons-material/Chat';
import PersonIcon from '@mui/icons-material/Person';
import { User } from '../../types';

interface NavbarProps {
  title?: string;
  user: User | null;
  onLogout?: () => void;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
  activeTab: 'chat' | 'profile';
  onTabChange: (tab: 'chat' | 'profile') => void;
}

function Navbar({
  title = 'ElfAI',
  user,
  onLogout,
  isDarkMode = false,
  onToggleTheme,
  activeTab,
  onTabChange,
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
    <AppBar
      position="static"
      sx={{
        zIndex: theme => theme.zIndex.drawer + 1,
        background: 'linear-gradient(90deg, #5048E5 0%, #8E84FF 100%)',
        boxShadow: '0 2px 10px rgba(80, 72, 229, 0.2)',
        height: '64px',
      }}
    >
      <Toolbar
        variant="dense"
        sx={{
          minHeight: '64px',
          px: { xs: 1, sm: 2 },
          gap: 1,
        }}
      >
        <Typography
          variant="h6"
          component="div"
          sx={{
            fontWeight: 700,
            fontFamily: '"Poppins", sans-serif',
            letterSpacing: -0.5,
            background: 'linear-gradient(90deg, #FFFFFF 0%, #E0E0FF 100%)',
            backgroundClip: 'text',
            textFillColor: 'transparent',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontSize: { xs: '1.1rem', sm: '1.25rem' },
            mr: { xs: 1, sm: 2 },
          }}
        >
          ✨ {title}
        </Typography>

        <Tabs
          value={activeTab}
          onChange={(_, value) => onTabChange(value)}
          textColor="inherit"
          indicatorColor="secondary"
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            flexGrow: 1,
            minHeight: '64px',
            '& .MuiTab-root': {
              minWidth: { xs: 'auto', sm: 100 },
              minHeight: '64px',
              px: { xs: 1, sm: 2 },
              py: 0,
              fontWeight: 600,
              fontSize: '0.85rem',
              textTransform: 'none',
            },
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0',
            },
          }}
        >
          <Tab
            icon={<ChatIcon sx={{ fontSize: { xs: '1.2rem', sm: '1.4rem' } }} />}
            label="Chat"
            value="chat"
            iconPosition="start"
          />
          <Tab
            icon={<PersonIcon sx={{ fontSize: { xs: '1.2rem', sm: '1.4rem' } }} />}
            label="Profile"
            value="profile"
            iconPosition="start"
          />
        </Tabs>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {onToggleTheme && (
            <Tooltip title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}>
              <IconButton color="inherit" onClick={onToggleTheme} sx={{ ml: 0.5 }}>
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
                  sx={{ ml: 0.5 }}
                >
                  <Avatar
                    {...(user.avatar ? { src: user.avatar } : {})}
                    alt={user.name || 'User avatar'}
                    sx={{
                      width: 32,
                      height: 32,
                      border: '2px solid white',
                    }}
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
            <Button
              color="inherit"
              variant="outlined"
              sx={{
                borderColor: 'rgba(255, 255, 255, 0.5)',
                color: 'white',
                '&:hover': {
                  borderColor: 'white',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              Login
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;
