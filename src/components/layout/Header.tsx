import { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  Menu,
  MenuItem,
  Avatar,
  useTheme,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Divider,
  InputBase,
  Badge,
  Tooltip,
  Fade,
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountCircle,
  Logout,
  Person,
  QuestionAnswer,
  Search as SearchIcon,
  Notifications,
  TrendingUp,
  Home,
  Language,
  AdminPanelSettings,
} from '@mui/icons-material';
import { styled, alpha } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logoutUser } from '../../store/auth/authThunks';
import { setLanguage } from '../../store/language/languageSlice';
import ThemeToggle from '../ui/ThemeToggle';
import { t } from '../../utils/translations';

// Styled search component
const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: 25,
  backgroundColor: theme.palette.mode === 'dark' 
    ? alpha(theme.palette.common.white, 0.15)
    : alpha(theme.palette.common.black, 0.05),
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark'
      ? alpha(theme.palette.common.white, 0.25)
      : alpha(theme.palette.common.black, 0.08),
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
  },
  border: theme.palette.mode === 'dark'
    ? '1px solid rgba(255, 255, 255, 0.2)'
    : '1px solid rgba(0, 0, 0, 0.1)',
  backdropFilter: 'blur(10px)',
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: theme.palette.mode === 'dark' ? theme.palette.common.white : theme.palette.text.secondary,
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '20ch',
    },
    '&::placeholder': {
      color: theme.palette.mode === 'dark' 
        ? alpha(theme.palette.common.white, 0.7)
        : alpha(theme.palette.common.black, 0.5),
      opacity: 1,
    },
  },
}));



const Header = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [languageAnchorEl, setLanguageAnchorEl] = useState<null | HTMLElement>(null);

  const { user, isAuthenticated, hasAdminPermission, roles } = useAppSelector(state => state.auth as any);
  const { currentLanguage } = useAppSelector(state => state.language);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMobileDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      handleMenuClose();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Hata olsa bile login sayfasına yönlendir
      handleMenuClose();
      navigate('/login');
    }
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
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



  const menuId = 'primary-search-account-menu';
  const isMenuOpen = Boolean(anchorEl);

  const renderMenu = (
    <Menu
      anchorEl={anchorEl}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      id={menuId}
      keepMounted
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      open={isMenuOpen}
      onClose={handleMenuClose}
      PaperProps={{
        sx: {
          borderRadius: 1,
          boxShadow: '0 8px 32px rgba(0, 30, 43, 0.15)',
          border: '1px solid rgba(0, 237, 100, 0.1)',
        },
      }}
    >
      <MenuItem
        onClick={() => {
          handleMenuClose();
          navigate('/profile');
        }}
        sx={{ py: 1.5 }}
      >
        <Person sx={{ mr: 1, color: theme.palette.primary.main }} />
        {t('profile', currentLanguage)}
      </MenuItem>
      
      {/* Admin Panel Link - Sadece admin yetkisi olan kullanıcılar için */}
      {hasAdminPermission && (
        <>
          <Divider />
          <MenuItem
            onClick={() => {
              handleMenuClose();
              navigate('/admin/dashboard');
            }}
            sx={{ py: 1.5 }}
          >
            <AdminPanelSettings sx={{ mr: 1, color: theme.palette.warning.main }} />
            {t('admin_dashboard', currentLanguage)}
          </MenuItem>
        </>
      )}
      
      <Divider />
      <MenuItem onClick={handleLogout} sx={{ py: 1.5 }}>
        <Logout sx={{ mr: 1, color: theme.palette.error.main }} />
        {t('logout', currentLanguage)}
      </MenuItem>
    </Menu>
  );

  const mobileDrawer = (
    <Drawer
      variant="temporary"
      anchor="left"
      open={mobileOpen}
      onClose={handleMobileDrawerToggle}
      ModalProps={{
        keepMounted: true,
      }}
      sx={{
        display: { xs: 'block', md: 'none' },
        '& .MuiDrawer-paper': { 
          boxSizing: 'border-box', 
          width: 280,
          background: 'linear-gradient(135deg,rgb(15, 64, 84) 0%,rgb(29, 83, 103) 100%)',
          color: 'white',
        },
      }}
    >
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h5" sx={{ 
          background: 'linear-gradient(135deg, #00ED64 0%, #00C853 100%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: 700,
        }}>
          <QuestionAnswer sx={{ mr: 1, verticalAlign: 'middle' }} />
          QA Platform
        </Typography>
      </Box>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
      <List>
        <ListItem button onClick={() => handleNavigation('/')} sx={{ py: 2 }}>
          <Home sx={{ mr: 2, color: theme.palette.primary.main }} />
          <ListItemText primary="Home" />
        </ListItem>
        <ListItem button onClick={() => handleNavigation('/questions')} sx={{ py: 2 }}>
          <QuestionAnswer sx={{ mr: 2, color: theme.palette.primary.main }} />
          <ListItemText primary="Questions" />
        </ListItem>
        <ListItem button onClick={() => handleNavigation('/trending')} sx={{ py: 2 }}>
          <TrendingUp sx={{ mr: 2, color: theme.palette.primary.main }} />
          <ListItemText primary="Trending" />
        </ListItem>
        {isAuthenticated && (
          <ListItem button onClick={() => handleNavigation('/ask')} sx={{ py: 2 }}>
            <QuestionAnswer sx={{ mr: 2, color: theme.palette.primary.main }} />
            <ListItemText primary="Ask Question" />
          </ListItem>
        )}
      </List>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
      {isAuthenticated ? (
        <List>
          <ListItem button onClick={() => handleNavigation('/profile')} sx={{ py: 2 }}>
            <Person sx={{ mr: 2, color: theme.palette.primary.main }} />
            <ListItemText primary={t('profile', currentLanguage)} />
          </ListItem>
          
          {/* Admin Panel Link - Sadece admin yetkisi olan kullanıcılar için */}
          {hasAdminPermission && (
            <ListItem button onClick={() => handleNavigation('/admin/dashboard')} sx={{ py: 2 }}>
              <AdminPanelSettings sx={{ mr: 2, color: theme.palette.warning.main }} />
              <ListItemText primary={t('admin_dashboard', currentLanguage)} />
            </ListItem>
          )}
          
          <ListItem button onClick={handleLogout} sx={{ py: 2 }}>
            <Logout sx={{ mr: 2, color: theme.palette.error.main }} />
            <ListItemText primary={t('logout', currentLanguage)} />
          </ListItem>
        </List>
      ) : (
        <List>
          <ListItem button onClick={() => handleNavigation('/login')} sx={{ py: 2 }}>
            <Person sx={{ mr: 2, color: theme.palette.primary.main }} />
            <ListItemText primary="Login" />
          </ListItem>
          <ListItem button onClick={() => handleNavigation('/register')} sx={{ py: 2 }}>
            <Person sx={{ mr: 2, color: theme.palette.primary.main }} />
            <ListItemText primary="Register" />
          </ListItem>
        </List>
      )}
    </Drawer>
  );

  return (
    <>
      <AppBar 
        position="static" 
        elevation={0}
        sx={{
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, #0A1A23 0%, #152A35 100%)'
            : 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
          borderBottom: theme.palette.mode === 'dark'
            ? '1px solid rgba(255, 184, 0, 0.2)'
            : '1px solid rgba(0, 0, 0, 0.08)',
          backdropFilter: 'blur(10px)',
          color: theme.palette.mode === 'dark' ? 'white' : '#1A202C',
        }}
      >
        <Toolbar sx={{ minHeight: 70 }}>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleMobileDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          <Typography
            variant="h5"
            noWrap
            component="div"
            sx={{ 
              flexGrow: 1, 
              cursor: 'pointer',
              background: 'linear-gradient(135deg, #FFB800 0%, #FF8F00 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
            }}
            onClick={() => navigate('/')}
          >
            <QuestionAnswer sx={{ mr: 1, fontSize: 28 }} />
            {t('qa_platform', currentLanguage)}
          </Typography>

          {!isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {/* Search Bar */}
              <form onSubmit={handleSearch}>
                <Search>
                  <SearchIconWrapper>
                    <SearchIcon />
                  </SearchIconWrapper>
                  <StyledInputBase
                    placeholder={t('search_placeholder', currentLanguage)}
                    inputProps={{ 'aria-label': 'search' }}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </Search>
              </form>

              {/* Theme Toggle - Ampul */}
              <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
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

              {/* Notifications */}
              <Tooltip title={t('notifications', currentLanguage)}>
                <IconButton color="inherit" sx={{ borderRadius: 2 }}>
                  <Badge badgeContent={3} color="error">
                    <Notifications />
                  </Badge>
                </IconButton>
              </Tooltip>

              {isAuthenticated ? (
                <Tooltip title={t('profile', currentLanguage)}>
                  <IconButton
                    size="large"
                    edge="end"
                    aria-label="account of current user"
                    aria-controls={menuId}
                    aria-haspopup="true"
                    onClick={handleProfileMenuOpen}
                    color="inherit"
                    sx={{ 
                      borderRadius: 2,
                      border: '1px solid rgba(255,255,255,0.2)',
                      '&:hover': {
                        background: 'rgba(255,255,255,0.1)',
                      }
                    }}
                  >
                    {user?.profile_image ? (
                      <Avatar
                        src={user.profile_image}
                        sx={{ width: 32, height: 32 }}
                      >
                        {user?.name?.charAt(0)?.toUpperCase()}
                      </Avatar>
                    ) : (
                      <Avatar sx={{ width: 32, height: 32 }}>
                        {user?.name?.charAt(0)?.toUpperCase() || '?'}
                      </Avatar>
                    )}
                  </IconButton>
                </Tooltip>
              ) : (
                <>
                  <Button 
                    color="inherit" 
                    onClick={() => navigate('/login')}
                    sx={{ 
                      borderRadius: 2,
                      px: 2,
                      '&:hover': {
                        background: 'rgba(255,255,255,0.1)',
                      }
                    }}
                  >
                    {t('login', currentLanguage)}
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => navigate('/register')}
                    sx={{ 
                      borderRadius: 2,
                      px: 3,
                      background: 'linear-gradient(135deg, #00ED64 0%, #00C853 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #00FF6B 0%, #00ED64 100%)',
                      }
                    }}
                  >
                    {t('register', currentLanguage)}
                  </Button>
                </>
              )}
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {mobileDrawer}
      {renderMenu}

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
    </>
  );
};

export default Header;
