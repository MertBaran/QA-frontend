import { createTheme } from '@mui/material/styles';

// Yeni koyu renk paleti
const darkColors = {
  primary: '#FFB800', // Canlı sarı/turuncu
  secondary: '#0A1A23', // Çok koyu mavi
  background: '#0D1F2A', // Koyu arka plan
  surface: '#152A35', // Orta koyu yüzey
  card: '#1E3A47', // Kart arka planı - daha açık
  text: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.8)',
  textTertiary: 'rgba(255, 255, 255, 0.6)',
  border: 'rgba(255, 184, 0, 0.2)',
  divider: 'rgba(255, 255, 255, 0.1)',
};

const lightColors = {
  primary: '#FFB800', // Canlı sarı/turuncu
  secondary: '#F8FAFC', // Çok hafif gri-mavi
  background: '#FAFBFC', // Çok hafif gri arka plan
  surface: '#FFFFFF', // Beyaz yüzey
  card: '#F8FAFC', // Hafif gri kart arka planı
  text: '#1A202C', // Koyu gri metin
  textSecondary: '#4A5568', // Orta gri ikincil metin
  textTertiary: '#718096', // Açık gri üçüncül metin
  border: 'rgba(255, 184, 0, 0.2)',
  divider: 'rgba(0, 0, 0, 0.08)',
};

// Koyu tema
export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: darkColors.primary,
      light: '#FFD54F',
      dark: '#FF8F00',
      contrastText: '#000000',
    },
    secondary: {
      main: darkColors.secondary,
      light: '#152A35',
      dark: '#061218',
      contrastText: '#ffffff',
    },
    background: {
      default: darkColors.background,
      paper: darkColors.surface,
    },
    text: {
      primary: darkColors.text,
      secondary: darkColors.textSecondary,
    },
    success: {
      main: '#FFB800',
      light: '#FFD54F',
      dark: '#FF8F00',
    },
    warning: {
      main: '#FF6B35',
      light: '#FF8A65',
      dark: '#E64A19',
    },
    error: {
      main: '#FF3B30',
      light: '#FF6B6B',
      dark: '#D32F2F',
    },
    info: {
      main: '#0066CC',
      light: '#4D94FF',
      dark: '#004499',
    },
  },
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontSize: '3rem',
      fontWeight: 700,
      lineHeight: 1.2,
      background: 'linear-gradient(135deg, #FFB800 0%, #FF8F00 100%)',
      backgroundClip: 'text',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    },
    h2: {
      fontSize: '2.25rem',
      fontWeight: 700,
      lineHeight: 1.3,
      color: darkColors.text,
    },
    h3: {
      fontSize: '1.875rem',
      fontWeight: 600,
      lineHeight: 1.3,
      color: darkColors.text,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
      color: darkColors.text,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
      color: darkColors.text,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.4,
      color: darkColors.text,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
      color: darkColors.textSecondary,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
      color: darkColors.textSecondary,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          fontWeight: 600,
          textTransform: 'none',
        },
        contained: {
          background: 'linear-gradient(135deg, #FFB800 0%, #FF8F00 100%)',
          color: 'white',
          boxShadow: '0 4px 12px rgba(255, 184, 0, 0.3)',
          '&:hover': {
            background: 'linear-gradient(135deg, #FFD54F 0%, #FFB800 100%)',
            boxShadow: '0 6px 16px rgba(255, 184, 0, 0.4)',
          },
        },
        outlined: {
          borderColor: 'rgba(255, 184, 0, 0.5)',
          color: '#FFB800',
          '&:hover': {
            borderColor: '#FFB800',
            background: 'rgba(255, 184, 0, 0.1)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '&:hover fieldset': {
              borderColor: 'rgba(255, 184, 0, 0.5)',
            },
            '&.Mui-focused fieldset': {
              borderColor: 'rgba(255, 184, 0, 0.8)',
            },
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          '&:hover': {
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, #0A1A23 0%, #152A35 100%)',
          borderBottom: '1px solid rgba(255, 184, 0, 0.2)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, #FFB800 0%, #FF8F00 100%)',
          color: 'white',
          '&:hover': {
            background: 'linear-gradient(135deg, #FFD54F 0%, #FFB800 100%)',
          },
        },
      },
    },
  },
});

// Açık tema
export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: lightColors.primary,
      light: '#FFD54F',
      dark: '#FF8F00',
      contrastText: '#000000',
    },
    secondary: {
      main: '#001E2B',
      light: '#003A4F',
      dark: '#001219',
      contrastText: '#ffffff',
    },
    background: {
      default: lightColors.background,
      paper: lightColors.surface,
    },
    text: {
      primary: lightColors.text,
      secondary: lightColors.textSecondary,
    },
    divider: lightColors.divider,
    success: {
      main: '#FFB800',
      light: '#FFD54F',
      dark: '#FF8F00',
    },
    warning: {
      main: '#FF6B35',
      light: '#FF8A65',
      dark: '#E64A19',
    },
    error: {
      main: '#FF3B30',
      light: '#FF6B6B',
      dark: '#D32F2F',
    },
    info: {
      main: '#0066CC',
      light: '#4D94FF',
      dark: '#004499',
    },
  },
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontSize: '3rem',
      fontWeight: 700,
      lineHeight: 1.2,
      background: 'linear-gradient(135deg, #FFB800 0%, #FF8F00 100%)',
      backgroundClip: 'text',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    },
    h2: {
      fontSize: '2.25rem',
      fontWeight: 700,
      lineHeight: 1.3,
      color: lightColors.text,
    },
    h3: {
      fontSize: '1.875rem',
      fontWeight: 600,
      lineHeight: 1.3,
      color: lightColors.text,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
      color: lightColors.text,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
      color: lightColors.text,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.4,
      color: lightColors.text,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
      color: lightColors.textSecondary,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
      color: lightColors.textSecondary,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          fontWeight: 600,
          textTransform: 'none',
        },
        contained: {
          background: 'linear-gradient(135deg, #FFB800 0%, #FF8F00 100%)',
          color: 'white',
          boxShadow: '0 4px 12px rgba(255, 184, 0, 0.3)',
          '&:hover': {
            background: 'linear-gradient(135deg, #FFD54F 0%, #FFB800 100%)',
            boxShadow: '0 6px 16px rgba(255, 184, 0, 0.4)',
          },
        },
        outlined: {
          borderColor: 'rgba(255, 184, 0, 0.5)',
          color: '#FFB800',
          '&:hover': {
            borderColor: '#FFB800',
            background: 'rgba(255, 184, 0, 0.1)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '&:hover fieldset': {
              borderColor: 'rgba(255, 184, 0, 0.5)',
            },
            '&.Mui-focused fieldset': {
              borderColor: 'rgba(255, 184, 0, 0.8)',
            },
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          backgroundColor: lightColors.surface,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(0, 0, 0, 0.05)',
          backgroundColor: lightColors.card,
          '&:hover': {
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
          color: lightColors.text,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, #FFB800 0%, #FF8F00 100%)',
          color: 'white',
          '&:hover': {
            background: 'linear-gradient(135deg, #FFD54F 0%, #FFB800 100%)',
          },
        },
      },
    },
  },
});

// Varsayılan tema (açık)
const theme = lightTheme;

export default theme;
