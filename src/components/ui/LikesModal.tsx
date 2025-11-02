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
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { t } from '../../utils/translations';

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    backgroundColor: 'rgba(15, 31, 40, 0.98)',
    color: 'white',
    borderRadius: 16,
    backdropFilter: 'blur(10px)',
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
  const { currentLanguage } = useAppSelector(state => state.language);

  return (
    <StyledDialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ color: 'white' }}>
          {title || t('users_who_liked', currentLanguage)}
        </Typography>
        <IconButton 
          onClick={onClose}
          sx={{ color: 'rgba(255,255,255,0.7)' }}
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
                  border: '1px solid rgba(255, 184, 0, 0.2)',
                  borderRadius: 2,
                  mb: 1,
                  padding: 2,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 184, 0, 0.1)',
                    borderColor: 'rgba(255, 184, 0, 0.4)',
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
                  primaryTypographyProps={{ color: 'white' }}
                  secondaryTypographyProps={{ color: 'rgba(255,255,255,0.6)' }}
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography sx={{ color: 'rgba(255,255,255,0.6)', textAlign: 'center', py: 2 }}>
            {t('no_likes_yet', currentLanguage)}
          </Typography>
        )}
      </DialogContent>
    </StyledDialog>
  );
};

export default LikesModal;

