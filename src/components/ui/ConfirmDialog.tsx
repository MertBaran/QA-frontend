import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  useTheme,
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
    background: theme.palette.mode === 'dark'
      ? `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${theme.palette.background.paper} 100%)`
      : theme.palette.background.paper,
    border: `1px solid ${theme.palette.mode === 'dark' 
      ? theme.palette.divider 
      : theme.palette.divider}`,
    borderRadius: 16,
    backdropFilter: theme.palette.mode === 'dark' ? 'blur(10px)' : 'none',
    color: theme.palette.text.primary,
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
  background: theme.palette.mode === 'dark'
    ? `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`
    : theme.palette.primary.main,
  color: theme.palette.primary.contrastText || theme.palette.getContrastText(theme.palette.primary.main),
  '&:hover': {
    background: theme.palette.mode === 'dark'
      ? `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`
      : theme.palette.primary.dark,
  },
}));

const CancelButton = styled(StyledButton)(({ theme }) => ({
  background: 'transparent',
  border: `1px solid ${theme.palette.mode === 'dark' 
    ? 'rgba(255,255,255,0.3)' 
    : theme.palette.divider}`,
  color: theme.palette.mode === 'dark'
    ? 'rgba(255,255,255,0.9)'
    : theme.palette.text.primary,
  '&:hover': {
    background: theme.palette.mode === 'dark'
      ? 'rgba(255,255,255,0.1)'
      : theme.palette.action.hover,
    borderColor: theme.palette.mode === 'dark'
      ? 'rgba(255,255,255,0.5)'
      : theme.palette.divider,
  },
}));

const ConfirmDialog: React.FC = () => {
  const dispatch = useAppDispatch();
  const theme = useTheme();
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
        return <ErrorOutline sx={{ ...iconStyle, color: theme.palette.error.main }} />;
      case 'warning':
        return <WarningAmber sx={{ ...iconStyle, color: theme.palette.warning.main }} />;
      case 'question':
        return <HelpOutline sx={{ ...iconStyle, color: theme.palette.primary.main }} />;
      case 'info':
      default:
        return <InfoOutlined sx={{ ...iconStyle, color: theme.palette.info.main }} />;
    }
  };

  const getConfirmColor = () => {
    if (options.confirmColor) return options.confirmColor;
    if (options.type === 'error') return 'error';
    if (options.type === 'warning') return 'warning';
    return 'primary';
  };

  const getErrorButtonStyles = () => {
    if (options.type === 'error') {
      return {
        background: theme.palette.mode === 'dark'
          ? `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`
          : theme.palette.error.main,
        color: theme.palette.error.contrastText || theme.palette.getContrastText(theme.palette.error.main),
        '&:hover': {
          background: theme.palette.mode === 'dark'
            ? `linear-gradient(135deg, ${theme.palette.error.light} 0%, ${theme.palette.error.main} 100%)`
            : theme.palette.error.dark,
        },
      };
    }
    return {};
  };

  return (
    <StyledDialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth={options.fullWidth}
    >
      {options.title && (
        <DialogTitle sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
          {options.title}
        </DialogTitle>
      )}
      <DialogContent>
        <IconContainer>{getIcon(options.type)}</IconContainer>
        <Typography
          variant="body1"
          sx={{
            color: theme.palette.text.primary,
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
          sx={getErrorButtonStyles()}
        >
          {options.confirmText || 'Onayla'}
        </ConfirmButton>
      </DialogActions>
    </StyledDialog>
  );
};

export default ConfirmDialog;
