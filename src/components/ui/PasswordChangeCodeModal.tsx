import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import { t } from '../../utils/translations';

interface PasswordChangeCodeModalProps {
  open: boolean;
  onClose: () => void;
  onVerify: (code: string) => Promise<void>;
  onResend: () => Promise<void>;
  email: string;
  currentLanguage: string;
}

const PasswordChangeCodeModal: React.FC<PasswordChangeCodeModalProps> = ({
  open,
  onClose,
  onVerify,
  onResend,
  email,
  currentLanguage,
}) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(180); // 3 minutes in seconds
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (open) {
      setCode('');
      setError(null);
      setTimeRemaining(180);
      setCanResend(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open || timeRemaining <= 0) {
      setCanResend(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [open, timeRemaining]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(value);
    setError(null);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    setCode(pasted);
    setError(null);
  };

  const handleVerify = async () => {
    if (code.length !== 6) {
      setError(t('code_must_be_6_digits', currentLanguage) || 'Code must be 6 digits');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onVerify(code);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || t('invalid_code', currentLanguage) || 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setError(null);
    setTimeRemaining(180);
    setCanResend(false);

    try {
      await onResend();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || t('resend_failed', currentLanguage) || 'Failed to resend code');
    } finally {
      setResendLoading(false);
    }
  };

  return (
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
        {t('verify_password_change', currentLanguage) || 'Verify Password Change'}
      </DialogTitle>
      <DialogContent sx={{ pt: 1.5 }}>
        <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
          {t('code_sent_to_email', currentLanguage) || 'A 6-digit verification code has been sent to'} {email}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          fullWidth
          label={t('verification_code', currentLanguage) || 'Verification Code'}
          value={code}
          onChange={handleCodeChange}
          onPaste={handlePaste}
          inputProps={{
            maxLength: 6,
            style: {
              textAlign: 'center',
              fontSize: '24px',
              letterSpacing: '8px',
              fontFamily: 'monospace',
            },
          }}
          autoFocus
          disabled={loading}
          sx={{ mb: 2 }}
        />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {t('code_expires_in', currentLanguage) || 'Code expires in'}: {formatTime(timeRemaining)}
          </Typography>
          <Button
            size="small"
            onClick={handleResend}
            disabled={!canResend || resendLoading}
            sx={{ minWidth: 100 }}
          >
            {resendLoading ? (
              <CircularProgress size={16} />
            ) : (
              t('resend_code', currentLanguage) || 'Resend Code'
            )}
          </Button>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          {t('cancel', currentLanguage) || 'Cancel'}
        </Button>
        <Button
          onClick={handleVerify}
          variant="contained"
          disabled={code.length !== 6 || loading}
        >
          {loading ? (
            <CircularProgress size={20} />
          ) : (
            t('verify', currentLanguage) || 'Verify'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PasswordChangeCodeModal;
