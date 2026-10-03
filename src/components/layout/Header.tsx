import React, { useState, useEffect } from 'react';
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
  Badge,
  Tooltip,
  Container,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Logout,
  Person,
  QuestionAnswer,
  Notifications,
  TrendingUp,
  Home,
  AdminPanelSettings,
  Settings,
  Search as SearchIcon,
  FilterList,
} from '@mui/icons-material';
import preferLanguageIconBlack from '../../asset/icons/home/prefer_language_black.png';
import preferLanguageIconWhite from '../../asset/icons/home/prefer_language_white.png';
import papyrusVertical1 from '../../asset/textures/papyrus_vertical_1.png';
import { alpha } from '@mui/material/styles';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logoutUser } from '../../store/auth/authThunks';
import { setLanguage } from '../../store/language/languageSlice';
import { User } from '../../types/user';
import ThemeToggle from '../ui/ThemeToggle';
import ThemeSelector from '../ui/ThemeSelector';
import { t } from '../../utils/translations';
import { contentAssetService } from '../../services/contentAssetService';
import { useSettingsModal } from '../../contexts/SettingsModalContext';
import InquireButton from './header/InquireButton';
import QueryButton from './header/QueryButton';
import HeaderSearchField, { MIN_SEARCH_LENGTH } from './header/HeaderSearchField';
import { headerTrioCssVars } from './header/headerTrioMotion';
import { showInfoToast } from '../../utils/notificationUtils';
import { setFilterModalOpen } from '../../store/home/homeSlice';

const Header = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchErrorFlash, setSearchErrorFlash] = useState(false);
  const [languageAnchorEl, setLanguageAnchorEl] = useState<null | HTMLElement>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);

  const openSettingsModal = useSettingsModal()?.openSettingsModal;
  const { user, isAuthenticated, hasAdminPermission } = useAppSelector(
    (state) => ({
      user: state.auth.user as User | null,
      isAuthenticated: state.auth.isAuthenticated,
      hasAdminPermission: state.auth.hasAdminPermission,
    }),
  );

  // Resolve profile image URL from Cloudflare key if needed
  useEffect(() => {
    if (!user?.profile_image) {
      setProfileImageUrl(null);
      return;
    }

    const profileImage = user.profile_image;
    
    // If it's already a URL, use it directly
    if (profileImage.startsWith('http')) {
      setProfileImageUrl(profileImage);
      return;
    }

    // If it's 'default.jpg', use null (will show initials)
    if (profileImage === 'default.jpg') {
      setProfileImageUrl(null);
      return;
    }

    // Otherwise, resolve from Cloudflare key
    const resolveProfileImage = async () => {
      try {
        const url = await contentAssetService.resolveAssetUrl({
          key: profileImage,
          type: 'user-profile-avatar',
          ownerId: user.id,
          visibility: 'public',
          presignedUrl: false,
        });
        setProfileImageUrl(url);
      } catch (error) {
        console.error('Failed to resolve profile image URL:', error);
        setProfileImageUrl(null);
      }
    };

    resolveProfileImage();
  }, [user?.profile_image, user?.id]);
  const { currentLanguage } = useAppSelector(state => state.language);
  const { name: themeName, mode } = useAppSelector(state => state.theme);
  const { filterModalOpen, activeFilters } = useAppSelector(state => state.home);
  const isPapirus = themeName === 'papirus';

  const handleOpenFilter = () => {
    dispatch(setFilterModalOpen(true));
    if (location.pathname.startsWith('/search')) return;
    const params = new URLSearchParams();
    const q = searchQuery.trim();
    if (q.length >= MIN_SEARCH_LENGTH) {
      params.set('q', q);
    }
    const qs = params.toString();
    navigate(qs ? `/search?${qs}` : '/search');
  };

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

  // /search?q=... ile gelince header alanını senkron tut
  useEffect(() => {
    if (!location.pathname.startsWith('/search')) return;
    const q = new URLSearchParams(location.search).get('q');
    if (q != null && q !== searchQuery) {
      setSearchQuery(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- yalnız URL değişince senkronla
  }, [location.pathname, location.search]);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery.length < MIN_SEARCH_LENGTH) {
      setSearchErrorFlash(true);
      showInfoToast(t('min_search_length', currentLanguage));
      return;
    }
    setSearchErrorFlash(false);

    // /search üzerindeyse mevcut filtreleri koru; aynı q için yeniden tetiklemek üzere _t ekle
    const params = location.pathname.startsWith('/search')
      ? new URLSearchParams(location.search)
      : new URLSearchParams();
    const currentQ = params.get('q');
    if (currentQ === trimmedQuery) {
      params.set('_t', Date.now().toString());
    } else {
      params.delete('_t');
    }
    params.set('q', trimmedQuery);
    params.delete('includeAnswers');
    navigate(`/search?${params.toString()}`);
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
        <ListItem button onClick={() => handleNavigation('/search')} sx={{ py: 2 }}>
          <SearchIcon sx={(theme) => ({ mr: 2, color: theme.palette.primary.main })} />
          <ListItemText primary={t('search', currentLanguage)} />
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
        <Toolbar
          sx={{
            minHeight: 70,
            width: '100%',
            px: { xs: 1, sm: 2 },
            gap: 1,
            display: 'flex',
            alignItems: 'center',
            ...headerTrioCssVars(theme),
          }}
        >
          {/* Sol: logo / menü — önce buradaki boşluk erir */}
          <Box
            sx={{
              flex: '1 1 0%',
              minWidth: 0,
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {isMobile ? (
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleMobileDrawerToggle}
              >
                <MenuIcon />
              </IconButton>
            ) : (
              <Typography
                variant="h5"
                noWrap
                component="div"
                sx={{
                  cursor: 'pointer',
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontWeight: 700,
                  display: { xs: 'none', xl: 'flex' },
                  alignItems: 'center',
                }}
                onClick={() => navigate('/')}
              >
                <QuestionAnswer sx={{ mr: 1, fontSize: 28 }} />
                {t('qa_platform', currentLanguage)}
              </Typography>
            )}
          </Box>

          {/* Orta: soru listesi ile aynı maxWidth="lg" hizası */}
          <Container
            maxWidth="lg"
            disableGutters
            sx={{
              flex: '0 1 1200px',
              maxWidth: 1200,
              minWidth: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              px: { xs: 2, sm: 3 },
              containerType: 'inline-size',
              // Arama min genişliğe indikten sonra butonlar da sıkışır
              '@container (max-width: 520px)': {
                '& .header-nav-btn': {
                  flex: '0 1 auto',
                  minWidth: 0,
                },
                '& .header-nav-btn .MuiButton-root': {
                  px: 1.25,
                  minWidth: 0,
                },
              },
            }}
          >
            {!isMobile && (
              <>
                <InquireButton
                  label={t('inquire', currentLanguage)}
                  active={location.pathname.startsWith('/inquire')}
                  onClick={() => navigate('/inquire')}
                />
                <QueryButton
                  label={t('query', currentLanguage)}
                  active={location.pathname.startsWith('/query')}
                  onClick={() => navigate('/query')}
                />
                <Box
                  sx={{
                    flex: '1 1 auto',
                    minWidth: 72,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.75,
                  }}
                >
                  <HeaderSearchField
                    value={searchQuery}
                    placeholder={t('search', currentLanguage)}
                    searchLabel={t('search', currentLanguage)}
                    clearLabel={t('clear', currentLanguage)}
                    onChange={setSearchQuery}
                    onSubmit={handleSearch}
                    errorFlash={searchErrorFlash}
                    onErrorFlashEnd={() => setSearchErrorFlash(false)}
                  />
                  <Tooltip title={t('filter', currentLanguage)}>
                    <IconButton
                      color="inherit"
                      aria-label={t('filter', currentLanguage)}
                      onClick={handleOpenFilter}
                      sx={{
                        flexShrink: 0,
                        width: 42,
                        height: 42,
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: filterModalOpen || activeFilters.length > 0
                          ? 'primary.main'
                          : 'divider',
                        color: filterModalOpen || activeFilters.length > 0
                          ? 'primary.main'
                          : 'text.secondary',
                        backgroundColor: filterModalOpen
                          ? (theme) => alpha(theme.palette.primary.main, 0.08)
                          : 'transparent',
                        '&:hover': {
                          borderColor: 'primary.main',
                          color: 'primary.main',
                          backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.08),
                        },
                      }}
                    >
                      <Badge
                        color="primary"
                        variant="dot"
                        invisible={activeFilters.length === 0}
                        overlap="circular"
                      >
                        <FilterList sx={{ fontSize: 22 }} />
                      </Badge>
                    </IconButton>
                  </Tooltip>
                </Box>
              </>
            )}
          </Container>

          {/* Sağ kontroller — ikon genişliğinin altına inmez; sol boşluk önce erir */}
          <Box
            sx={{
              flex: '1 1 0%',
              minWidth: 'fit-content',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 1,
            }}
          >
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

            {isAuthenticated && (
              <Tooltip title={t('settings', currentLanguage)}>
                <IconButton
                  color="inherit"
                  onClick={() => openSettingsModal?.()}
                  sx={{
                    borderRadius: 2,
                    border: '1px solid rgba(255,255,255,0.2)',
                    '&:hover': {
                      background: 'rgba(255,255,255,0.1)',
                    },
                  }}
                >
                  <Settings />
                </IconButton>
              </Tooltip>
            )}

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
                    borderRadius: '50%',
                    border: '1px solid rgba(255,255,255,0.2)',
                    padding: 0,
                    width: 36,
                    height: 36,
                    '&:hover': {
                      background: 'rgba(255,255,255,0.1)',
                    }
                  }}
                >
                  {profileImageUrl ? (
                    <Avatar
                      src={profileImageUrl}
                      sx={{ width: 36, height: 36 }}
                    >
                      {user?.name?.charAt(0).toUpperCase()}
                    </Avatar>
                  ) : (
                    <Avatar sx={{ width: 36, height: 36 }}>
                      {user?.name?.charAt(0).toUpperCase() || '?'}
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
