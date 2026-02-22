import { useState } from 'react';
import type { ChangeEvent, FocusEvent, FormEvent } from 'react';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  Link,
  CircularProgress,
  Grid,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Person,
  Email,
  Lock,
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { registerUser } from '../../store/auth/register/registerThunks';
import { clearError } from '../../store/auth/authSlice';
import { t } from '../../utils/translations';
import { useFormValidation, registerSchema } from '../../utils/validation';
import GoogleLoginButton from '../../components/auth/GoogleLoginButton';
import axios, { type AxiosError } from 'axios';
import { showErrorToast } from '../../utils/notificationUtils';
import { getCurrentUser } from '../../store/auth/authThunks';

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector(state => state.auth);
  const { currentLanguage } = useAppSelector(state => state.language);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const { validateForm, handleBlur, handleChange, isFormValid, getFieldError, validateField, touched } =
    useFormValidation(registerSchema);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      void handleChange(name, value, updated);
      
      // If password changed and confirmPassword is touched, re-validate confirmPassword
      if (name === 'password' && touched['confirmPassword']) {
        void validateField('confirmPassword', updated.confirmPassword, updated);
      }
      // If confirmPassword changed and password is touched, we already validated it above
      
      return updated;
    });
  };

  const handleInputBlur = (e: FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    void handleBlur(name, value, formData);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void (async () => {
      // Clear any previous errors
      dispatch(clearError());

      const isValid = await validateForm(formData);
      if (!isValid) return;

      const userData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
      };

      try {
        await dispatch(registerUser(userData)).unwrap();
        // Auth state güncellendi; garanti olsun diye current user'ı çek ve yönlendir
        await dispatch(getCurrentUser()).unwrap();
        navigate('/');
      } catch (err: unknown) {
        const msg =
          typeof err === 'string'
            ? err
            : err instanceof Error
              ? err.message
              : undefined;
        if (msg) showErrorToast(msg);
      }
    })();
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleClickShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleGoogleRegister = async (credential: string) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/auth/registerGoogle`,
        { token: credential }
      );
      // JWT'yi kaydet
      const { access_token } = response.data as { access_token: string };
      localStorage.setItem('access_token', access_token);
      // Kullanıcı bilgisini güncelle
      await dispatch(getCurrentUser()).unwrap();
      navigate('/');
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      const errorMessage =
        axiosErr.response?.data?.message || 'Google ile kayıt başarısız oldu.';
      showErrorToast(errorMessage);
    }
  };

  return (
    <Container component="main" maxWidth="sm">
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
            {t('register_title', currentLanguage)}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box
            component="form"
            onSubmit={(e) => handleSubmit(e)}
            sx={{ mt: 1, width: '100%' }}
          >
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="firstName"
                  label={t('first_name', currentLanguage)}
                  name="firstName"
                  autoComplete="given-name"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  error={!!getFieldError('firstName')}
                  helperText={getFieldError('firstName')}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person />
                      </InputAdornment>
                    ),
                  }}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  inputProps={{
                    'data-secure': 'true',
                    'data-no-inspect': 'true',
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="lastName"
                  label={t('last_name', currentLanguage)}
                  name="lastName"
                  autoComplete="family-name"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  error={!!getFieldError('lastName')}
                  helperText={getFieldError('lastName')}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person />
                      </InputAdornment>
                    ),
                  }}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  inputProps={{
                    'data-secure': 'true',
                    'data-no-inspect': 'true',
                  }}
                />
              </Grid>
            </Grid>

            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label={t('email_address', currentLanguage)}
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              type="email"
              error={!!getFieldError('email')}
              helperText={getFieldError('email')}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email />
                  </InputAdornment>
                ),
              }}
              InputLabelProps={{
                shrink: true,
              }}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label={t('password', currentLanguage)}
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              error={!!getFieldError('password')}
              helperText={getFieldError('password')}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              InputLabelProps={{
                shrink: true,
              }}
              inputProps={{
                'data-secure': 'true',
                'data-no-inspect': 'true',
                'data-protected': 'true',
                'data-mask': 'true',
              }}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label={t('confirm_password', currentLanguage)}
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              error={!!getFieldError('confirmPassword')}
              helperText={getFieldError('confirmPassword')}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowConfirmPassword}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              // InputLabelProps={{
              //   shrink: true,
              // }}
              inputProps={{
                'data-secure': 'true',
                'data-no-inspect': 'true',
                'data-protected': 'true',
                'data-mask': 'true',
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading || !isFormValid}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                t('register_button', currentLanguage)
              )}
            </Button>

            {/* Google ile Kayıt */}
            <GoogleLoginButton
              onSuccess={(credential) => {
                void handleGoogleRegister(credential);
              }}
              onError={() => {
                showErrorToast(t('google_register_failed', currentLanguage) || 'Google ile kayıt başarısız oldu.');
              }}
              text="signup_with"
            />

            <Box sx={{ textAlign: 'center' }}>
              <Link component={RouterLink} to="/login" variant="body2">
                {t('have_account', currentLanguage)}
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register;
