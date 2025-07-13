import {
  Box,
  Alert,
  Typography,
  Button,
  Paper,
  Container,
} from '@mui/material';
import { Refresh, Home, ArrowBack, Report } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import logger from '../../utils/logger';

interface NetworkErrorProps {
  onRetry?: () => void;
  message?: string;
}

// Network Error Component
export const NetworkError = ({
  onRetry,
  message = 'Bağlantı hatası oluştu',
}: NetworkErrorProps) => {
  const navigate = useNavigate();

  const handleRetry = () => {
    logger.user.action('retry_network_error');
    onRetry?.();
  };

  const handleGoHome = () => {
    logger.user.action('go_home_from_network_error');
    navigate('/');
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h5" color="error" gutterBottom>
            🌐 Bağlantı Hatası
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {message}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            İnternet bağlantınızı kontrol edin ve tekrar deneyin.
          </Typography>
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={handleRetry}
            >
              Tekrar Dene
            </Button>
            <Button
              variant="outlined"
              startIcon={<Home />}
              onClick={handleGoHome}
            >
              Ana Sayfa
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

interface ServerErrorProps {
  onRetry?: () => void;
  status?: number;
}

// Server Error Component
export const ServerError = ({ onRetry, status = 500 }: ServerErrorProps) => {
  const navigate = useNavigate();

  const handleRetry = () => {
    logger.user.action('retry_server_error', { status });
    onRetry?.();
  };

  const handleGoBack = () => {
    logger.user.action('go_back_from_server_error');
    navigate(-1);
  };

  const getErrorMessage = (status: number) => {
    switch (status) {
      case 500:
        return 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.';
      case 502:
        return 'Sunucu geçici olarak kullanılamıyor.';
      case 503:
        return 'Sunucu bakımda. Lütfen daha sonra tekrar deneyin.';
      case 504:
        return 'Sunucu yanıt vermiyor. Lütfen tekrar deneyin.';
      default:
        return 'Beklenmeyen bir hata oluştu.';
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h5" color="error" gutterBottom>
            ⚠️ Sunucu Hatası ({status})
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {getErrorMessage(status)}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Hata otomatik olarak kaydedildi ve geliştirici ekibimize bildirildi.
          </Typography>
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={handleRetry}
            >
              Tekrar Dene
            </Button>
            <Button
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={handleGoBack}
            >
              Geri Dön
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

interface NotFoundErrorProps {
  message?: string;
}

// Not Found Error Component
export const NotFoundError = ({ message = 'Sayfa bulunamadı' }: NotFoundErrorProps) => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    logger.user.action('go_home_from_404');
    navigate('/');
  };

  const handleGoBack = () => {
    logger.user.action('go_back_from_404');
    navigate(-1);
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography
            variant="h1"
            color="text.secondary"
            sx={{ fontSize: '4rem', mb: 2 }}
          >
            404
          </Typography>
          <Typography variant="h5" gutterBottom>
            {message}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Aradığınız sayfa mevcut değil veya taşınmış olabilir.
          </Typography>
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <Button
              variant="contained"
              startIcon={<Home />}
              onClick={handleGoHome}
            >
              Ana Sayfa
            </Button>
            <Button
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={handleGoBack}
            >
              Geri Dön
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

interface ValidationErrorProps {
  errors: Record<string, string>;
  onRetry?: () => void;
}

// Validation Error Component
export const ValidationError = ({ errors, onRetry }: ValidationErrorProps) => {
  const handleRetry = () => {
    logger.user.action('retry_validation_error');
    onRetry?.();
  };

  return (
    <Alert severity="error" sx={{ mb: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        Lütfen aşağıdaki hataları düzeltin:
      </Typography>
      <Box component="ul" sx={{ m: 0, pl: 2 }}>
        {Object.entries(errors).map(([field, message]) => (
          <Typography key={field} component="li" variant="body2">
            <strong>{field}:</strong> {message}
          </Typography>
        ))}
      </Box>
      {onRetry && (
        <Button size="small" onClick={handleRetry} sx={{ mt: 1 }}>
          Tekrar Dene
        </Button>
      )}
    </Alert>
  );
};

interface GenericErrorProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  onReport?: () => void;
}

// Generic Error Component
export const GenericError = ({
  title = 'Bir hata oluştu',
  message = 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.',
  onRetry,
  onReport,
}: GenericErrorProps) => {
  const navigate = useNavigate();

  const handleRetry = () => {
    logger.user.action('retry_generic_error');
    onRetry?.();
  };

  const handleReport = () => {
    logger.user.action('report_error');
    onReport?.();
  };

  const handleGoHome = () => {
    logger.user.action('go_home_from_generic_error');
    navigate('/');
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h5" color="error" gutterBottom>
            ❌ {title}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {message}
          </Typography>
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            {onRetry && (
              <Button
                variant="contained"
                startIcon={<Refresh />}
                onClick={handleRetry}
              >
                Tekrar Dene
              </Button>
            )}
            {onReport && (
              <Button
                variant="outlined"
                startIcon={<Report />}
                onClick={handleReport}
              >
                Hatayı Bildir
              </Button>
            )}
            <Button
              variant="outlined"
              startIcon={<Home />}
              onClick={handleGoHome}
            >
              Ana Sayfa
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

interface ErrorAlertProps {
  error: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

// Error Alert Component (for forms)
export const ErrorAlert = ({ error, onRetry, onDismiss }: ErrorAlertProps) => {
  if (!error) return null;

  return (
    <Alert
      severity="error"
      sx={{ mb: 2 }}
      onClose={onDismiss}
      action={
        onRetry && (
          <Button color="inherit" size="small" onClick={onRetry}>
            Tekrar Dene
          </Button>
        )
      }
    >
      {error}
    </Alert>
  );
};

const ErrorDisplay = {
  NetworkError,
  ServerError,
  NotFoundError,
  ValidationError,
  GenericError,
  ErrorAlert,
};

export default ErrorDisplay;
