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
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountCircle,
  Logout,
  Person,
  QuestionAnswer,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logout } from '../../store/auth/authSlice';

const Header = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  // user tipini any olarak başlat (ileride User interface'i eklenebilir)
  const { user, isAuthenticated } = useAppSelector(state => state.auth as any);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMobileDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    dispatch(logout());
    handleMenuClose();
    navigate('/login');
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setMobileOpen(false);
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
    >
      <MenuItem
        onClick={() => {
          handleMenuClose();
          navigate('/profile');
        }}
      >
        <Person sx={{ mr: 1 }} />
        Profile
      </MenuItem>
      <Divider />
      <MenuItem onClick={handleLogout}>
        <Logout sx={{ mr: 1 }} />
        Logout
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
        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240 },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" noWrap component="div">
          QA Platform
        </Typography>
      </Box>
      <Divider />
      <List>
        <ListItem button onClick={() => handleNavigation('/')}>
          <ListItemText primary="Home" />
        </ListItem>
        <ListItem button onClick={() => handleNavigation('/questions')}>
          <ListItemText primary="Questions" />
        </ListItem>
        {isAuthenticated && (
          <ListItem button onClick={() => handleNavigation('/ask')}>
            <ListItemText primary="Ask Question" />
          </ListItem>
        )}
      </List>
      <Divider />
      {isAuthenticated ? (
        <List>
          <ListItem button onClick={() => handleNavigation('/profile')}>
            <ListItemText primary="Profile" />
          </ListItem>
          <ListItem button onClick={handleLogout}>
            <ListItemText primary="Logout" />
          </ListItem>
        </List>
      ) : (
        <List>
          <ListItem button onClick={() => handleNavigation('/login')}>
            <ListItemText primary="Login" />
          </ListItem>
          <ListItem button onClick={() => handleNavigation('/register')}>
            <ListItemText primary="Register" />
          </ListItem>
        </List>
      )}
    </Drawer>
  );

  return (
    <>
      <AppBar position="static" elevation={1}>
        <Toolbar>
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
            variant="h6"
            noWrap
            component="div"
            sx={{ flexGrow: 1, cursor: 'pointer' }}
            onClick={() => navigate('/')}
          >
            <QuestionAnswer sx={{ mr: 1, verticalAlign: 'middle' }} />
            QA Platform
          </Typography>

          {!isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button color="inherit" onClick={() => navigate('/questions')}>
                Questions
              </Button>

              {isAuthenticated ? (
                <>
                  <Button color="inherit" onClick={() => navigate('/ask')}>
                    Ask Question
                  </Button>
                  <IconButton
                    size="large"
                    edge="end"
                    aria-label="account of current user"
                    aria-controls={menuId}
                    aria-haspopup="true"
                    onClick={handleProfileMenuOpen}
                    color="inherit"
                  >
                    {user?.profileImage ? (
                      <Avatar
                        src={user.profileImage}
                        sx={{ width: 32, height: 32 }}
                      />
                    ) : (
                      <AccountCircle />
                    )}
                  </IconButton>
                </>
              ) : (
                <>
                  <Button color="inherit" onClick={() => navigate('/login')}>
                    Login
                  </Button>
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={() => navigate('/register')}
                  >
                    Register
                  </Button>
                </>
              )}
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {mobileDrawer}
      {renderMenu}
    </>
  );
};

export default Header;
