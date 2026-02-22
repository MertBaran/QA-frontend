import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Alert,
  TextField,
  Button,
} from '@mui/material';
import { authService } from '../../services/authService';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]).{8,}$/;
const PASSWORD_REQUIREMENT =
  'En az 8 karakter, bir büyük harf, bir küçük harf, bir rakam ve bir özel karakter içermelidir';

const ResetPassword: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const params = new URLSearchParams(location.search);
  const token = params.get('token');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!token) {
      setError('Geçersiz veya eksik token.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Şifre en az 8 karakter olmalıdır.');
      return;
    }
    if (!PASSWORD_REGEX.test(newPassword)) {
      setError(PASSWORD_REQUIREMENT);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Şifreler eşleşmiyor.');
      return;
    }
    setLoading(true);
    try {
      await authService.resetPassword(token, newPassword);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      const data = err.response?.data;
      const apiError =
        data?.error ||
        data?.message ||
        (Array.isArray(data?.errors) && data.errors[0]?.message);
      setError(apiError || 'Şifre sıfırlanamadı. Link süresi dolmuş olabilir.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ mt: 8, p: 4, boxShadow: 2, borderRadius: 2, bgcolor: 'background.paper' }}>
          <Typography variant="h4" gutterBottom>
            Şifre Sıfırla
          </Typography>
          <Alert severity="error">Geçersiz veya eksik token. Lütfen e-postanızdaki linki kullanın.</Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, p: 4, boxShadow: 2, borderRadius: 2, bgcolor: 'background.paper' }}>
        <Typography variant="h4" gutterBottom>
          Şifre Sıfırla
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Şifreniz başarıyla sıfırlandı! Giriş sayfasına yönlendiriliyorsunuz...
          </Alert>
        )}
        {!success && (
          <form onSubmit={handleSubmit}>
            <TextField
              label="Yeni Şifre"
              type="password"
              fullWidth
              margin="normal"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              autoComplete="new-password"
              helperText={PASSWORD_REQUIREMENT}
            />
            <TextField
              label="Şifre Tekrar"
              type="password"
              fullWidth
              margin="normal"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 2 }}
              disabled={loading}
            >
              {loading ? 'Sıfırlanıyor...' : 'Şifremi Sıfırla'}
            </Button>
          </form>
        )}
      </Box>
    </Container>
  );
};

export default ResetPassword; 