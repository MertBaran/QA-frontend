import {
  Box,
  Container,
  Paper,
  Button,
  Typography,
  Grid,
  Alert,
} from '@mui/material';
import {
  handleApiError,
  handleValidationError,
  handleComponentError,
  handleNetworkError,
  handleUserActionError,
  ApiError,
  ValidationError,
  NetworkError,
} from '../utils/errorHandling';

const TestError = () => {
  // Test API Error
  const testApiError = () => {
    try {
      throw new ApiError(
        'API connection failed',
        500,
        undefined,
        {
          url: '/api/test',
          method: 'GET',
        }
      );
    } catch (error) {
      handleApiError(error as import('axios').AxiosError, { action: 'testApi' });
    }
  };

  // Test Validation Error
  const testValidationError = () => {
    try {
      throw new ValidationError('Email is invalid', 'email', 'login');
    } catch (error) {
      handleValidationError(
        error as ValidationError,
        { email: 'invalid-email' },
        { formName: 'login' }
      );
    }
  };

  // Test Component Error
  const testComponentError = () => {
    try {
      throw new Error('Component render failed');
    } catch (error) {
      handleComponentError(error as Error, 'TestComponent', { prop1: 'value1' });
    }
  };

  // Test Network Error
  const testNetworkError = () => {
    try {
      throw new NetworkError('Network connection lost');
    } catch (error) {
      handleNetworkError(error as Error, { action: 'fetchData' });
    }
  };

  // Test User Action Error
  const testUserActionError = () => {
    try {
      throw new Error('User clicked invalid button');
    } catch (error) {
      handleUserActionError(error as Error, 'click_button', {
        userId: '123',
        page: 'test',
      });
    }
  };

  // Test React Error (will trigger Error Boundary)
  const testReactError = () => {
    throw new Error('This is a React component error!');
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Error Handling Test Page
        </Typography>

        <Alert severity="info" sx={{ mb: 3 }}>
          Bu sayfa farklı error senaryolarını test etmek için oluşturuldu.
          Console'u açık tutun ve Sentry dashboard'unu kontrol edin.
        </Alert>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                API Error Test
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                API call error'ını simüle eder
              </Typography>
              <Button variant="contained" onClick={testApiError} fullWidth>
                Test API Error
              </Button>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Validation Error Test
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Form validation error'ını simüle eder
              </Typography>
              <Button
                variant="contained"
                onClick={testValidationError}
                fullWidth
              >
                Test Validation Error
              </Button>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Component Error Test
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                React component error'ını simüle eder
              </Typography>
              <Button
                variant="contained"
                onClick={testComponentError}
                fullWidth
              >
                Test Component Error
              </Button>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Network Error Test
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Network connection error'ını simüle eder
              </Typography>
              <Button variant="contained" onClick={testNetworkError} fullWidth>
                Test Network Error
              </Button>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                User Action Error Test
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                User interaction error'ını simüle eder
              </Typography>
              <Button
                variant="contained"
                onClick={testUserActionError}
                fullWidth
              >
                Test User Action Error
              </Button>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                React Error Boundary Test
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Error Boundary'yi tetikler
              </Typography>
              <Button
                variant="contained"
                color="error"
                onClick={testReactError}
                fullWidth
              >
                Test Error Boundary
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default TestError;
