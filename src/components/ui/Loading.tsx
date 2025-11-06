import {
  Box,
  CircularProgress,
  Typography,
  Backdrop,
  Fade,
  useTheme,
} from '@mui/material';
import { useAppSelector } from '../../store/hooks';
import papyrusGenis2Dark from '../../asset/textures/papyrus_genis_2_dark.png';

// Basic Loading Component
const Loading = ({ message = 'Loading...', size = 'medium' }) => {
  const theme = useTheme();
  const { name: themeName, mode } = useAppSelector(state => state.theme);
  const isPapirus = themeName === 'papirus';
  
  const getSize = () => {
    switch (size) {
      case 'small':
        return 24;
      case 'large':
        return 60;
      default:
        return 40;
    }
  };

  return (
    <Box
      sx={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: 2,
      }}
    >
      {/* Papyrus Background for Loading */}
      {isPapirus && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url(${papyrusGenis2Dark})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: mode === 'dark' ? 0.2 : 0.3,
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
      )}
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <CircularProgress size={getSize()} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          {message}
        </Typography>
      </Box>
    </Box>
  );
};

// Full Screen Loading
export const FullScreenLoading = ({ message = 'Loading application...' }) => {
  const theme = useTheme();
  const { name: themeName, mode } = useAppSelector(state => state.theme);
  const isPapirus = themeName === 'papirus';
  
  return (
    <Box
      sx={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: 2,
      }}
    >
      {/* Papyrus Background for Full Screen Loading */}
      {isPapirus && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url(${papyrusGenis2Dark})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: mode === 'dark' ? 0.2 : 0.3,
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
      )}
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <CircularProgress size={60} />
        <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>
          {message}
        </Typography>
      </Box>
    </Box>
  );
};

// Overlay Loading
export const OverlayLoading = ({ open = false, message = 'Loading...' }) => {
  return (
    <Backdrop
      sx={{
        color: '#fff',
        zIndex: theme => theme.zIndex.drawer + 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
      open={open}
    >
      <CircularProgress color="inherit" />
      <Typography variant="body1" color="inherit">
        {message}
      </Typography>
    </Backdrop>
  );
};

// Inline Loading
export const InlineLoading = ({ message = 'Loading...', size = 'small' }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        py: 1,
      }}
    >
      <CircularProgress size={size === 'small' ? 16 : 20} />
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );
};

// Button Loading
export const ButtonLoading = ({ size = 20 }) => {
  return <CircularProgress size={size} color="inherit" />;
};

// Page Loading with Fade
export const PageLoading = ({ message = 'Loading page...', show = true }) => {
  return (
    <Fade in={show}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          gap: 2,
        }}
      >
        <CircularProgress size={50} />
        <Typography variant="body1" color="text.secondary">
          {message}
        </Typography>
      </Box>
    </Fade>
  );
};

export default Loading;
