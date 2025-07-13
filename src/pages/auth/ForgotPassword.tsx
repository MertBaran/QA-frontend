import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
} from '@mui/material';
import axios from 'axios';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (!email) {
      setError('Lütfen email adresinizi girin.');
      return;
    }
    setLoading(true);
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/auth/forgotPassword`,
        { email }
      );
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Şifre sıfırlama isteği gönderilemedi.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, p: 4, boxShadow: 2, borderRadius: 2, bgcolor: 'background.paper' }}>
        <Typography variant="h4" gutterBottom>
          Şifremi Unuttum
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>Eğer bu email sistemde kayıtlıysa, şifre sıfırlama bağlantısı gönderildi. Lütfen emailinizi kontrol edin.</Alert>}
        <form onSubmit={handleSubmit}>
          <TextField
            label="Email Adresi"
            type="email"
            fullWidth
            margin="normal"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2 }}
            disabled={loading}
          >
            {loading ? 'Gönderiliyor...' : 'Şifre Sıfırlama Linki Gönder'}
          </Button>
        </form>
      </Box>
    </Container>
  );
};

export default ForgotPassword; 