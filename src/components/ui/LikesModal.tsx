import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { styled, useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { t } from '../../utils/translations';
import papyrusVertical1 from '../../asset/textures/papyrus_vertical_1.png';

const StyledDialog = styled(Dialog, {
  shouldForwardProp: (prop) => prop !== 'isPapirus',
})<{ isPapirus?: boolean }>(({ theme, isPapirus }) => ({
  '& .MuiDialog-paper': {
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary,
    borderRadius: 16,
    backdropFilter: theme.palette.mode === 'dark' ? 'blur(10px)' : 'none',
    border: `1px solid ${theme.palette.divider}`,
    position: 'relative',
    overflow: 'hidden',
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
        backgroundPosition: 'center 3%',
        backgroundRepeat: 'no-repeat',
        opacity: theme.palette.mode === 'dark' ? 0.12 : 0.15,
        pointerEvents: 'none',
        zIndex: 0,
      },
      '& > *': {
        position: 'relative',
        zIndex: 1,
      },
    } : {}),
  },
}));

interface User {
  id: string;
  name: string;
  email: string;
  profile_image?: string;
  title?: string;
}

interface LikesModalProps {
  open: boolean;
  onClose: () => void;
  users: User[];
  title?: string;
}

const LikesModal: React.FC<LikesModalProps> = ({ 
  open, 
  onClose, 
  users, 
  title 
}) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { currentLanguage } = useAppSelector(state => state.language);
  const { name: themeName } = useAppSelector(state => state.theme);
  const isPapirus = themeName === 'papirus';

  // Get theme-specific colors for border and hover
  const getThemeColors = () => {
    if (themeName === 'molume') {
      const primaryColor = theme.palette.mode === 'dark' ? '#FFB800' : '#FFB800';
      return {
        border: `${primaryColor}33`,
        hoverBg: `${primaryColor}22`,
        hoverBorder: `${primaryColor}66`,
      };
    } else if (themeName === 'magnefite') {
      const primaryColor = theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280';
      return {
        border: `${primaryColor}33`,
        hoverBg: `${primaryColor}22`,
        hoverBorder: `${primaryColor}66`,
      };
    } else if (themeName === 'papirus') {
      const primaryColor = theme.palette.mode === 'dark' ? '#8D6E63' : '#A1887F';
      return {
        border: `${primaryColor}33`,
        hoverBg: `${primaryColor}22`,
        hoverBorder: `${primaryColor}66`,
      };
    }
    const primaryColor = theme.palette.primary.main;
    return {
      border: `${primaryColor}33`,
      hoverBg: `${primaryColor}22`,
      hoverBorder: `${primaryColor}66`,
    };
  };

  const themeColors = getThemeColors();

  return (
    <StyledDialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      isPapirus={isPapirus}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ color: theme.palette.text.primary }}>
          {title || t('users_who_liked', currentLanguage)}
        </Typography>
        <IconButton 
          onClick={onClose}
          sx={{ color: theme.palette.text.secondary }}
        >
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {users.length > 0 ? (
          <List>
            {users.map((user) => (
              <ListItem 
                key={user.id}
                sx={{
                  cursor: 'pointer',
                  border: `1px solid ${themeColors.border}`,
                  borderRadius: 2,
                  mb: 1,
                  padding: 2,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: themeColors.hoverBg,
                    borderColor: themeColors.hoverBorder,
                  }
                }}
                onClick={() => {
                  onClose();
                  navigate(`/profile/${user.id}`);
                }}
              >
                <ListItemAvatar>
                  <Avatar 
                    src={user.profile_image} 
                    alt={user.name}
                    sx={{ width: 48, height: 48 }}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText 
                  primary={user.name}
                  secondary={user.title || user.email}
                  primaryTypographyProps={{ color: theme.palette.text.primary }}
                  secondaryTypographyProps={{ color: theme.palette.text.secondary }}
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography sx={{ color: theme.palette.text.secondary, textAlign: 'center', py: 2 }}>
            {t('no_likes_yet', currentLanguage)}
          </Typography>
        )}
      </DialogContent>
    </StyledDialog>
  );
};

export default LikesModal;

