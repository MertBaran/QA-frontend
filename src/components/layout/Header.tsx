import React, { useState } from 'react';
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
  Container,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Logout,
  Person,
  QuestionAnswer,
  Search as SearchIcon,
  Notifications,
  TrendingUp,
  Home,
  AdminPanelSettings,
  HelpOutline,
  FindInPage,
} from '@mui/icons-material';
import preferLanguageIconBlack from '../../asset/icons/home/prefer_language_black.png';
import preferLanguageIconWhite from '../../asset/icons/home/prefer_language_white.png';
import papyrusVertical1 from '../../asset/textures/papyrus_vertical_1.png';
import { styled, alpha } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logoutUser } from '../../store/auth/authThunks';
import { setLanguage } from '../../store/language/languageSlice';
import { User } from '../../types/user';
import ThemeToggle from '../ui/ThemeToggle';
import ThemeSelector from '../ui/ThemeSelector';
import { t } from '../../utils/translations';

// Styled search component
const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: 12,
  backgroundColor: theme.palette.mode === 'dark' 
    ? alpha(theme.palette.common.white, 0.15)
    : alpha(theme.palette.common.black, 0.05),
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark'
      ? alpha(theme.palette.common.white, 0.25)
      : alpha(theme.palette.common.black, 0.08),
  },
  marginRight: 0,
  marginLeft: 0,
  width: '100%',
  flex: 1,
  border: `1px solid ${theme.palette.divider}`,
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

  const { user, isAuthenticated, hasAdminPermission } = useAppSelector(
    (state) => ({
      user: state.auth.user as User | null,
      isAuthenticated: state.auth.isAuthenticated,
      hasAdminPermission: state.auth.hasAdminPermission,
    }),
  );
  const { currentLanguage } = useAppSelector(state => state.language);
  const { name: themeName, mode } = useAppSelector(state => state.theme);
  const isPapirus = themeName === 'papirus';

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
        vertical: 'bottom',
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
      disableScrollLock
      BackdropProps={{
        sx: {
          backgroundColor: 'transparent',
          zIndex: (theme) => theme.zIndex.drawer - 1,
        },
      }}
      PaperProps={{
        sx: (theme) => ({
          borderRadius: 1,
          boxShadow: theme.palette.mode === 'dark' 
            ? `0 8px 32px ${theme.palette.primary.main}22`
            : `0 8px 32px ${theme.palette.grey[400]}33`,
          border: `1px solid ${theme.palette.primary.main}22`,
          backgroundColor: theme.palette.background.paper,
          minWidth: 200,
          maxWidth: 250,
          position: 'relative',
          overflow: 'hidden',
          mt: 1,
          zIndex: (theme) => theme.zIndex.drawer,
          ...(isPapirus ? {
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `url(${papyrusVertical1})`,
              backgroundSize: '125%',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              opacity: mode === 'dark' ? 0.12 : 0.15,
              pointerEvents: 'none',
              zIndex: 0,
            },
            '& > *': {
              position: 'relative',
              zIndex: 1,
            },
          } : {}),
        }),
      }}
    >
      <MenuItem
        onClick={() => {
          handleMenuClose();
          navigate('/profile');
        }}
        sx={{ py: 1.5 }}
      >
        <Person sx={(theme) => ({ mr: 1, color: theme.palette.primary.main })} />
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
            <AdminPanelSettings sx={(theme) => ({ mr: 1, color: theme.palette.warning.main })} />
            {t('admin_dashboard', currentLanguage)}
          </MenuItem>
        </>
      )}
      
      <Divider />
      <MenuItem
        onClick={() => {
          void handleLogout();
        }}
        sx={{ py: 1.5 }}
      >
        <Logout sx={(theme) => ({ mr: 1, color: theme.palette.error.main })} />
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
          color: (theme) => theme.palette.text.primary,
        },
      }}
    >
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h5" sx={(theme) => ({ 
          background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: 700,
        })}>
          <QuestionAnswer sx={{ mr: 1, verticalAlign: 'middle' }} />
          QA Platform
        </Typography>
      </Box>
      <Divider sx={(theme) => ({ borderColor: theme.palette.divider })} />
      <List>
        <ListItem button onClick={() => handleNavigation('/')} sx={{ py: 2 }}>
          <Home sx={(theme) => ({ mr: 2, color: theme.palette.primary.main })} />
          <ListItemText primary="Home" />
        </ListItem>
        <ListItem button onClick={() => handleNavigation('/questions')} sx={{ py: 2 }}>
          <QuestionAnswer sx={(theme) => ({ mr: 2, color: theme.palette.primary.main })} />
          <ListItemText primary="Questions" />
        </ListItem>
        <ListItem button onClick={() => handleNavigation('/trending')} sx={{ py: 2 }}>
          <TrendingUp sx={(theme) => ({ mr: 2, color: theme.palette.primary.main })} />
          <ListItemText primary="Trending" />
        </ListItem>
        {isAuthenticated && (
          <ListItem button onClick={() => handleNavigation('/ask')} sx={{ py: 2 }}>
            <QuestionAnswer sx={(theme) => ({ mr: 2, color: theme.palette.primary.main })} />
            <ListItemText primary="Ask Question" />
          </ListItem>
        )}
      </List>
      <Divider sx={(theme) => ({ borderColor: theme.palette.divider })} />
      {isAuthenticated ? (
        <List>
          <ListItem button onClick={() => handleNavigation('/profile')} sx={{ py: 2 }}>
            <Person sx={(theme) => ({ mr: 2, color: theme.palette.primary.main })} />
            <ListItemText primary={t('profile', currentLanguage)} />
          </ListItem>
          
          {/* Admin Panel Link - Sadece admin yetkisi olan kullanıcılar için */}
          {hasAdminPermission && (
            <ListItem button onClick={() => handleNavigation('/admin/dashboard')} sx={{ py: 2 }}>
              <AdminPanelSettings sx={(theme) => ({ mr: 2, color: theme.palette.warning.main })} />
              <ListItemText primary={t('admin_dashboard', currentLanguage)} />
            </ListItem>
          )}
          
          <ListItem
            button
            onClick={() => {
              void handleLogout();
            }}
            sx={{ py: 2 }}
          >
            <Logout sx={(theme) => ({ mr: 2, color: theme.palette.error.main })} />
            <ListItemText primary={t('logout', currentLanguage)} />
          </ListItem>
        </List>
      ) : (
        <List>
          <ListItem button onClick={() => handleNavigation('/login')} sx={{ py: 2 }}>
            <Person sx={(theme) => ({ mr: 2, color: theme.palette.primary.main })} />
            <ListItemText primary="Login" />
          </ListItem>
          <ListItem button onClick={() => handleNavigation('/register')} sx={{ py: 2 }}>
            <Person sx={(theme) => ({ mr: 2, color: theme.palette.primary.main })} />
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
        sx={(theme) => ({
          backgroundColor: theme.palette.mode === 'dark'
            ? theme.palette.background.default
            : theme.palette.background.paper,
          borderBottom: `1px solid ${theme.palette.primary.main}33`,
          color: theme.palette.text.primary,
          zIndex: (theme) => theme.zIndex.drawer + 1,
        })}
      >
        <Toolbar sx={{ 
          minHeight: 70, 
          position: 'relative',
          width: '100%',
          px: 0,
        }}>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleMobileDrawerToggle}
              sx={{ mr: 2, ml: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          <Typography
            variant="h5"
            noWrap
            component="div"
            sx={{ 
              position: 'absolute',
              left: isMobile ? 56 : 16,
              cursor: 'pointer',
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              zIndex: 1,
            }}
            onClick={() => navigate('/')}
          >
            <QuestionAnswer sx={{ mr: 1, fontSize: 28 }} />
            {t('qa_platform', currentLanguage)}
          </Typography>

          <Container 
            maxWidth="lg" 
            sx={{ 
              position: 'relative',
              width: '100%',
              margin: '0 auto',
            }}
          >
            {!isMobile && (
              <Box sx={{ 
                width: '100%',
                display: 'grid',
                gridTemplateColumns: '1fr auto 1fr',
                alignItems: 'center',
                gap: 2,
                position: 'relative',
                zIndex: 1,
              }}>
              {/* Sol taraf: Soruştur butonu */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                <Button
                  variant="contained"
                  onClick={() => navigate('/inquire')}
                  startIcon={<HelpOutline sx={{ fontSize: '1.1rem' }} />}
                  sx={{
                    borderRadius: 12,
                    backgroundColor: (() => {
                      if (themeName === 'magnefite') {
                        return '#8B5CF6'; // Purple - fixed for both modes
                      } else if (themeName === 'papirus') {
                        return mode === 'dark' ? '#8B7355' : '#A0826D'; // Bronze brown
                      } else if (themeName === 'molume') {
                        return mode === 'dark' ? '#9CA3AF' : '#6B7280'; // Grayish
                      }
                      return theme.palette.info.main; // Default: info
                    })(),
                    color: 'white',
                    textTransform: 'none',
                    py: 1.3,
                    px: 2.5,
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    minWidth: '140px',
                    boxShadow: (() => {
                      let color = '#8B5CF6';
                      if (themeName === 'magnefite') {
                        color = '#8B5CF6';
                      } else if (themeName === 'papirus') {
                        color = mode === 'dark' ? '#8B7355' : '#A0826D';
                      } else if (themeName === 'molume') {
                        color = mode === 'dark' ? '#9CA3AF' : '#6B7280';
                      } else {
                        color = theme.palette.info.main;
                      }
                      return `0 2px 8px ${color}33`;
                    })(),
                    '&:hover': {
                      backgroundColor: (() => {
                        if (themeName === 'magnefite') {
                          return '#7C3AED'; // Darker purple
                        } else if (themeName === 'papirus') {
                          return mode === 'dark' ? '#6B5B3D' : '#8B7355';
                        } else if (themeName === 'molume') {
                          return mode === 'dark' ? '#6B7280' : '#4B5563';
                        }
                        return theme.palette.info.dark;
                      })(),
                    },
                  }}
                >
                  {t('inquire', currentLanguage)}
                </Button>
              </Box>

              {/* Orta: Arama Bar */}
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <form onSubmit={handleSearch} style={{ display: 'flex', minWidth: 0 }}>
                  <Search
                    sx={{
                      width: '320px',
                      backgroundColor: mode === 'dark' 
                        ? alpha(theme.palette.common.white, 0.08)
                        : alpha(theme.palette.common.black, 0.04),
                      borderColor: mode === 'dark'
                        ? alpha(theme.palette.common.white, 0.25)
                        : alpha(theme.palette.common.black, 0.2),
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      py: 1.3,
                      minWidth: 0,
                      '&:hover': {
                        backgroundColor: mode === 'dark'
                          ? alpha(theme.palette.common.white, 0.12)
                          : alpha(theme.palette.common.black, 0.06),
                        borderColor: mode === 'dark'
                          ? alpha(theme.palette.common.white, 0.35)
                          : alpha(theme.palette.common.black, 0.3),
                      },
                    }}
                  >
                    <SearchIconWrapper>
                      <SearchIcon sx={{ 
                        color: mode === 'dark' 
                          ? alpha(theme.palette.common.white, 0.75)
                          : alpha(theme.palette.common.black, 0.65),
                        fontSize: '1.15rem' 
                      }} />
                    </SearchIconWrapper>
                    <StyledInputBase
                      placeholder={t('search', currentLanguage)}
                      inputProps={{ 'aria-label': 'search' }}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      sx={{
                        '& .MuiInputBase-input': {
                          color: mode === 'dark'
                            ? alpha(theme.palette.common.white, 0.95)
                            : alpha(theme.palette.common.black, 0.85),
                          fontSize: '0.95rem',
                          padding: '7px 14px 7px 0',
                          fontWeight: 400,
                          '&::placeholder': {
                            color: mode === 'dark'
                              ? alpha(theme.palette.common.white, 0.65)
                              : alpha(theme.palette.common.black, 0.55),
                            opacity: 1,
                          },
                        },
                      }}
                    />
                  </Search>
                </form>
              </Box>

              {/* Sağ taraf: Sorgula butonu */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  onClick={() => navigate('/query')}
                  startIcon={<FindInPage sx={{ fontSize: '1.1rem' }} />}
                  sx={{
                    borderRadius: 12,
                    backgroundColor: (() => {
                      if (themeName === 'magnefite') {
                        return mode === 'dark' ? '#9CA3AF' : '#6B7280'; // Gray
                      } else if (themeName === 'papirus') {
                        return mode === 'dark' ? '#6B5B3D' : '#C4B5A0'; // Different bronze brown
                      } else if (themeName === 'molume') {
                        return mode === 'dark' ? '#0A1A23' : '#E8E4DC'; // Different color
                      }
                      return theme.palette.secondary.main; // Default: secondary
                    })(),
                    color: (() => {
                      if (themeName === 'magnefite') {
                        return 'white';
                      } else if (themeName === 'papirus') {
                        return 'white';
                      } else if (themeName === 'molume') {
                        return mode === 'dark' ? 'white' : '#2C2823';
                      }
                      return 'white';
                    })(),
                    textTransform: 'none',
                    py: 1.3,
                    px: 2.5,
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    minWidth: '140px',
                    boxShadow: (() => {
                      let color = theme.palette.secondary.main;
                      if (themeName === 'magnefite') {
                        color = mode === 'dark' ? '#9CA3AF' : '#6B7280';
                      } else if (themeName === 'papirus') {
                        color = mode === 'dark' ? '#6B5B3D' : '#C4B5A0';
                      } else if (themeName === 'molume') {
                        color = mode === 'dark' ? '#0A1A23' : '#E8E4DC';
                      }
                      return `0 2px 8px ${color}33`;
                    })(),
                    '&:hover': {
                      backgroundColor: (() => {
                        if (themeName === 'magnefite') {
                          return mode === 'dark' ? '#6B7280' : '#4B5563';
                        } else if (themeName === 'papirus') {
                          return mode === 'dark' ? '#4A3E2F' : '#B8A895';
                        } else if (themeName === 'molume') {
                          return mode === 'dark' ? '#061218' : '#E0DCD4';
                        }
                        return theme.palette.secondary.dark;
                      })(),
                    },
                  }}
                >
                  {t('query', currentLanguage)}
                </Button>
              </Box>
            </Box>
          )}
          </Container>

          {/* Right side controls - Container dışında */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: { xs: 2, sm: 3, md: 4 } }}>
            {/* Theme Toggle - Ampul */}
            <ThemeToggle />

            {/* Theme Selector */}
            <ThemeSelector />

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
                <img
                  src={
                    theme.palette.mode === 'dark'
                      ? preferLanguageIconWhite
                      : preferLanguageIconBlack
                  }
                  alt="Language"
                  style={{ width: 24, height: 24 }}
                />
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
                      {user.name.charAt(0).toUpperCase()}
                    </Avatar>
                  ) : (
                    <Avatar sx={{ width: 32, height: 32 }}>
                      {user?.name.charAt(0).toUpperCase() || '?'}
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
                    background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
                    '&:hover': {
                      background: `linear-gradient(135deg, ${theme.palette.success.light} 0%, ${theme.palette.success.main} 100%)`,
                    }
                  }}
                >
                  {t('register', currentLanguage)}
                </Button>
              </>
            )}
          </Box>
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
            boxShadow: (theme) => theme.palette.mode === 'dark' ? `0 8px 32px ${theme.palette.primary.main}22` : `0 8px 32px ${theme.palette.grey[400]}33`,
            border: (theme) => `1px solid ${theme.palette.primary.main}22`,
            background: (theme) => `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
            color: (theme) => theme.palette.text.primary,
          }
        }}
      >
        <MenuItem 
          onClick={() => handleLanguageChange('tr')}
          selected={currentLanguage === 'tr'}
          sx={(theme) => ({
            '&:hover': {
              background: `${theme.palette.primary.main}22`,
            },
            '&.Mui-selected': {
              background: `${theme.palette.primary.main}33`,
              '&:hover': {
                background: `${theme.palette.primary.main}44`,
              }
            }
          })}
        >
          🇹🇷 Türkçe
        </MenuItem>
        <MenuItem
          onClick={() => handleLanguageChange('en')}
          selected={currentLanguage === 'en'}
          sx={(theme) => ({
            '&:hover': {
              background: `${theme.palette.primary.main}22`,
            },
            '&.Mui-selected': {
              background: `${theme.palette.primary.main}33`,
              '&:hover': {
                background: `${theme.palette.primary.main}44`,
              },
            },
          })}
        >
          🇺🇸 English
        </MenuItem>
        <MenuItem
          onClick={() => handleLanguageChange('de')}
          selected={currentLanguage === 'de'}
          sx={(theme) => ({
            '&:hover': {
              background: `${theme.palette.primary.main}22`,
            },
            '&.Mui-selected': {
              background: `${theme.palette.primary.main}33`,
              '&:hover': {
                background: `${theme.palette.primary.main}44`,
              },
            },
          })}
        >
          🇩🇪 Deutsch
        </MenuItem>
      </Menu>
    </>
  );
};

export default Header;
