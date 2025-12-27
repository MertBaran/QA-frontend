import { ErrorBoundary as SentryErrorBoundary } from '@sentry/react';
import { Box, Typography, Button, Paper, Container } from '@mui/material';
import { Refresh, BugReport } from '@mui/icons-material';
import { ReactNode } from 'react';

interface ErrorFallbackProps {
  error?: Error;
  resetError: () => void;
}

// Error Fallback Component
const ErrorFallback = ({ error, resetError }: ErrorFallbackProps) => {
  return (
    <Container maxWidth="md">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          textAlign: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            maxWidth: 600,
            width: '100%',
          }}
        >
          <BugReport sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />

          <Typography variant="h4" gutterBottom color="error.main">
            Bir Hata Oluştu
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Beklenmeyen bir hata oluştu. Lütfen sayfayı yenilemeyi deneyin.
          </Typography>

          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Hata Detayları:
            </Typography>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                backgroundColor: 'grey.50',
                maxHeight: 200,
                overflow: 'auto',
                textAlign: 'left',
              }}
            >
              <Typography
                variant="caption"
                component="pre"
                sx={{ fontFamily: 'monospace' }}
              >
                {error?.message || 'Bilinmeyen hata'}
              </Typography>
            </Paper>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={resetError}
              sx={{ minWidth: 120 }}
            >
              Sayfayı Yenile
            </Button>

            <Button
              variant="outlined"
              onClick={() => (window.location.href = '/')}
              sx={{ minWidth: 120 }}
            >
              Ana Sayfaya Git
            </Button>
          </Box>

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 2, display: 'block' }}
          >
            Hata otomatik olarak kaydedildi ve geliştirici ekibimize bildirildi.
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (props: ErrorFallbackProps) => React.ReactElement;
}

// Main Error Boundary Component
const ErrorBoundary = ({ children, fallback = ErrorFallback }: ErrorBoundaryProps) => {
  return (
    <SentryErrorBoundary fallback={fallback}>{children}</SentryErrorBoundary>
  );
};

export default ErrorBoundary;
