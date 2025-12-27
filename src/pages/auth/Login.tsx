import { useState } from 'react';
import { Box, Container, Paper, TextField, Button, Typography, Link, FormControlLabel, Checkbox } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { loginUser } from '../../store/auth/login/loginThunks';
import { checkAdminPermissions } from '../../store/auth/authThunks';
import { clearError } from '../../store/auth/authSlice';
import { t } from '../../utils/translations';
import { useFormValidation, loginSchema } from '../../utils/validation';
import SecurePasswordField from '../../components/auth/SecurePasswordField';
import { ButtonLoading } from '../../components/ui/Loading';
import { ErrorAlert } from '../../components/error/ErrorDisplay';
import {
  handleError,
  isNetworkError,
  isServerError,
} from '../../utils/errorHandling/enhancedErrorHandler';
import logger from '../../utils/logger';
import GoogleLoginButton from '../../components/auth/GoogleLoginButton';
import ReCaptchaComponent from '../../components/auth/ReCaptcha';
import axios from 'axios';
import { getCurrentUser } from '../../store/auth/authThunks';
import magnefiteBackgroundVideo from '../../asset/videos/vid_ebru.mp4';

const Login = () => {
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);
  const { currentLanguage } = useAppSelector(state => state.language);
  const navigate = useNavigate();
  const { mode, name: themeName } = useAppSelector(state => state.theme);
  const isMagnefite = themeName === 'magnefite';

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaError, setCaptchaError] = useState(false);

  const [retryCount, setRetryCount] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

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

  const handleCaptchaVerify = (token: string | null) => {
    setCaptchaToken(token);
    setCaptchaError(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Clear any previous errors
    dispatch(clearError());
    setCaptchaError(false);

    const isValid = await validateForm(formData);

    // reCAPTCHA kontrolü
    if (!captchaToken) {
      setCaptchaError(true);
      return;
    }

    if (isValid) {
      try {
        // Remember me ve captcha bilgisini ekle
        const loginData = {
          ...formData,
          rememberMe,
          captchaToken
        };
        
        await dispatch(loginUser(loginData)).unwrap();
        logger.user.action('login_successful');
        
        // Login başarılı olduktan sonra admin permission check
        try {
          const adminResult = await dispatch(checkAdminPermissions()).unwrap();
          
          if (adminResult.hasAdminPermission) {
            // Admin ise admin dashboard'a yönlendir
            navigate('/admin/dashboard');
            logger.user.action('admin_login_successful');
          } else {
            // Normal user ise normal dashboard'a yönlendir
            navigate('/dashboard');
            logger.user.action('user_login_successful');
          }
        } catch (adminError) {
          // Admin check başarısız olursa normal dashboard'a yönlendir
          logger.user.action('admin_check_failed', { error: adminError });
          navigate('/dashboard');
        }
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
          error={t('server_error', currentLanguage)}
          onRetry={handleRetry}
          onDismiss={handleDismissError}
        />
      );
    }

    // Default error alert
    return <ErrorAlert error={error} onRetry={handleRetry} onDismiss={handleDismissError} />;
  };

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        py: 8,
      }}
    >
      {isMagnefite && (
        <>
          <Box
            component="video"
            autoPlay
            loop
            muted
            playsInline
            aria-hidden
            src={magnefiteBackgroundVideo}
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: mode === 'dark' ? 'brightness(0.35)' : 'brightness(0.55)',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: mode === 'dark'
                ? 'linear-gradient(180deg, rgba(15, 15, 15, 0.75) 0%, rgba(15, 15, 15, 0.6) 60%, rgba(15, 15, 15, 0.8) 100%)'
                : 'linear-gradient(180deg, rgba(225, 226, 228, 0.82) 0%, rgba(209, 212, 216, 0.78) 50%, rgba(209, 212, 216, 0.9) 100%)',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />
        </>
      )}
      <Container component="main" maxWidth="xs" sx={{ position: 'relative', zIndex: 1 }}>
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
            {t('login_title', currentLanguage)}
          </Typography>

          {/* Enhanced Error Display */}
          {getErrorComponent()}

          {/* Google ile Giriş */}
          <GoogleLoginButton
            onSuccess={handleGoogleLogin}
            onError={() => {
              alert(t('google_login_failed', currentLanguage));
            }}
          />
          <Typography align="center" sx={{ my: 2 }}>{t('or', currentLanguage)}</Typography>

          {/* Retry Count Display */}
          {retryCount > 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ mb: 2 }}>
              {t('retry_count', currentLanguage)}: {retryCount}
            </Typography>
          )}

          <Box component="form" onSubmit={handleSubmit} autoComplete="on" sx={{ mt: 1, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label={t('email_address', currentLanguage)}
              name="email"
              autoComplete="username"
              value={formData.email}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              type="email"
              error={!!getFieldError('email')}
              helperText={getFieldError('email')}
              disabled={loading}
              InputLabelProps={{ //giriş bilgileri tarayıcı tarafından hatırlanıyor ise küçük yapıyor
                shrink: true,
              }}
              inputProps={{
                'data-secure': 'true',
                'data-no-inspect': 'true',
              }}
            />
            <SecurePasswordField
              name="password"
              label={t('password', currentLanguage)}
              value={formData.password}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              error={!!getFieldError('password')}
              helperText={getFieldError('password')}
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword(!showPassword)}
              disabled={loading}
            />
            
            {/* Beni Hatırla Checkbox */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    color="primary"
                  />
                }
                label={t('remember_me', currentLanguage)}
              />
              <Link component={RouterLink} to="/forgot-password" variant="body2">
                {t('forgot_password', currentLanguage)}
              </Link>
            </Box>
            
            {/* reCAPTCHA */}
            <ReCaptchaComponent
              onVerify={handleCaptchaVerify}
              error={captchaError}
              disabled={loading}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading || !isFormValid || !captchaToken}
            >
              {loading ? <ButtonLoading size={24} /> : t('login_button', currentLanguage)}
            </Button>
            <Box sx={{ textAlign: 'center' }}>
              <Link component={RouterLink} to="/register" variant="body2">
                {t('no_account', currentLanguage)}
              </Link>
            </Box>
          </Box>
        </Paper>
        </Box>
      </Container>
    </Box>
  );
};

export default Login;
