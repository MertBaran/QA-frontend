import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { Provider } from 'react-redux';
import { store } from './store';
import AppRoutes from './routes/AppRoutes';
import theme from './theme/theme';
import ErrorBoundary from './components/error/ErrorBoundary';
import { initSentry } from './config/sentry';

// Initialize Sentry
initSentry();

function App() {
  return (
    <ErrorBoundary>
      <Provider store={store}>
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
      </Provider>
    </ErrorBoundary>
  );
}

export default App;
