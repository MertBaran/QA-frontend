import { keyframes, alpha, type Theme } from '@mui/material/styles';

export const HEADER_MOTION = {
  fast: '160ms',
  mid: '280ms',
  slow: '400ms',
  idleSheen: '5.5s',
  idleScan: '2.4s',
  /** Idle liquid — full CW then CCW cycle (longer = readable direction flips) */
  liquidDriftA: '12s',
  liquidDriftB: '15s',
  liquidOrbit: '18s',
  /** Hover: entry-origin border ripple (faster = more readable) */
  liquidWaveCW: '1.6s',
  liquidWaveCCW: '2.1s',
  /** Soft fill pulse — keeps the CTA feeling alive at rest */
  inquireIdlePulse: '3.2s',
  mount: '380ms',
} as const;

export const reduceMotionQuery = '@media (prefers-reduced-motion: reduce)';

export const mountFadeSlide = keyframes`
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

/** Soft sheen across the fill — idle liveliness */
export const inquireSheen = keyframes`
  0% { transform: translateX(-130%); opacity: 0; }
  15% { opacity: 0.9; }
  50% { opacity: 0.55; }
  100% { transform: translateX(130%); opacity: 0; }
`;

/** Subtle rim / fill breath at rest */
export const inquireIdlePulse = keyframes`
  0%, 100% { filter: brightness(1); }
  50% { filter: brightness(1.08); }
`;

export const inquireIconLift = keyframes`
  0% { transform: scale(1) rotate(0deg); }
  50% { transform: scale(1.06) rotate(6deg); }
  100% { transform: scale(1.04) rotate(0deg); }
`;

/**
 * Idle A: CW then CCW. No hard holds — ease-out into apexes so motion slows, then continues.
 */
export const liquidMetalDriftA = keyframes`
  0%   { transform: rotate(12deg) scale(1); animation-timing-function: cubic-bezier(0.22, 0.61, 0.36, 1); }
  28%  { transform: rotate(155deg) scale(1.03); animation-timing-function: cubic-bezier(0.45, 0, 0.55, 1); }
  50%  { transform: rotate(360deg) scale(1); animation-timing-function: cubic-bezier(0.22, 0.61, 0.36, 1); }
  78%  { transform: rotate(205deg) scale(1.04); animation-timing-function: cubic-bezier(0.45, 0, 0.55, 1); }
  100% { transform: rotate(12deg) scale(1); }
`;

/**
 * Idle B: opposite phase — CCW then CW; slows at different angles than layer A.
 */
export const liquidMetalDriftB = keyframes`
  0%   { transform: rotate(-18deg) scale(1.02); animation-timing-function: cubic-bezier(0.22, 0.61, 0.36, 1); }
  30%  { transform: rotate(-130deg) scale(0.97); animation-timing-function: cubic-bezier(0.45, 0, 0.55, 1); }
  50%  { transform: rotate(-360deg) scale(1.01); animation-timing-function: cubic-bezier(0.22, 0.61, 0.36, 1); }
  80%  { transform: rotate(-175deg) scale(0.96); animation-timing-function: cubic-bezier(0.45, 0, 0.55, 1); }
  100% { transform: rotate(-18deg) scale(1.02); }
`;

/**
 * Idle orbit: eccentric path; decelerates through unique corners, never freezes.
 */
export const liquidMetalOrbit = keyframes`
  0%   { transform: rotate(25deg) translateX(6%) rotate(-25deg) scale(1); animation-timing-function: cubic-bezier(0.22, 0.61, 0.36, 1); }
  32%  { transform: rotate(165deg) translateX(12%) rotate(-75deg) scale(1.04); animation-timing-function: cubic-bezier(0.45, 0, 0.55, 1); }
  50%  { transform: rotate(360deg) translateX(7%) rotate(-180deg) scale(1); animation-timing-function: cubic-bezier(0.22, 0.61, 0.36, 1); }
  82%  { transform: rotate(200deg) translateX(11%) rotate(-100deg) scale(1.05); animation-timing-function: cubic-bezier(0.45, 0, 0.55, 1); }
  100% { transform: rotate(25deg) translateX(6%) rotate(-25deg) scale(1); }
`;

/** Hover: continuous CW spin — wave packet starts at entry via gradient `from` */
export const liquidHoverSpinCW = keyframes`
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
`;

/** Hover: continuous CCW spin — opposite ripple */
export const liquidHoverSpinCCW = keyframes`
  from { transform: rotate(0deg); }
  to   { transform: rotate(-360deg); }
`;

/** Hover: scan band travels from entry (--q-from-*) toward opposite side (--q-to-*) */
export const queryEntryWave = keyframes`
  0% {
    left: var(--q-from-x);
    top: var(--q-from-y);
    opacity: 0.95;
  }
  75% {
    opacity: 0.55;
  }
  100% {
    left: var(--q-to-x);
    top: var(--q-to-y);
    opacity: 0;
  }
`;

export const queryIconPulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.08); }
`;

export const searchIconNudge = keyframes`
  0% { transform: rotate(0deg); }
  40% { transform: rotate(12deg); }
  100% { transform: rotate(0deg); }
`;

export function headerTrioCssVars(theme: Theme): Record<string, string> {
  const isDark = theme.palette.mode === 'dark';
  const queryFg = theme.palette.text.primary;
  return {
    '--header-accent': theme.palette.primary.main,
    '--header-accent-dark': theme.palette.primary.dark,
    '--header-sheen': isDark
      ? alpha(theme.palette.common.white, 0.14)
      : alpha(theme.palette.common.white, 0.28),
    // Query: cool slate/graphite frame — distinct from Inquire primary fill (no blue)
    '--header-query-fg': queryFg,
    '--header-query-border': alpha(queryFg, isDark ? 0.38 : 0.28),
    '--header-query-fill': alpha(queryFg, isDark ? 0.08 : 0.06),
    '--header-query-fill-hover': alpha(queryFg, isDark ? 0.12 : 0.09),
    '--header-scan': alpha(theme.palette.primary.main, isDark ? 0.65 : 0.45),
    '--header-motion-fast': HEADER_MOTION.fast,
    '--header-motion-mid': HEADER_MOTION.mid,
    '--header-motion-slow': HEADER_MOTION.slow,
  };
}

export function mountAnimationSx(delayMs: number) {
  return {
    animation: `${mountFadeSlide} ${HEADER_MOTION.mount} ease both`,
    animationDelay: `${delayMs}ms`,
    [reduceMotionQuery]: {
      animation: 'none',
    },
  };
}
