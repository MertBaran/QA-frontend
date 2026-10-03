import type { CSSProperties } from 'react';
import type { Theme } from '@mui/material/styles';

/** Marker palette — soft tones that composite cleanly on light/dark paper */
export const HIGHLIGHT_COLOR_PRESETS = [
  '#FFE082', // amber
  '#FFF59D', // soft yellow
  '#A5D6A7', // green
  '#80CBC4', // teal
  '#90CAF9', // blue
  '#CE93D8', // purple
  '#F48FB1', // pink
  '#FFCC80', // orange
  '#B0BEC5', // blue-gray
] as const;

export const DEFAULT_HIGHLIGHT_BG = HIGHLIGHT_COLOR_PRESETS[0];

type Rgb = { r: number; g: number; b: number };

function parseHex(hex: string): Rgb | null {
  const h = hex.trim().replace(/^#/, '');
  if (h.length === 3) {
    return {
      r: parseInt(h[0] + h[0], 16),
      g: parseInt(h[1] + h[1], 16),
      b: parseInt(h[2] + h[2], 16),
    };
  }
  if (h.length === 6 || h.length === 8) {
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    if ([r, g, b].some((n) => Number.isNaN(n))) return null;
    return { r, g, b };
  }
  return null;
}

function toHex({ r, g, b }: Rgb): string {
  return `#${[r, g, b].map((n) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0')).join('')}`;
}

function paperRgb(theme: Theme): Rgb {
  const fromTheme = parseHex(theme.palette.background.paper);
  if (fromTheme) return fromTheme;
  return theme.palette.mode === 'dark' ? { r: 30, g: 30, b: 30 } : { r: 255, g: 255, b: 255 };
}

/**
 * Blend marker color into the theme paper, then pick contrast text.
 * Optional `textColor` keeps an explicit font color when highlight + color are combined.
 */
export function getMdHighlightStyle(
  bgHex: string | undefined,
  theme: Theme,
  textColor?: string,
): CSSProperties {
  const ink = parseHex(bgHex || DEFAULT_HIGHLIGHT_BG) || parseHex(DEFAULT_HIGHLIGHT_BG)!;
  const paper = paperRgb(theme);
  // Dark mode: less marker pigment so page doesn't glow; light: stronger wash
  const mix = theme.palette.mode === 'dark' ? 0.4 : 0.58;
  const composite: Rgb = {
    r: Math.round(ink.r * mix + paper.r * (1 - mix)),
    g: Math.round(ink.g * mix + paper.g * (1 - mix)),
    b: Math.round(ink.b * mix + paper.b * (1 - mix)),
  };
  const backgroundColor = toHex(composite);

  return {
    backgroundColor,
    color: textColor || theme.palette.getContrastText(backgroundColor),
    padding: '0 3px',
    borderRadius: 3,
  };
}
