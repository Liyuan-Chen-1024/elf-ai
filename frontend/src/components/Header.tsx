import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  Container,
  Avatar,
  Tooltip,
  MenuItem,
  Tabs,
  Tab,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import NewspaperIcon from '@mui/icons-material/Newspaper';
import DashboardIcon from '@mui/icons-material/Dashboard';
import { AnimatedLogo } from './AnimatedLogo';

interface HeaderProps {
  onLogout: () => void;
  username?: string;
}

export const Header = ({ onLogout, username = 'User' }: HeaderProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const location = useLocation();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Get current tab value based on location
  const getCurrentTab = () => {
    const path = location.pathname;
    console.log('Current path:', path);
    if (path.startsWith('/chat')) return '/chat';
    if (path.startsWith('/news')) return '/news';
    if (path.startsWith('/dashboard')) return '/dashboard';
    return false;
  };

  const handleTabChange = (_: any, newValue: string) => {
    console.log('Navigating to:', newValue);
    navigate(newValue);
  };

  const handleOpenUserMenu = (event: { currentTarget: HTMLElement }) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleCloseUserMenu();
    onLogout();
  };

  return (
    <AppBar 
      position="static" 
      sx={{
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        boxShadow: 1,
      }}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AnimatedLogo size="small" />
              </Box>
            </Link>
          </Box>

          <Box sx={{ flexGrow: 1 }}>
            <Tabs
              value={getCurrentTab()}
              onChange={handleTabChange}
              textColor="primary"
              indicatorColor="primary"
              variant={isMobile ? "fullWidth" : "standard"}
              sx={{
                '& .MuiTab-root': {
                  color: theme.palette.text.secondary,
                  '&.Mui-selected': {
                    color: theme.palette.primary.main,
                  },
                  minHeight: 48,
                  py: 1,
                },
              }}
            >
              <Tab 
                icon={<ChatIcon />} 
                label={!isMobile && "Chat"} 
                value="/chat"
                iconPosition="start"
                sx={{ minWidth: isMobile ? 'auto' : 120 }}
              />
              <Tab 
                icon={<NewspaperIcon />} 
                label={!isMobile && "News"} 
                value="/news"
                iconPosition="start"
                sx={{ minWidth: isMobile ? 'auto' : 120 }}
              />
              <Tab 
                icon={<DashboardIcon />} 
                label={!isMobile && "Dashboard"} 
                value="/dashboard"
                iconPosition="start"
                sx={{ minWidth: isMobile ? 'auto' : 120 }}
              />
            </Tabs>
          </Box>

          <Box sx={{ flexGrow: 0 }}>
            <Tooltip title="Open settings">
              <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography 
                    sx={{ 
                      display: { xs: 'none', sm: 'block' },
                      color: theme.palette.text.primary,
                    }}
                  >
                    {username}
                  </Typography>
                  <Avatar 
                    alt={username}
                    sx={{ 
                      bgcolor: theme.palette.primary.main,
                      color: theme.palette.primary.contrastText,
                    }}
                  >
                    {username.charAt(0).toUpperCase()}
                  </Avatar>
                </Box>
              </IconButton>
            </Tooltip>
            <Menu
              sx={{ mt: '45px' }}
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleCloseUserMenu}
            >
              <MenuItem onClick={() => navigate('/profile')}>
                <Typography>Profile</Typography>
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <Typography>Logout</Typography>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}; 