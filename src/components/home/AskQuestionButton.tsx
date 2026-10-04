import React from 'react';
import { Box, Button, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Add } from '@mui/icons-material';
import { useAppSelector } from '../../store/hooks';
import {
  HEADER_MOTION,
  inquireIconLift,
  inquireIdlePulse,
  inquireSheen,
  liquidHoverSpinCCW,
  liquidHoverSpinCW,
  liquidMetalDriftA,
  liquidMetalDriftB,
  liquidMetalOrbit,
  reduceMotionQuery,
} from '../layout/header/headerTrioMotion';
import { usePointerSheen } from '../layout/header/usePointerSheen';

interface AskQuestionButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  /** Hide the leading Add icon (e.g. modal “Sor”) */
  hideIcon?: boolean;
  minWidth?: number | string;
}

type Tone = {
  main: string;
  dark: string;
  light: string;
  contrast: string;
};

function resolveTone(
  themeName: string,
  isDark: boolean,
  success: { main: string; dark: string; light: string; contrastText?: string },
): Tone {
  if (themeName === 'molume') {
    return isDark
      ? { main: '#00ED64', dark: '#00C853', light: '#5CFF9A', contrast: '#04140A' }
      : { main: '#00C853', dark: '#00A844', light: '#00ED64', contrast: '#04140A' };
  }
  if (themeName === 'papirus') {
    return isDark
      ? { main: '#7A9470', dark: '#5F7558', light: '#A3B89A', contrast: '#FFFFFF' }
      : { main: '#6B7D5F', dark: '#4E5C45', light: '#8FA881', contrast: '#FFFFFF' };
  }
  return {
    main: success.main,
    dark: success.dark,
    light: success.light,
    contrast: success.contrastText || '#FFFFFF',
  };
}

/**
 * Liquid “Soru Sor / Sor” CTA — idle drift + hover entry waves.
 */
const AskQuestionButton: React.FC<AskQuestionButtonProps> = ({
  label,
  onClick,
  disabled = false,
  hideIcon = false,
  minWidth,
}) => {
  const theme = useTheme();
  const { name: themeName } = useAppSelector(state => state.theme);
  const { sheen, onPointerEnter, onPointerMove, onPointerLeave } = usePointerSheen();
  const isDark = theme.palette.mode === 'dark';
  const hovered = sheen.active && !disabled;
  const entryAngle = sheen.entryAngle;
  const tone = resolveTone(themeName, isDark, theme.palette.success);

  const chromatic = `conic-gradient(
    from 0deg,
    transparent 0deg,
    transparent 70deg,
    ${alpha('#000', 0.35)} 130deg,
    ${tone.light} 165deg,
    transparent 190deg,
    #ffffff 215deg,
    ${tone.main} 240deg,
    ${alpha('#000', 0.3)} 280deg,
    transparent 320deg,
    transparent 360deg
  )`;

  const metal = `conic-gradient(
    from 40deg,
    transparent 0deg,
    transparent 90deg,
    #3d6b4f 150deg,
    #a8e6c0 185deg,
    #ffffff 205deg,
    #7dcea0 225deg,
    #2f5540 255deg,
    transparent 300deg,
    transparent 360deg
  )`;

  const metalAlt = `conic-gradient(
    from 200deg,
    transparent 0deg,
    transparent 100deg,
    #6bbf8a 160deg,
    #ffffff 200deg,
    #4a9a68 230deg,
    transparent 280deg,
    transparent 360deg
  )`;

  const mint = alpha('#B8F5D0', isDark ? 0.85 : 0.75);
  const glassCyan = alpha('#7EE7FF', isDark ? 0.7 : 0.6);
  const lime = alpha('#D4FF8A', isDark ? 0.65 : 0.55);
  const fillSheen = alpha('#fff', isDark ? 0.35 : 0.42);
  const waveFrom = `conic-gradient(
    from ${entryAngle}deg,
    ${tone.main} 0deg,
    ${mint} 22deg,
    ${glassCyan} 44deg,
    ${lime} 66deg,
    transparent 105deg,
    transparent 360deg
  )`;
  const waveFromSoft = `conic-gradient(
    from ${entryAngle}deg,
    transparent 0deg,
    transparent 160deg,
    ${alpha(tone.light, 0.85)} 190deg,
    ${alpha(glassCyan, 0.75)} 220deg,
    transparent 265deg,
    transparent 360deg
  )`;

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
      onMouseEnter={disabled ? undefined : onPointerEnter}
      onMouseMove={disabled ? undefined : onPointerMove}
      onMouseLeave={disabled ? undefined : onPointerLeave}
      sx={{
        display: 'inline-flex',
        position: 'relative',
        borderRadius: 3.5,
        p: '2.5px',
        overflow: 'hidden',
        isolation: 'isolate',
        opacity: disabled ? 0.45 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
        animation:
          disabled || hovered
            ? 'none'
            : `${inquireIdlePulse} ${HEADER_MOTION.inquireIdlePulse} ease-in-out infinite`,
        [reduceMotionQuery]: { animation: 'none' },
      }}
    >
      <Box
        aria-hidden
        sx={{
          ...spinnerBase,
          background: chromatic,
          filter: 'blur(5px)',
          opacity: hovered ? 0.35 : 0.7,
          transition: 'opacity 0.3s ease',
          animation: disabled
            ? 'none'
            : `${liquidMetalDriftA} ${HEADER_MOTION.liquidDriftA} linear infinite`,
          zIndex: 0,
        }}
      />
      <Box
        aria-hidden
        sx={{
          ...spinnerBase,
          background: metal,
          filter: 'blur(0.35px)',
          opacity: hovered ? 0.5 : 1,
          transition: 'opacity 0.3s ease',
          animation: disabled
            ? 'none'
            : `${liquidMetalDriftB} ${HEADER_MOTION.liquidDriftB} linear infinite`,
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
          background: metalAlt,
          filter: 'blur(1.1px)',
          opacity: hovered ? 0.35 : 0.65,
          transition: 'opacity 0.3s ease',
          animation: disabled
            ? 'none'
            : `${liquidMetalOrbit} ${HEADER_MOTION.liquidOrbit} linear infinite`,
          zIndex: 0,
        }}
      />

      {hovered && (
        <>
          <Box
            aria-hidden
            key={`cw-${entryAngle.toFixed(1)}`}
            sx={{
              ...spinnerBase,
              background: waveFrom,
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
              background: waveFromSoft,
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
        disabled={disabled}
        onClick={onClick}
        startIcon={
          hideIcon ? undefined : <Add className="ask-icon" sx={{ fontSize: '1.2rem' }} />
        }
        sx={{
          position: 'relative',
          zIndex: 1,
          overflow: 'hidden',
          borderRadius: 3,
          minWidth: minWidth ?? 'auto',
          backgroundImage: hovered ? gradientActive : gradient,
          backgroundColor: tone.main,
          color: tone.contrast,
          textTransform: 'none',
          px: 3,
          py: 1.5,
          fontWeight: 600,
          border: 'none',
          boxShadow: disabled ? 'none' : `0 4px 20px ${alpha(tone.main, 0.28)}`,
          transition: 'background-image 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease',
          '&.Mui-disabled': {
            backgroundImage: gradient,
            backgroundColor: tone.main,
            color: tone.contrast,
          },
          '& .MuiButton-startIcon': { flexShrink: 0, mr: 0.75, position: 'relative', zIndex: 1 },
          '& .ask-icon': { transition: 'transform 0.25s ease' },
          '& .ask-label': { position: 'relative', zIndex: 1 },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            width: '45%',
            background: `linear-gradient(90deg, transparent, ${fillSheen}, transparent)`,
            pointerEvents: 'none',
            opacity: disabled || hovered ? 0 : 1,
            transition: 'opacity 0.2s ease',
            animation: disabled
              ? 'none'
              : `${inquireSheen} ${HEADER_MOTION.idleSheen} ease-in-out infinite`,
            zIndex: 0,
          },
          '&:hover': {
            backgroundImage: gradientActive,
            backgroundColor: tone.dark,
            transform: 'translateY(-2px)',
            boxShadow: `0 6px 25px ${alpha(tone.main, 0.42)}`,
            '& .ask-icon': {
              animation: `${inquireIconLift} 0.4s ease`,
            },
            '&::after': { opacity: 0 },
          },
          '&:active': { transform: 'translateY(0)' },
          '&:focus-visible': {
            outline: `2px solid ${tone.light}`,
            outlineOffset: 2,
          },
          [reduceMotionQuery]: {
            '&::after': { animation: 'none', display: 'none' },
            '&:hover': {
              transform: 'none',
              '& .ask-icon': { animation: 'none' },
            },
          },
        }}
      >
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(circle at ${sheen.x}% ${sheen.y}%, ${fillSheen} 0%, transparent 52%)`,
            opacity: sheen.active && !disabled ? 1 : 0,
            transition: 'opacity 0.18s ease',
            pointerEvents: 'none',
            zIndex: 0,
            mixBlendMode: 'soft-light',
          }}
        />
        <Box component="span" className="ask-label">
          {label}
        </Box>
      </Button>
    </Box>
  );
};

export default AskQuestionButton;
