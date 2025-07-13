import { useState } from 'react';
import { Box, Container, Paper, TextField, Button, Typography, Link } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { loginUser } from '../../store/auth/login/loginThunks';
import { clearError } from '../../store/auth/authSlice';
import { useFormValidation, loginSchema } from '../../utils/validation';
import { ButtonLoading } from '../../components/ui/Loading';
import { ErrorAlert } from '../../components/error/ErrorDisplay';
import {
  handleError,
  isNetworkError,
  isServerError,
} from '../../utils/errorHandling/enhancedErrorHandler';
import logger from '../../utils/logger';
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { getCurrentUser } from '../../store/auth/authThunks';

const Login = () => {
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [retryCount, setRetryCount] = useState(0);

  const { validateForm, handleBlur, handleChange, isFormValid, getFieldError } =
    useFormValidation(loginSchema);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    handleChange(name, value);
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    handleBlur(name, value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Clear any previous errors
    dispatch(clearError());

    const isValid = await validateForm(formData);

    if (isValid) {
      try {
        await dispatch(loginUser(formData)).unwrap();
        logger.user.action('login_successful');
      } catch (error) {
        // Enhanced error handling
        const errorInfo = await handleError(error, {
          action: 'login',
          email: formData.email,
        });

        logger.user.action('login_failed', {
          errorType: errorInfo.type,
          retryCount,
        });

        // Increment retry count
        setRetryCount((prev) => prev + 1);
      }
    }
  };

  const handleRetry = () => {
    logger.user.action('login_retry', { retryCount });
    // handleSubmit fonksiyonunun içeriğini tekrar çağır
    dispatch(clearError());
    validateForm(formData).then(isValid => {
      if (isValid) {
        dispatch(loginUser(formData))
          .unwrap()
          .then(() => {
            logger.user.action('login_successful');
          })
          .catch(async (error: any) => {
            const errorInfo = await handleError(error, {
              action: 'login',
              email: formData.email,
            });
            logger.user.action('login_failed', {
              errorType: errorInfo.type,
              retryCount: retryCount + 1,
            });
            setRetryCount(prev => prev + 1);
          });
      }
    });
  };

  const handleDismissError = () => {
    dispatch(clearError());
    setRetryCount(0);
  };

  const handleGoogleLogin = async (credential: string) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/auth/loginGoogle`,
        { token: credential }
      );
      // JWT'yi kaydet
      const { access_token } = response.data;
      localStorage.setItem('token', access_token);
      // Kullanıcı bilgisini güncelle
      await dispatch(getCurrentUser());
      navigate('/');
    } catch (err: any) {
      console.log(err);
      alert(
        err.response?.data?.message || 'Google ile giriş başarısız oldu.'
      );
    }
  };

  // Get error component based on error type
  const getErrorComponent = () => {
    if (!error) return null;

    // Check if it's a network error
    if (isNetworkError({ message: error })) {
      return (
        <ErrorAlert
          error="Bağlantı hatası oluştu. İnternet bağlantınızı kontrol edin."
          onRetry={handleRetry}
          onDismiss={handleDismissError}
        />
      );
    }

    // Check if it's a server error
    if (isServerError({ message: error })) {
      return (
        <ErrorAlert
          error="Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin."
          onRetry={handleRetry}
          onDismiss={handleDismissError}
        />
      );
    }

    // Default error alert
    return <ErrorAlert error={error} onRetry={handleRetry} onDismiss={handleDismissError} />;
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Typography component="h1" variant="h4" gutterBottom>
            Giriş Yap
          </Typography>

          {/* Enhanced Error Display */}
          {getErrorComponent()}

          {/* Google ile Giriş */}
          <Box sx={{ width: '100%', my: 2 }}>
            <GoogleLogin
              onSuccess={async credentialResponse => {
                if (credentialResponse.credential) {
                  await handleGoogleLogin(credentialResponse.credential);
                }
              }}
              onError={() => {
                alert('Google ile giriş başarısız oldu.');
              }}
              width="100%"
            />
          </Box>
          <Typography align="center" sx={{ my: 2 }}>veya</Typography>

          {/* Retry Count Display */}
          {retryCount > 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ mb: 2 }}>
              Deneme sayısı: {retryCount}
            </Typography>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Adresi"
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              type="email"
              error={!!getFieldError('email')}
              helperText={getFieldError('email')}
              disabled={loading}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Şifre"
              type="password"
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              error={!!getFieldError('password')}
              helperText={getFieldError('password')}
              disabled={loading}
            />
            <Box sx={{ textAlign: 'right', mb: 1 }}>
              <Link component={RouterLink} to="/forgot-password" variant="body2">
                Şifremi Unuttum?
              </Link>
            </Box>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading || !isFormValid}
            >
              {loading ? <ButtonLoading size={24} /> : 'Giriş Yap'}
            </Button>
            <Box sx={{ textAlign: 'center' }}>
              <Link component={RouterLink} to="/register" variant="body2">
                {'Hesabınız yok mu? Kayıt olun'}
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;
