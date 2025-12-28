import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from '@mui/material';
import {
  ErrorOutline,
  WarningAmber,
  InfoOutlined,
  HelpOutline,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { confirmActions } from '../../store/confirm/confirmSlice';
import { confirmService } from '../../services/confirmService';
import type { ConfirmType } from '../../services/confirmService';

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    background: 'linear-gradient(135deg, rgba(10, 26, 35, 0.98) 0%, rgba(21, 42, 53, 0.99) 100%)',
    border: '1px solid rgba(255, 184, 0, 0.2)',
    borderRadius: 16,
    backdropFilter: 'blur(10px)',
    color: 'white',
    minWidth: 400,
    maxWidth: 600,
  },
}));

const IconContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  marginBottom: theme.spacing(2),
}));

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: 8,
  textTransform: 'none',
  fontWeight: 600,
  minWidth: 100,
}));

const ConfirmButton = styled(StyledButton)(({ theme }) => ({
  background: 'linear-gradient(135deg, #FFB800 0%, #FF8F00 100%)',
  color: 'white',
  '&:hover': {
    background: 'linear-gradient(135deg, #FFD54F 0%, #FFB800 100%)',
  },
}));

const CancelButton = styled(StyledButton)(({ theme }) => ({
  background: 'transparent',
  border: '1px solid rgba(255,255,255,0.3)',
  color: 'rgba(255,255,255,0.9)',
  '&:hover': {
    background: 'rgba(255,255,255,0.1)',
    borderColor: 'rgba(255,255,255,0.5)',
  },
}));

const ConfirmDialog: React.FC = () => {
  const dispatch = useAppDispatch();
  const { open, options } = useAppSelector((state) => state.confirm);

  const handleClose = () => {
    if (!options?.persistent) {
      dispatch(confirmActions.hideConfirm());
    }
  };

  const handleConfirm = () => {
    const callbacks = confirmService.getCallbacks();
    if (callbacks?.onConfirm) {
      callbacks.onConfirm();
    }
  };

  const handleCancel = () => {
    const callbacks = confirmService.getCallbacks();
    if (callbacks?.onCancel) {
      callbacks.onCancel();
    } else {
      handleClose();
    }
  };

  if (!options) return null;

  const getIcon = (type: ConfirmType = 'info') => {
    const iconStyle = { fontSize: 48 };
    switch (type) {
      case 'error':
        return <ErrorOutline sx={{ ...iconStyle, color: '#f44336' }} />;
      case 'warning':
        return <WarningAmber sx={{ ...iconStyle, color: '#ff9800' }} />;
      case 'question':
        return <HelpOutline sx={{ ...iconStyle, color: '#FFB800' }} />;
      case 'info':
      default:
        return <InfoOutlined sx={{ ...iconStyle, color: '#2196f3' }} />;
    }
  };

  const getConfirmColor = () => {
    if (options.confirmColor) return options.confirmColor;
    if (options.type === 'error') return 'error';
    if (options.type === 'warning') return 'warning';
    return 'primary';
  };

  return (
    <StyledDialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth={options.fullWidth}
    >
      {options.title && (
        <DialogTitle sx={{ color: 'white', fontWeight: 600 }}>
          {options.title}
        </DialogTitle>
      )}
      <DialogContent>
        <IconContainer>{getIcon(options.type)}</IconContainer>
        <Typography
          variant="body1"
          sx={{
            color: 'rgba(255,255,255,0.9)',
            textAlign: 'center',
            lineHeight: 1.6,
          }}
        >
          {options.message}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ padding: '16px 24px', gap: 1 }}>
        <CancelButton onClick={handleCancel}>
          {options.cancelText || 'İptal'}
        </CancelButton>
        <ConfirmButton
          onClick={handleConfirm}
          color={getConfirmColor()}
          sx={{
            ...(options.type === 'error' && {
              background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #ef5350 0%, #f44336 100%)',
              },
            }),
          }}
        >
          {options.confirmText || 'Onayla'}
        </ConfirmButton>
      </DialogActions>
    </StyledDialog>
  );
};

export default ConfirmDialog;
