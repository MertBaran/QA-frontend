import React, { useState } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
  Button,
  Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  People,
  QuestionAnswer,
  Security,
  Settings,
  Notifications,
  AccountCircle,
  Logout,
  Language,
  Home,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logout } from '../../store/auth/authSlice';
import { setLanguage } from '../../store/language/languageSlice';
import ThemeToggle from '../ui/ThemeToggle';
import { t } from '../../utils/translations';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const drawerWidth = 240;

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [languageAnchorEl, setLanguageAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { currentLanguage } = useAppSelector((state) => state.language);

  const menuItems = [
    {
      text: t('admin_dashboard', currentLanguage),
      icon: <Dashboard />,
      path: '/admin/dashboard',
    },
    {
      text: t('user_management', currentLanguage),
      icon: <People />,
      path: '/admin/users',
    },
    {
      text: t('question_management', currentLanguage),
      icon: <QuestionAnswer />,
      path: '/admin/questions',
    },
    {
      text: t('permission_management', currentLanguage),
      icon: <Security />,
      path: '/admin/permissions',
    },
    {
      text: t('admin_settings', currentLanguage),
      icon: <Settings />,
      path: '/admin/settings',
    },
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleLanguageMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setLanguageAnchorEl(event.currentTarget);
  };

  const handleLanguageMenuClose = () => {
    setLanguageAnchorEl(null);
  };

  const handleLanguageChange = (language: string) => {
    dispatch(setLanguage(language));
    handleLanguageMenuClose();
  };

  const handleGoToUserInterface = () => {
    navigate('/');
  };

  const drawer = (
    <Box>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          {t('admin_dashboard', currentLanguage)}
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            onClick={() => handleNavigation(item.path)}
            selected={location.pathname === item.path}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {menuItems.find(item => item.path === location.pathname)?.text || t('admin_dashboard', currentLanguage)}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Theme Toggle */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <ThemeToggle />
            </Box>

            {/* Language Selector */}
            <Tooltip title={t('language_selection', currentLanguage)}>
              <IconButton
                color="inherit"
                onClick={handleLanguageMenuOpen}
                sx={{ 
                  borderRadius: 2,
                  border: '1px solid rgba(255,255,255,0.2)',
                  '&:hover': {
                    background: 'rgba(255,255,255,0.1)',
                  }
                }}
              >
                <Language />
              </IconButton>
            </Tooltip>

            {/* Go to User Interface */}
            <Tooltip title={t('go_to_user_interface', currentLanguage)}>
              <IconButton
                color="inherit"
                onClick={handleGoToUserInterface}
                sx={{ 
                  borderRadius: 2,
                  border: '1px solid rgba(255,255,255,0.2)',
                  '&:hover': {
                    background: 'rgba(255,255,255,0.1)',
                  }
                }}
              >
                <Home />
              </IconButton>
            </Tooltip>

            <IconButton color="inherit">
              <Notifications />
            </IconButton>
            <IconButton
              color="inherit"
              onClick={handleProfileMenuOpen}
            >
              <Avatar sx={{ width: 32, height: 32 }}>
                {user?.name?.charAt(0) || 'A'}
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        {children}
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
      >
        <MenuItem onClick={handleProfileMenuClose}>
          <ListItemIcon>
            <AccountCircle fontSize="small" />
          </ListItemIcon>
          {user?.name || 'Admin'}
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          {t('logout', currentLanguage)}
        </MenuItem>
      </Menu>

      {/* Language Selection Menu */}
      <Menu
        anchorEl={languageAnchorEl}
        open={Boolean(languageAnchorEl)}
        onClose={handleLanguageMenuClose}
        PaperProps={{
          sx: {
            borderRadius: 1,
            boxShadow: '0 8px 32px rgba(0, 30, 43, 0.15)',
            border: '1px solid rgba(0, 237, 100, 0.1)',
            background: 'linear-gradient(135deg, rgba(30, 58, 71, 0.95) 0%, rgba(21, 42, 53, 0.98) 100%)',
            color: 'white',
          }
        }}
      >
        <MenuItem 
          onClick={() => handleLanguageChange('tr')}
          selected={currentLanguage === 'tr'}
          sx={{
            '&:hover': {
              background: 'rgba(255, 184, 0, 0.1)',
            },
            '&.Mui-selected': {
              background: 'rgba(255, 184, 0, 0.2)',
              '&:hover': {
                background: 'rgba(255, 184, 0, 0.3)',
              }
            }
          }}
        >
          🇹🇷 Türkçe
        </MenuItem>
        <MenuItem 
          onClick={() => handleLanguageChange('en')}
          selected={currentLanguage === 'en'}
          sx={{
            '&:hover': {
              background: 'rgba(255, 184, 0, 0.1)',
            },
            '&.Mui-selected': {
              background: 'rgba(255, 184, 0, 0.2)',
              '&:hover': {
                background: 'rgba(255, 184, 0, 0.3)',
              }
            }
          }}
        >
          🇺🇸 English
        </MenuItem>
        <MenuItem 
          onClick={() => handleLanguageChange('de')}
          selected={currentLanguage === 'de'}
          sx={{
            '&:hover': {
              background: 'rgba(255, 184, 0, 0.1)',
            },
            '&.Mui-selected': {
              background: 'rgba(255, 184, 0, 0.2)',
              '&:hover': {
                background: 'rgba(255, 184, 0, 0.3)',
              }
            }
          }}
        >
          🇩🇪 Deutsch
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default AdminLayout; 