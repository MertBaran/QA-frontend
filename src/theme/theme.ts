import { createTheme, Theme } from '@mui/material/styles';
import papyrusTexture from '../asset/textures/papyrus_horizontal_2.png';

// Papyrus texture with real aged paper image - creates authentic vintage paper effect
const getPaperTexture = (mode: 'light' | 'dark') => {
  return {
    position: 'relative' as const,
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundImage: `url(${papyrusTexture})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      opacity: mode === 'dark' ? 0.15 : 0.25,
      pointerEvents: 'none',
      zIndex: 0,
    },
    '& > *': {
      position: 'relative',
      zIndex: 1,
    },
  };
};

// Base theme configuration helper
const createBaseThemeConfig = (
  palette: any,
  typographyColors: any,
  themeName: string,
  negativeColor?: string,
  positiveColor?: string,
) => {
  const isPapirus = themeName === 'papirus';
  const isMagnefite = themeName === 'magnefite';

  // Theme-specific font families
  let fontFamily: string;
  let headingFontFamily: string;
  if (isPapirus) {
    // Vintage serif font for Papirus theme
    fontFamily = ['"Georgia"', '"Times New Roman"', 'Times', 'serif'].join(',');
    headingFontFamily = fontFamily;
  } else if (isMagnefite) {
    // Ultra-modern rounded font for Magnefite theme - distinctive, soft edges, no sharp corners
    fontFamily = [
      '"Geist Sans Neue"', // Modern rounded font
      '"Quicksand"',
      '"Varela Round"',
      '"Manrope"',
      '"Nunito"',
      '"Poppins"',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(',');
    headingFontFamily = [
      '"Space Grotesk"',
      '"Geist Sans Neue"',
      '"Sora"',
      '"Quicksand"',
      '"Varela Round"',
      '"Manrope"',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(',');
  } else {
    // Modern sans-serif for Molume theme
    fontFamily = [
      '"Inter"',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(',');
    headingFontFamily = fontFamily;
  }

  // Add negative and positive colors to palette as custom properties
  const enhancedPalette = {
    ...palette,
    custom: {
      negative: negativeColor || palette.error.main,
      positive: positiveColor || palette.success.main,
    },
  };

  return {
    palette: enhancedPalette,
    typography: {
      fontFamily,
      h1: {
        fontSize: '3rem',
        fontWeight: 700,
        lineHeight: 1.2,
        fontFamily: headingFontFamily,
        background:
          palette.mode === 'dark'
            ? `linear-gradient(135deg, ${palette.primary.main} 0%, ${palette.primary.dark} 100%)`
            : `linear-gradient(135deg, ${palette.primary.main} 0%, ${palette.primary.dark} 100%)`,
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      },
      h2: {
        fontSize: '2.25rem',
        fontWeight: 700,
        lineHeight: 1.3,
        fontFamily: headingFontFamily,
        color: typographyColors.text,
      },
      h3: {
        fontSize: '1.875rem',
        fontWeight: 600,
        lineHeight: 1.3,
        fontFamily: headingFontFamily,
        color: typographyColors.text,
      },
      h4: {
        fontSize: '1.5rem',
        fontWeight: 600,
        lineHeight: 1.4,
        fontFamily: headingFontFamily,
        color: typographyColors.text,
      },
      h5: {
        fontSize: '1.25rem',
        fontWeight: 600,
        lineHeight: 1.4,
        fontFamily: headingFontFamily,
        color: typographyColors.text,
      },
      h6: {
        fontSize: '1rem',
        fontWeight: 600,
        lineHeight: 1.4,
        fontFamily: headingFontFamily,
        color: typographyColors.text,
      },
      body1: {
        fontSize: '1rem',
        lineHeight: 1.6,
        color: typographyColors.textSecondary,
      },
      body2: {
        fontSize: '0.875rem',
        lineHeight: 1.6,
        color: typographyColors.textSecondary,
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
      MuiCssBaseline: {
        styleOverrides: {
          // Font family will be set via GlobalStyles in App.tsx
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            fontWeight: 600,
            textTransform: 'none',
            fontFamily: fontFamily,
          },
          contained: {
            background: `linear-gradient(135deg, ${palette.primary.main} 0%, ${palette.primary.dark} 100%)`,
            color: palette.primary.contrastText || 'white',
            boxShadow:
              palette.mode === 'dark'
                ? `0 4px 12px ${palette.primary.main}33`
                : `0 4px 12px ${palette.primary.main}33`,
            '&:hover': {
              background: `linear-gradient(135deg, ${palette.primary.light} 0%, ${palette.primary.main} 100%)`,
              boxShadow:
                palette.mode === 'dark'
                  ? `0 6px 16px ${palette.primary.main}66`
                  : `0 6px 16px ${palette.primary.main}66`,
            },
          },
          outlined: {
            borderColor: `${palette.primary.main}80`,
            color: palette.primary.main,
            '&:hover': {
              borderColor: palette.primary.main,
              background: `${palette.primary.main}1A`,
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: isMagnefite ? typographyColors.border : undefined,
              },
              '&:hover fieldset': {
                borderColor: isMagnefite ? typographyColors.border : `${palette.primary.main}80`,
              },
              '&.Mui-focused fieldset': {
                borderColor: isMagnefite ? typographyColors.border : `${palette.primary.main}CC`,
              },
            },
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: isMagnefite ? typographyColors.border : undefined,
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: isMagnefite ? typographyColors.border : `${palette.primary.main}80`,
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: isMagnefite ? typographyColors.border : `${palette.primary.main}CC`,
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            boxShadow:
              palette.mode === 'dark'
                ? '0 4px 20px rgba(0, 0, 0, 0.15)'
                : '0 4px 20px rgba(0, 0, 0, 0.08)',
            ...(isPapirus ? getPaperTexture(palette.mode as 'light' | 'dark') : {}),
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow:
              palette.mode === 'dark'
                ? '0 4px 20px rgba(0, 0, 0, 0.15)'
                : '0 4px 20px rgba(0, 0, 0, 0.08)',
            border:
              palette.mode === 'dark'
                ? `1px solid ${typographyColors.border}`
                : `1px solid ${typographyColors.border}`,
            ...(isPapirus ? getPaperTexture(palette.mode as 'light' | 'dark') : {}),
            '&:hover': {
              boxShadow:
                palette.mode === 'dark'
                  ? '0 8px 32px rgba(0, 0, 0, 0.25)'
                  : '0 8px 32px rgba(0, 0, 0, 0.12)',
            },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            background:
              palette.mode === 'dark'
                ? `linear-gradient(135deg, ${palette.background.default} 0%, ${palette.background.paper} 100%)`
                : `linear-gradient(135deg, ${palette.background.paper} 0%, ${palette.background.default} 100%)`,
            borderBottom: `1px solid ${typographyColors.border}`,
            color: typographyColors.text,
            ...(isPapirus ? getPaperTexture(palette.mode as 'light' | 'dark') : {}),
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            fontFamily: fontFamily,
          },
        },
      },
      MuiFab: {
        styleOverrides: {
          root: {
            background: `linear-gradient(135deg, ${palette.primary.main} 0%, ${palette.primary.dark} 100%)`,
            color: palette.primary.contrastText || 'white',
            fontFamily: fontFamily,
            '&:hover': {
              background: `linear-gradient(135deg, ${palette.primary.light} 0%, ${palette.primary.main} 100%)`,
            },
          },
        },
      },
      MuiTypography: {
        styleOverrides: {
          root: {
            fontFamily: fontFamily,
          },
        },
      },
      MuiInputBase: {
        styleOverrides: {
          root: {
            fontFamily: fontFamily,
          },
        },
      },
    },
  };
};

// ==================== MOLUME THEMES ====================

// Molume Dark (existing - unchanged)
const molumeDarkColors = {
  primary: '#FFB800',
  secondary: '#0A1A23',
  background: '#0D1F2A',
  surface: '#152A35',
  card: '#1E3A47',
  text: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.8)',
  textTertiary: 'rgba(255, 255, 255, 0.6)',
  border: 'rgba(255, 184, 0, 0.2)',
  divider: 'rgba(255, 255, 255, 0.1)',
};

export const molumeDarkTheme = createTheme(
  createBaseThemeConfig(
    {
      mode: 'dark',
      primary: {
        main: molumeDarkColors.primary,
        light: '#FFD54F',
        dark: '#FF8F00',
        contrastText: '#000000',
      },
      secondary: {
        main: molumeDarkColors.secondary,
        light: '#152A35',
        dark: '#061218',
        contrastText: '#ffffff',
      },
      background: {
        default: molumeDarkColors.background,
        paper: molumeDarkColors.surface,
      },
      text: {
        primary: molumeDarkColors.text,
        secondary: molumeDarkColors.textSecondary,
      },
      success: {
        main: '#00ED64',
        light: '#00FF6B',
        dark: '#00C853',
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
    molumeDarkColors,
    'molume',
    '#FF3B30', // negative (red)
    '#00ED64', // positive (green)
  ) as any,
);

// Molume Light (new - bone-like texture)
const molumeLightColors = {
  primary: '#F0B34A', // Yumuşatılmış amber
  secondary: '#DED6C8', // Dengeli kemik tonu
  background: '#E2DBD0', // Hafifçe aydınlatılmış kemiksi beyaz
  surface: '#E9E2D7', // Katmanlı yüzey
  card: '#DDD4C6', // Gölgesi belirgin kart rengi
  text: '#2B261E', // Derin kahverengi
  textSecondary: '#4F463B',
  textTertiary: '#706352',
  border: 'rgba(43, 38, 30, 0.16)',
  divider: 'rgba(43, 38, 30, 0.1)',
};

export const molumeLightTheme = createTheme(
  createBaseThemeConfig(
    {
      mode: 'light',
      primary: {
        main: molumeLightColors.primary,
        light: '#FFD27A',
        dark: '#D99824',
        contrastText: '#000000',
      },
      secondary: {
        main: molumeLightColors.secondary,
        light: '#E7E0D4',
        dark: '#C7BEAF',
        contrastText: '#2C2823',
      },
      background: {
        default: molumeLightColors.background,
        paper: molumeLightColors.surface,
      },
      text: {
        primary: molumeLightColors.text,
        secondary: molumeLightColors.textSecondary,
      },
      divider: molumeLightColors.divider,
      success: {
        main: '#00ED64',
        light: '#00FF6B',
        dark: '#00C853',
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
    molumeLightColors,
    'molume',
    '#FF3B30', // negative (red)
    '#00ED64', // positive (green)
  ) as any,
);

// ==================== PAPIRUS THEMES ====================

// Papirus Dark - Modern antique parchment theme (modern ama antik)
const papirusDarkColors = {
  primary: '#B8860B', // Dark goldenrod - antique bronze, not shiny gold
  secondary: '#6B5B3D', // Muted bronze brown - secondary elements
  background: '#2F2A1F', // Warm dark brown - not constricting, aged parchment feel
  surface: '#3A3328', // Medium dark brown - card backgrounds, softer than before
  card: '#453E32', // Lighter dark brown - elevated cards, more breathing room
  text: '#E8DFD0', // Warm off-white - like aged parchment, not too yellow
  textSecondary: 'rgba(232, 223, 208, 0.85)',
  textTertiary: 'rgba(232, 223, 208, 0.7)',
  border: 'rgba(184, 134, 11, 0.3)', // Dark goldenrod with low opacity
  divider: 'rgba(107, 91, 61, 0.35)', // Muted bronze brown
};

export const papirusDarkTheme = createTheme(
  createBaseThemeConfig(
    {
      mode: 'dark',
      primary: {
        main: papirusDarkColors.primary, // Dark goldenrod
        light: '#D4AF37', // Lighter bronze gold
        dark: '#8B6914', // Darker bronze
        contrastText: '#FFFFFF',
      },
      secondary: {
        main: papirusDarkColors.secondary, // Muted bronze brown
        light: '#8B7355', // Lighter bronze
        dark: '#4A3E2F', // Darker bronze
        contrastText: '#E8DFD0',
      },
      background: {
        default: papirusDarkColors.background, // Warm dark brown - not constricting
        paper: papirusDarkColors.surface, // Medium dark brown
      },
      text: {
        primary: papirusDarkColors.text, // Warm off-white
        secondary: papirusDarkColors.textSecondary,
      },
      success: {
        main: '#7A9470', // Muted green-brown
        light: '#8FA881',
        dark: '#6B7D5F',
      },
      warning: {
        main: '#CD853F', // Peru - warm orange-brown
        light: '#DDA15E',
        dark: '#B87333',
      },
      error: {
        main: '#B8860B', // Dark goldenrod for errors in papirus theme
        light: '#D4AF37',
        dark: '#8B6914',
      },
      info: {
        main: '#8B7355', // Bronze brown
        light: '#A0886F',
        dark: '#6B5B3D',
      },
    },
    papirusDarkColors,
    'papirus',
    '#8B4539', // negative (burnt sienna - darker brown-red)
    '#7A9470', // positive (muted green-brown)
  ) as any,
);

// Papirus Light - Vintage aged parchment (açık kahverengi)
const papirusLightColors = {
  primary: '#8B6F47', // Rich golden brown - antique brass/wood
  secondary: '#C4B5A0', // Muted tan - secondary elements
  background: '#D4C5B0', // Açık kahverengi - light warm brown
  surface: '#E5D4C0', // Açık orta kahverengi - light medium brown
  card: '#EDE3D0', // Çok açık kahverengi - very light brown
  text: '#3E2723', // Deep brown - like old ink
  textSecondary: '#5D4037',
  textTertiary: '#6D4C41',
  border: 'rgba(139, 111, 71, 0.4)',
  divider: 'rgba(62, 39, 35, 0.2)',
};

export const papirusLightTheme = createTheme(
  createBaseThemeConfig(
    {
      mode: 'light',
      primary: {
        main: papirusLightColors.primary,
        light: '#8D6E63',
        dark: '#3E2723',
        contrastText: '#FFFFFF',
      },
      secondary: {
        main: papirusLightColors.secondary,
        light: '#F5F1EF',
        dark: '#D7CCC8',
        contrastText: '#3E2723',
      },
      background: {
        default: papirusLightColors.background,
        paper: papirusLightColors.surface,
      },
      text: {
        primary: papirusLightColors.text,
        secondary: papirusLightColors.textSecondary,
      },
      divider: papirusLightColors.divider,
      success: {
        main: '#8D6E63',
        light: '#A1887F',
        dark: '#6D4C41',
      },
      warning: {
        main: '#D2691E',
        light: '#E07B3E',
        dark: '#B8550C',
      },
      error: {
        main: '#D32F2F',
        light: '#EF5350',
        dark: '#C62828',
      },
      info: {
        main: '#8D6E63',
        light: '#A1887F',
        dark: '#6D4C41',
      },
    },
    papirusLightColors,
    'papirus',
    '#8B4513', // negative (saddle brown - kahverengiye yakın)
    '#8D6E63', // positive (brown)
  ) as any,
);

// ==================== MAGNEFITE THEMES ====================

// Magnefite Dark - Modern dark mode with softened charcoal base
const magnefiteDarkColors = {
  primary: '#A0938E', // Muted warm taupe - primary accent
  secondary: '#2A2A2F', // Neutral charcoal-gray secondary surfaces
  background: '#161616', // Slightly lighter charcoal base
  surface: '#1D1D21', // Lifted neutral charcoal
  card: '#242429', // Elevated card tone with neutral gray
  text: '#F7F5F2', // Soft warm white
  textSecondary: 'rgba(247, 245, 242, 0.85)',
  textTertiary: 'rgba(247, 245, 242, 0.65)',
  border: 'rgba(160, 147, 142, 0.22)',
  divider: 'rgba(160, 147, 142, 0.14)',
};

export const magnefiteDarkTheme = createTheme(
  createBaseThemeConfig(
    {
      mode: 'dark',
      primary: {
        main: magnefiteDarkColors.primary, // #A0938E - Warm taupe
        light: '#BAAAA6', // Lighter taupe
        dark: '#857770', // Darker taupe
        contrastText: '#FFFFFF',
      },
      secondary: {
        main: magnefiteDarkColors.secondary,
        light: '#35353B',
        dark: '#1A1A1E',
        contrastText: '#FFFFFF',
      },
      background: {
        default: magnefiteDarkColors.background,
        paper: magnefiteDarkColors.surface,
      },
      text: {
        primary: magnefiteDarkColors.text,
        secondary: magnefiteDarkColors.textSecondary,
      },
      success: {
        main: '#5E8F6F',
        light: '#7AA887',
        dark: '#477457',
      },
      warning: {
        main: '#D27B55',
        light: '#E1906D',
        dark: '#B8613E',
      },
      error: {
        main: '#C45A54',
        light: '#D97A76',
        dark: '#A43E3A',
      },
      info: {
        main: '#7A9CC6', // Muted steel blue
        light: '#9AB5D6',
        dark: '#5A7CA8',
      },
    },
    magnefiteDarkColors,
    'magnefite',
    '#D4756A', // negative (soft clay red)
    '#7A9CC6', // positive (steel blue)
  ) as any,
);

// Magnefite Light - Warm neutral base with slightly deeper contrast
const magnefiteLightColors = {
  primary: '#A0938E', // Warm taupe accent
  secondary: '#3A4A59', // Deep blue-gray secondary
  background: '#D1D4D8', // Daha koyu nötr zemin
  surface: '#C3C7CC', // Griye yaklaşan yüzey
  card: '#A8AEB6', // Daha koyu kart yüzeyi
  text: '#1B232C', // Daha derin gri-mavi metin
  textSecondary: '#3F4751',
  textTertiary: '#5B6570',
  border: 'rgba(27, 35, 44, 0.3)',
  divider: 'rgba(27, 35, 44, 0.18)',
};

export const magnefiteLightTheme = createTheme(
  createBaseThemeConfig(
    {
      mode: 'light',
      primary: {
        main: magnefiteLightColors.primary, // #A0938E - Warm taupe
        light: '#BAAAA6', // Lighter taupe
        dark: '#857770', // Darker taupe
        contrastText: '#FFFFFF',
      },
      secondary: {
        main: magnefiteLightColors.secondary,
        light: '#516275',
        dark: '#24313D',
        contrastText: '#FFFFFF',
      },
      background: {
        default: magnefiteLightColors.background,
        paper: magnefiteLightColors.surface,
      },
      text: {
        primary: magnefiteLightColors.text,
        secondary: magnefiteLightColors.textSecondary,
      },
      divider: magnefiteLightColors.divider,
      success: {
        main: '#5E8F6F', // Muted earthy green
        light: '#7AA887',
        dark: '#477457',
      },
      warning: {
        main: '#D27B55', // Warm clay orange
        light: '#E1906D',
        dark: '#B8613E',
      },
      error: {
        main: '#C45A54',
        light: '#D97A76',
        dark: '#A43E3A',
      },
      info: {
        main: '#6E93BD', // Steel blue
        light: '#8BAACD',
        dark: '#4F749E',
      },
    },
    magnefiteLightColors,
    'magnefite',
    '#C45A54', // negative (muted red clay)
    '#5E8F6F', // positive (earthy green)
  ) as any,
);

// Legacy exports for backward compatibility
export const darkTheme = molumeDarkTheme;
export const lightTheme = molumeLightTheme;

// Theme selector function
export const getTheme = (
  themeName: 'molume' | 'papirus' | 'magnefite',
  mode: 'light' | 'dark',
): Theme => {
  if (themeName === 'molume') {
    return mode === 'dark' ? molumeDarkTheme : molumeLightTheme;
  } else if (themeName === 'papirus') {
    return mode === 'dark' ? papirusDarkTheme : papirusLightTheme;
  } else if (themeName === 'magnefite') {
    return mode === 'dark' ? magnefiteDarkTheme : magnefiteLightTheme;
  }
  return molumeDarkTheme; // default fallback
};

export default molumeLightTheme;
