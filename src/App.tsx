import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './store';
import AppRoutes from './routes/AppRoutes';
import { lightTheme, darkTheme } from './theme/theme';
import ErrorBoundary from './components/error/ErrorBoundary';
import Loading from './components/ui/Loading';
import { initSentry } from './config/sentry';
import { useAppSelector, useAppDispatch } from './store/hooks';
import { useLanguageDetection } from './hooks/useLanguageDetection';
import { getCurrentUser } from './store/auth/authThunks';
import { useEffect } from 'react';

// Initialize Sentry
initSentry();

function AppContent() {
  const currentTheme = useAppSelector((state) => state.theme.mode);
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const theme = currentTheme === 'dark' ? darkTheme : lightTheme;
  
  // Tarayıcı dilini algıla
  useLanguageDetection();

  // Sayfa yüklendiğinde kullanıcı bilgilerini kontrol et
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && !isAuthenticated) {
      dispatch(getCurrentUser());
    }
  }, [dispatch, isAuthenticated]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router
        future={{
          v7_relativeSplatPath: true,
          v7_startTransition: true,
        }}
      >
        <AppRoutes />
      </Router>
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
