import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, GlobalStyles } from '@mui/material';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './store';
import AppRoutes from './routes/AppRoutes';
import { getTheme } from './theme/theme';
import ErrorBoundary from './components/error/ErrorBoundary';
import Loading from './components/ui/Loading';
import ConfirmDialog from './components/ui/ConfirmDialog';
import { initSentry } from './config/sentry';
import { useAppSelector, useAppDispatch } from './store/hooks';
import { useLanguageDetection } from './hooks/useLanguageDetection';
import { getCurrentUser } from './store/auth/authThunks';
import { useEffect } from 'react';
import { getStoredToken } from './utils/tokenUtils';
import { useBackendHealth } from './hooks/useBackendHealth';
import MaintenanceScreen from './components/ui/MaintenanceScreen';

// Initialize Sentry
initSentry();

function AppContent() {
  const { name: themeName, mode } = useAppSelector((state) => state.theme);
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const backendIsUp = useAppSelector((state) => state.backendStatus.isUp);
  const dispatch = useAppDispatch();
  const theme = getTheme(themeName, mode);

  useBackendHealth();

  // Tarayıcı dilini algıla
  useLanguageDetection();

  // Sayfa yüklendiğinde kullanıcı bilgilerini kontrol et
  useEffect(() => {
    const token = getStoredToken();
    if (token && !isAuthenticated) {
      void dispatch(getCurrentUser());
    }
  }, [dispatch, isAuthenticated]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {!backendIsUp ? (
        <MaintenanceScreen />
      ) : (
        <>
      <GlobalStyles
        styles={{
          '@global': {
            'html, body, #root': {
              fontFamily: `${theme.typography.fontFamily} !important`,
            },
            '*, *::before, *::after': {
              fontFamily: `${theme.typography.fontFamily} !important`,
            },
            'body *, html *, #root *': {
              fontFamily: `${theme.typography.fontFamily} !important`,
            },
            // Tarayıcı autocomplete stilleri - Tema ile uyumlu
            'input:-webkit-autofill, input:-webkit-autofill:hover, input:-webkit-autofill:focus, input:-webkit-autofill:active': {
              WebkitBoxShadow: mode === 'dark' 
                ? `0 0 0 30px ${theme.palette.background.paper} inset !important`
                : `0 0 0 30px ${theme.palette.background.paper} inset !important`,
              WebkitTextFillColor: mode === 'dark'
                ? theme.palette.text.primary
                : theme.palette.text.primary,
              borderRadius: '4px', // Daha az yuvarlak
              transition: 'background-color 5000s ease-in-out 0s',
            },
            'textarea:-webkit-autofill, textarea:-webkit-autofill:hover, textarea:-webkit-autofill:focus, textarea:-webkit-autofill:active': {
              WebkitBoxShadow: mode === 'dark' 
                ? `0 0 0 30px ${theme.palette.background.paper} inset !important`
                : `0 0 0 30px ${theme.palette.background.paper} inset !important`,
              WebkitTextFillColor: mode === 'dark'
                ? theme.palette.text.primary
                : theme.palette.text.primary,
              borderRadius: '4px', // Daha az yuvarlak
              transition: 'background-color 5000s ease-in-out 0s',
            },
            'select:-webkit-autofill, select:-webkit-autofill:hover, select:-webkit-autofill:focus, select:-webkit-autofill:active': {
              WebkitBoxShadow: mode === 'dark' 
                ? `0 0 0 30px ${theme.palette.background.paper} inset !important`
                : `0 0 0 30px ${theme.palette.background.paper} inset !important`,
              WebkitTextFillColor: mode === 'dark'
                ? theme.palette.text.primary
                : theme.palette.text.primary,
              borderRadius: '4px', // Daha az yuvarlak
              transition: 'background-color 5000s ease-in-out 0s',
            },
            // MUI InputBase için özel stiller
            '.MuiInputBase-input:-webkit-autofill, .MuiInputBase-input:-webkit-autofill:hover, .MuiInputBase-input:-webkit-autofill:focus, .MuiInputBase-input:-webkit-autofill:active': {
              WebkitBoxShadow: mode === 'dark' 
                ? `0 0 0 30px ${theme.palette.background.paper} inset !important`
                : `0 0 0 30px ${theme.palette.background.paper} inset !important`,
              WebkitTextFillColor: mode === 'dark'
                ? theme.palette.text.primary
                : theme.palette.text.primary,
              borderRadius: '4px', // Daha az yuvarlak
              transition: 'background-color 5000s ease-in-out 0s',
            },
            // MUI TextField için özel stiller
            '.MuiTextField-root input:-webkit-autofill, .MuiTextField-root input:-webkit-autofill:hover, .MuiTextField-root input:-webkit-autofill:focus, .MuiTextField-root input:-webkit-autofill:active': {
              WebkitBoxShadow: mode === 'dark' 
                ? `0 0 0 30px ${theme.palette.background.paper} inset !important`
                : `0 0 0 30px ${theme.palette.background.paper} inset !important`,
              WebkitTextFillColor: mode === 'dark'
                ? theme.palette.text.primary
                : theme.palette.text.primary,
              borderRadius: '4px', // Daha az yuvarlak
              transition: 'background-color 5000s ease-in-out 0s',
            },
            // Tarayıcı autocomplete dropdown stilleri (Chrome/Safari)
            'input::-webkit-list-button': {
              borderRadius: '4px', // Daha az yuvarlak
            },
            'input::-webkit-calendar-picker-indicator': {
              borderRadius: '4px', // Daha az yuvarlak
            },
            // react-markdown-editor-lite: .sec-md .input color:#333 override (karanlık modda okunabilirlik)
            '#root .rc-md-editor .editor-container .sec-md .input': {
              color: `${theme.palette.text.primary} !important`,
              backgroundColor: `${theme.palette.background.paper} !important`,
            },
            '#root .rc-md-editor .editor-container .sec-html .html-wrap': {
              color: `${theme.palette.text.primary} !important`,
            },
          },
        }}
      />
      <ConfirmDialog />
      <Router
        future={{
          v7_relativeSplatPath: true,
          v7_startTransition: true,
        }}
      >
        <AppRoutes />
      </Router>
        </>
      )}
    </ThemeProvider>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <PersistGate
          loading={<Loading message="Loading application..." />}
          persistor={persistor}
        >
          <AppContent />
        </PersistGate>
      </Provider>
    </ErrorBoundary>
  );
}

export default App;
