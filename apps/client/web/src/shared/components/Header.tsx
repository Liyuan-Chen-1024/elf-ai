import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import PersonIcon from '@mui/icons-material/Person';
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
  useTheme,
} from '@mui/material';
import React, { useState } from 'react';
import { ElfLogoIcon } from '../../features/chat/ElfIcon';

interface HeaderProps {
  username: string;
  onLogout: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ username, onLogout, activeTab, onTabChange }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    onTabChange(newValue);
  };

  const handleLogout = () => {
    handleUserMenuClose();
    onLogout();
  };

  return (
    <AppBar position="static" color="default" elevation={1}>
      <Toolbar sx={{ justifyContent: 'space-between' }}>
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
          sx={{ mx: 'auto' }}
        >
          <Tab value="chat" label="Chat" />
          <Tab value="profile" label="Profile" />
        </Tabs>

        {/* User info and logout */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {!isMobile && (
            <Typography variant="body2" color="text.secondary">
              {username}
            </Typography>
          )}

          <Button
            onClick={handleUserMenuOpen}
            color="inherit"
            size="small"
            endIcon={<ArrowDropDownIcon />}
            startIcon={
              <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.light' }}>
                <PersonIcon sx={{ fontSize: 16 }} />
              </Avatar>
            }
          >
            {isMobile ? '' : 'Account'}
          </Button>

          <Menu
            anchorEl={userMenuAnchor}
            open={Boolean(userMenuAnchor)}
            onClose={handleUserMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <MenuItem
              onClick={() => {
                handleUserMenuClose();
                onTabChange('profile');
              }}
            >
              My Profile
            </MenuItem>
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};
