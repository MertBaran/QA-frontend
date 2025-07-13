import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Alert,
} from '@mui/material';

const ResetPassword: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Token'i query string'den al
  const params = new URLSearchParams(location.search);
  const token = params.get('token');

  useEffect(() => {
    if (token) {
      setSuccess(true);
      // 2 saniye sonra login sayfasına yönlendir
      setTimeout(() => navigate('/login'), 2000);
    } else {
      setError('Geçersiz veya eksik token.');
    }
  }, [token, navigate]);

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, p: 4, boxShadow: 2, borderRadius: 2, bgcolor: 'background.paper' }}>
        <Typography variant="h4" gutterBottom>
          Şifre Sıfırla
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>Şifreniz başarıyla sıfırlandı! Giriş sayfasına yönlendiriliyorsunuz...</Alert>}
      </Box>
    </Container>
  );
};

export default ResetPassword; 