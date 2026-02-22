import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  CircularProgress,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Lock, Visibility, VisibilityOff } from '@mui/icons-material';
import { t } from '../../utils/translations';
import { createPasswordChangeSchema } from '../../utils/validation';
import { authService } from '../../services/authService';
import { showErrorToast, showSuccessToast } from '../../utils/notificationUtils';
import PasswordChangeCodeModal from './PasswordChangeCodeModal';

interface ChangePasswordModalProps {
  open: boolean;
  onClose: () => void;
  profileUser: { isGoogleUser?: boolean; email: string } | null;
  currentLanguage: string;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  open,
  onClose,
  profileUser,
  currentLanguage,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordErrors, setPasswordErrors] = useState<{
    newPassword?: string;
    confirmPassword?: string;
    currentPassword?: string;
  }>({});
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentPasswordReadOnly, setCurrentPasswordReadOnly] = useState(true);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [codeModalOpen, setCodeModalOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordErrors({});
      setCurrentPasswordReadOnly(true);
    } else {
      setCurrentPasswordReadOnly(true);
    }
  }, [open]);

  // Alanlar değiştiğinde validasyon (butonun doğru disable olması için)
  useEffect(() => {
    if (!open || !profileUser) return;
    const timer = setTimeout(() => {
      validateForm();
    }, 300);
    return () => clearTimeout(timer);
  }, [open, profileUser, currentPassword, newPassword, confirmPassword]);

  const validateForm = async (): Promise<boolean> => {
    const errors: { newPassword?: string; confirmPassword?: string; currentPassword?: string } = {};

    if (!profileUser?.isGoogleUser && !currentPassword.trim()) {
      errors.currentPassword = t('current_password_required', currentLanguage) || 'Current password is required';
    }

    // Yeni şifre mevcut şifre ile aynı olamaz (Google hariç)
    if (!profileUser?.isGoogleUser && currentPassword && newPassword && currentPassword === newPassword) {
      errors.newPassword = t('new_password_must_differ', currentLanguage) || 'New password must be different from current password';
    }

    try {
      const schema = createPasswordChangeSchema(currentLanguage);
      await schema.validate(
        {
          oldPassword: profileUser?.isGoogleUser ? undefined : currentPassword,
          newPassword,
          confirmPassword,
        },
        { abortEarly: false }
      );
    } catch (err: unknown) {
      const yupErr = err as { inner?: Array<{ path?: string; message: string }> };
      yupErr.inner?.forEach((e) => {
        if (e.path === 'newPassword') errors.newPassword = e.message;
        else if (e.path === 'confirmPassword') errors.confirmPassword = e.message;
        else if (e.path === 'oldPassword') errors.currentPassword = e.message;
      });
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRequestPasswordChange = async () => {
    setPasswordErrors({});
    const isValid = await validateForm();
    if (!isValid) return;

    setIsChangingPassword(true);
    try {
      await authService.requestPasswordChange(
        profileUser?.isGoogleUser ? undefined : currentPassword,
        newPassword
      );
      setCodeModalOpen(true);
      showSuccessToast(t('password_change_code_sent', currentLanguage) || 'Verification code sent to your email');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        t('password_change_request_failed', currentLanguage) ||
        'Failed to request password change';
      if (
        errorMessage.toLowerCase().includes('current password') ||
        errorMessage.toLowerCase().includes('mevcut şifre')
      ) {
        setPasswordErrors({ currentPassword: errorMessage });
      } else {
        showErrorToast(errorMessage);
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleVerifyCode = async (code: string) => {
    const response = await authService.verifyPasswordChangeCode(code);
    if (!response.success || !response.data?.verificationToken) {
      throw new Error(t('invalid_code', currentLanguage) || 'Invalid code');
    }
    try {
      await authService.confirmPasswordChange(response.data.verificationToken, newPassword);
      setCodeModalOpen(false);
      showSuccessToast(t('password_changed_success', currentLanguage) || 'Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordErrors({});
      onClose();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      showErrorToast(err.response?.data?.message || err.message || t('password_change_failed', currentLanguage));
      throw error;
    }
  };

  const handleResendCode = async () => {
    await authService.requestPasswordChange(
      profileUser?.isGoogleUser ? undefined : currentPassword,
      newPassword
    );
    showSuccessToast(t('code_resent', currentLanguage) || 'Code resent successfully');
  };

  // Şifre kuralları sağlanmadan ve eşleşmeden buton pasif
  const passwordsMatch = newPassword === confirmPassword;
  const hasValidNewPassword = newPassword.length >= 8;
  const newPasswordNotSameAsCurrent =
    profileUser?.isGoogleUser || !currentPassword || newPassword !== currentPassword;
  const hasCurrentPasswordIfRequired = profileUser?.isGoogleUser || currentPassword.trim().length > 0;

  const isSubmitDisabled =
    isChangingPassword ||
    !newPassword ||
    !confirmPassword ||
    !passwordsMatch ||
    !hasValidNewPassword ||
    !newPasswordNotSameAsCurrent ||
    !hasCurrentPasswordIfRequired ||
    !!passwordErrors.newPassword ||
    !!passwordErrors.confirmPassword ||
    !!passwordErrors.currentPassword;

  if (!profileUser) return null;

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            bgcolor: 'background.paper',
          },
        }}
      >
        <DialogTitle sx={{ pb: 1.5 }}>
          {t('change_password', currentLanguage) || 'Change Password'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 2, overflow: 'visible' }}>
          {profileUser.isGoogleUser ? (
            <Box sx={{ mb: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
              {t('google_user_password_note', currentLanguage) ||
                'You signed up with Google. Enter a new password below to set a password for your account.'}
            </Box>
          ) : null}

          {!profileUser.isGoogleUser && (
            <TextField
              fullWidth
              type={showCurrentPassword ? 'text' : 'password'}
              label={t('current_password', currentLanguage) || 'Current Password'}
              value={currentPassword}
              autoComplete="new-password"
              name="current-password-manual"
              placeholder=""
              inputProps={{
                'data-1p-ignore': '',
                'data-lpignore': 'true',
                readOnly: currentPasswordReadOnly,
              }}
              InputLabelProps={{ shrink: true }}
              onFocus={() => setCurrentPasswordReadOnly(false)}
              onChange={(e) => {
                setCurrentPassword(e.target.value);
                setPasswordErrors((prev) => ({ ...prev, currentPassword: undefined }));
              }}
              error={!!passwordErrors.currentPassword}
              helperText={passwordErrors.currentPassword}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      edge="end"
                    >
                      {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />
          )}

          <TextField
            fullWidth
            type={showNewPassword ? 'text' : 'password'}
            label={t('new_password', currentLanguage) || 'New Password'}
            value={newPassword}
            InputLabelProps={{ shrink: true }}
            onChange={(e) => {
              setNewPassword(e.target.value);
              setPasswordErrors((prev) => ({ ...prev, newPassword: undefined }));
            }}
            error={!!passwordErrors.newPassword}
            helperText={
              passwordErrors.newPassword ||
              (newPassword ? '' : t('password_requirements', currentLanguage))
            }
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowNewPassword(!showNewPassword)} edge="end">
                    {showNewPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            type={showConfirmPassword ? 'text' : 'password'}
            label={t('confirm_new_password', currentLanguage) || 'Confirm New Password'}
            value={confirmPassword}
            InputLabelProps={{ shrink: true }}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setPasswordErrors((prev) => ({ ...prev, confirmPassword: undefined }));
            }}
            error={!!passwordErrors.confirmPassword}
            helperText={passwordErrors.confirmPassword}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    edge="end"
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} disabled={isChangingPassword}>
            {t('cancel', currentLanguage) || 'Cancel'}
          </Button>
          <Button
            onClick={handleRequestPasswordChange}
            variant="contained"
            disabled={isSubmitDisabled}
          >
            {isChangingPassword ? (
              <CircularProgress size={20} />
            ) : (
              t('request_password_change', currentLanguage) || 'Request Password Change'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <PasswordChangeCodeModal
        open={codeModalOpen}
        onClose={() => setCodeModalOpen(false)}
        onVerify={handleVerifyCode}
        onResend={handleResendCode}
        email={profileUser.email}
        currentLanguage={currentLanguage}
      />
    </>
  );
};

export default ChangePasswordModal;
