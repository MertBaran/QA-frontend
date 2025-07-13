import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './store';
import AppRoutes from './routes/AppRoutes';
import theme from './theme/theme';
import ErrorBoundary from './components/error/ErrorBoundary';
import Loading from './components/ui/Loading';
import { initSentry } from './config/sentry';

// Initialize Sentry
initSentry();

function App() {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <PersistGate
          loading={<Loading message="Loading application..." />}
          persistor={persistor}
        >
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
        </PersistGate>
      </Provider>
    </ErrorBoundary>
  );
}

export default App;
