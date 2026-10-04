import React from 'react';
import { Box, Button, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Hub } from '@mui/icons-material';
import { useAppSelector } from '../../../store/hooks';
import {
  HEADER_MOTION,
  inquireIconLift,
  liquidHoverSpinCCW,
  liquidHoverSpinCW,
  mountAnimationSx,
  reduceMotionQuery,
} from './headerTrioMotion';
import { usePointerSheen } from './usePointerSheen';

interface InquireButtonProps {
  label: string;
  active?: boolean;
  onClick: () => void;
}

type InquireTone = {
  main: string;
  dark: string;
  light: string;
  contrast: string;
};

const INQUIRE_PURPLE = {
  dark: { main: '#A78BFA', dark: '#7C3AED', light: '#C4B5FD', contrast: '#FFFFFF' },
  light: { main: '#7C3AED', dark: '#5B21B6', light: '#8B5CF6', contrast: '#FFFFFF' },
} as const satisfies Record<'dark' | 'light', InquireTone>;

const INQUIRE_BRONZE = {
  dark: { main: '#E0B84A', dark: '#B8860B', light: '#F3D98A', contrast: '#2A2114' },
  light: { main: '#C9A227', dark: '#8B6914', light: '#E4C65A', contrast: '#FFFFFF' },
} as const satisfies Record<'dark' | 'light', InquireTone>;

type LiquidGradients = {
  chromatic: string;
  metal: string;
  metalAlt: string;
  sheen: string;
  /** Compact wave packets oriented with conic `from ${entryAngle}deg` */
  waveFrom: (entryAngle: number) => string;
  waveFromSoft: (entryAngle: number) => string;
};

function liquidMetalGradients(accent: InquireTone, isDark: boolean): LiquidGradients {
  const champagne = alpha('#E8D5A3', isDark ? 0.85 : 0.75);
  const glassBlue = alpha('#6EB6FF', isDark ? 0.7 : 0.6);
  const teal = alpha('#7EBACB', isDark ? 0.65 : 0.55);

  return {
    chromatic: `conic-gradient(
      from 0deg,
      transparent 0deg,
      transparent 70deg,
      ${alpha('#000', 0.4)} 130deg,
      ${accent.light} 165deg,
      transparent 190deg,
      #ffffff 215deg,
      ${accent.main} 240deg,
      ${alpha('#000', 0.35)} 280deg,
      transparent 320deg,
      transparent 360deg
    )`,
    metal: `conic-gradient(
      from 40deg,
      transparent 0deg,
      transparent 90deg,
      #777777 150deg,
      #dddddd 185deg,
      #ffffff 205deg,
      #bbbbbb 225deg,
      #666666 255deg,
      transparent 300deg,
      transparent 360deg
    )`,
    metalAlt: `conic-gradient(
      from 200deg,
      transparent 0deg,
      transparent 100deg,
      #999999 160deg,
      #ffffff 200deg,
      #888888 230deg,
      transparent 280deg,
      transparent 360deg
    )`,
    sheen: alpha('#fff', isDark ? 0.38 : 0.45),
    waveFrom: entryAngle => `conic-gradient(
      from ${entryAngle}deg,
      ${accent.main} 0deg,
      ${champagne} 22deg,
      ${glassBlue} 44deg,
      ${teal} 66deg,
      transparent 105deg,
      transparent 360deg
    )`,
    waveFromSoft: entryAngle => `conic-gradient(
      from ${entryAngle}deg,
      transparent 0deg,
      transparent 160deg,
      ${alpha(accent.light, 0.85)} 190deg,
      ${alpha(glassBlue, 0.75)} 220deg,
      transparent 265deg,
      transparent 360deg
    )`,
  };
}

function liquidBronzeGradients(accent: InquireTone, isDark: boolean): LiquidGradients {
  const amber = alpha('#E0B86A', isDark ? 0.85 : 0.75);
  const glassBlue = alpha('#7EC8F0', isDark ? 0.65 : 0.55);
  const sage = alpha('#8FB089', isDark ? 0.6 : 0.5);

  return {
    chromatic: `conic-gradient(
      from 0deg,
      transparent 0deg,
      transparent 70deg,
      ${alpha('#3E2723', 0.45)} 125deg,
      #CD7F32 155deg,
      ${accent.light} 175deg,
      transparent 195deg,
      #FFF3C4 215deg,
      ${accent.main} 245deg,
      #8B4513 275deg,
      transparent 320deg,
      transparent 360deg
    )`,
    metal: `conic-gradient(
      from 40deg,
      transparent 0deg,
      transparent 85deg,
      #8B5A2B 140deg,
      #CD7F32 170deg,
      #F0D78C 195deg,
      #E8C547 215deg,
      #B87333 240deg,
      #6B4423 270deg,
      transparent 310deg,
      transparent 360deg
    )`,
    metalAlt: `conic-gradient(
      from 200deg,
      transparent 0deg,
      transparent 95deg,
      #A67C52 150deg,
      #FFE7A0 185deg,
      #D4AF37 210deg,
      #8B6914 245deg,
      transparent 285deg,
      transparent 360deg
    )`,
    sheen: alpha(isDark ? '#FFF6D6' : '#FFF8E7', isDark ? 0.5 : 0.58),
    waveFrom: entryAngle => `conic-gradient(
      from ${entryAngle}deg,
      ${accent.main} 0deg,
      ${amber} 22deg,
      ${glassBlue} 44deg,
      ${sage} 66deg,
      transparent 105deg,
      transparent 360deg
    )`,
    waveFromSoft: entryAngle => `conic-gradient(
      from ${entryAngle}deg,
      transparent 0deg,
      transparent 160deg,
      ${alpha(accent.light, 0.85)} 190deg,
      ${alpha(glassBlue, 0.7)} 220deg,
      transparent 265deg,
      transparent 360deg
    )`,
  };
}

/**
 * Soruştur CTA with liquid border.
 * Idle: static rim. Hover: entry-anchored color waves.
 */
const InquireButton: React.FC<InquireButtonProps> = ({ label, active = false, onClick }) => {
  const theme = useTheme();
  const { name: themeName } = useAppSelector(state => state.theme);
  const { sheen, onPointerEnter, onPointerMove, onPointerLeave } = usePointerSheen();

  const isDark = theme.palette.mode === 'dark';
  const isPapirus = themeName === 'papirus';
  const hovered = sheen.active;
  const entryAngle = sheen.entryAngle;

  const tone = isPapirus
    ? isDark
      ? INQUIRE_BRONZE.dark
      : INQUIRE_BRONZE.light
    : isDark
      ? INQUIRE_PURPLE.dark
      : INQUIRE_PURPLE.light;

  const liquids = isPapirus ? liquidBronzeGradients(tone, isDark) : liquidMetalGradients(tone, isDark);
  const gradient = `linear-gradient(135deg, ${tone.main} 0%, ${tone.dark} 100%)`;
  const gradientActive = `linear-gradient(135deg, ${tone.dark} 0%, ${tone.main} 100%)`;

  const spinnerBase = {
    position: 'absolute' as const,
    left: '50%',
    top: '50%',
    width: '240%',
    height: '240%',
    marginLeft: '-120%',
    marginTop: '-120%',
    borderRadius: '50%',
    pointerEvents: 'none' as const,
    willChange: 'transform',
    [reduceMotionQuery]: { animation: 'none' },
  };

  return (
    <Box
      className="header-nav-btn"
      onMouseEnter={onPointerEnter}
      onMouseMove={onPointerMove}
      onMouseLeave={onPointerLeave}
      sx={{
        ...mountAnimationSx(0),
        display: 'inline-flex',
        flex: '0 0 auto',
        minWidth: 0,
        maxWidth: '100%',
        position: 'relative',
        borderRadius: 2.5,
        p: '2.5px',
        overflow: 'hidden',
        isolation: 'isolate',
      }}
    >
      {/* Idle: static liquid rim */}
      <Box
        aria-hidden
        sx={{
          ...spinnerBase,
          background: liquids.chromatic,
          filter: 'blur(5px)',
          opacity: hovered ? 0.35 : 0.65,
          transition: 'opacity 0.3s ease',
          zIndex: 0,
        }}
      />
      <Box
        aria-hidden
        sx={{
          ...spinnerBase,
          background: liquids.metal,
          filter: 'blur(0.35px)',
          opacity: hovered ? 0.5 : 0.95,
          transition: 'opacity 0.3s ease',
          zIndex: 0,
        }}
      />
      <Box
        aria-hidden
        sx={{
          ...spinnerBase,
          width: '200%',
          height: '200%',
          marginLeft: '-100%',
          marginTop: '-100%',
          background: liquids.metalAlt,
          filter: 'blur(1.1px)',
          opacity: hovered ? 0.35 : 0.55,
          transition: 'opacity 0.3s ease',
          zIndex: 0,
        }}
      />

      {/* Hover only: entry-anchored waves */}
      {hovered && (
        <>
          <Box
            aria-hidden
            key={`cw-${entryAngle.toFixed(1)}`}
            sx={{
              ...spinnerBase,
              background: liquids.waveFrom(entryAngle),
              filter: 'blur(3.5px)',
              opacity: 1,
              animation: `${liquidHoverSpinCW} ${HEADER_MOTION.liquidWaveCW} linear infinite`,
              zIndex: 0,
              [reduceMotionQuery]: { animation: 'none' },
            }}
          />
          <Box
            aria-hidden
            key={`ccw-${entryAngle.toFixed(1)}`}
            sx={{
              ...spinnerBase,
              background: liquids.waveFromSoft(entryAngle),
              filter: 'blur(4px)',
              opacity: 0.85,
              animation: `${liquidHoverSpinCCW} ${HEADER_MOTION.liquidWaveCCW} linear infinite`,
              zIndex: 0,
              [reduceMotionQuery]: { animation: 'none' },
            }}
          />
        </>
      )}

      <Button
        variant="contained"
        disableElevation
        onClick={onClick}
        startIcon={<Hub className="inquire-icon" sx={{ fontSize: '1.15rem' }} />}
        sx={{
          position: 'relative',
          zIndex: 1,
          overflow: 'hidden',
          borderRadius: 2,
          backgroundImage: active || sheen.active ? gradientActive : gradient,
          backgroundColor: tone.main,
          color: tone.contrast,
          textTransform: 'none',
          py: 1.15,
          px: 2.5,
          fontSize: '0.9rem',
          fontWeight: 600,
          flex: '0 0 auto',
          whiteSpace: 'nowrap',
          border: 'none',
          boxShadow: 'none',
          transition: 'background-image 0.2s ease, transform 0.2s ease',
          '& .MuiButton-startIcon': { flexShrink: 0, mr: 0.75, position: 'relative', zIndex: 1 },
          '& .inquire-icon': { transition: 'transform 0.25s ease' },
          '& .inquire-label': { position: 'relative', zIndex: 1 },
          '&:hover': {
            backgroundImage: gradientActive,
            backgroundColor: tone.dark,
            transform: 'translateY(-1px)',
            '& .inquire-icon': {
              animation: `${inquireIconLift} 0.4s ease`,
            },
          },
          '&:active': {
            transform: 'translateY(0)',
          },
          '&:focus-visible': {
            outline: `2px solid ${tone.light}`,
            outlineOffset: 2,
          },
          [reduceMotionQuery]: {
            '& .inquire-pointer-sheen': { display: 'none' },
            '&:hover': {
              transform: 'none',
              '& .inquire-icon': { animation: 'none' },
            },
          },
        }}
      >
        <Box
          aria-hidden
          className="inquire-pointer-sheen"
          sx={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(circle at ${sheen.x}% ${sheen.y}%, ${liquids.sheen} 0%, transparent 52%)`,
            opacity: sheen.active ? 1 : 0,
            transition: 'opacity 0.18s ease',
            pointerEvents: 'none',
            zIndex: 0,
            mixBlendMode: isPapirus ? 'soft-light' : 'overlay',
          }}
        />
        <Box component="span" className="inquire-label">
          {label}
        </Box>
      </Button>
    </Box>
  );
};

export default InquireButton;
