import React, { useMemo } from 'react';
import { Box, Button, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { ManageSearch } from '@mui/icons-material';
import {
  mountAnimationSx,
  queryEntryWave,
  reduceMotionQuery,
} from './headerTrioMotion';
import { usePointerSheen } from './usePointerSheen';

interface QueryButtonProps {
  label: string;
  active?: boolean;
  onClick: () => void;
}

/** Dominant axis from entry → wave travels toward the opposite side */
function waveGeometry(entryX: number, entryY: number) {
  const horizontal = Math.abs(entryX - 50) >= Math.abs(entryY - 50);
  if (horizontal) {
    return {
      mode: 'h' as const,
      fromX: `${entryX}%`,
      fromY: '50%',
      toX: `${100 - entryX}%`,
      toY: '50%',
    };
  }
  return {
    mode: 'v' as const,
    fromX: '50%',
    fromY: `${entryY}%`,
    toX: '50%',
    toY: `${100 - entryY}%`,
  };
}

const QueryButton: React.FC<QueryButtonProps> = ({ label, active = false, onClick }) => {
  const theme = useTheme();
  const { sheen, onPointerEnter, onPointerMove, onPointerLeave } = usePointerSheen();
  const isDark = theme.palette.mode === 'dark';
  const pointerSheen = alpha(theme.palette.common.white, isDark ? 0.2 : 0.34);
  const hovered = sheen.active;

  const wave = useMemo(
    () => waveGeometry(sheen.entryX, sheen.entryY),
    [sheen.entryX, sheen.entryY],
  );

  return (
    <Box
      className="header-nav-btn"
      onMouseEnter={onPointerEnter}
      onMouseMove={onPointerMove}
      onMouseLeave={onPointerLeave}
      sx={{ ...mountAnimationSx(40), display: 'inline-flex', flex: '0 0 auto', minWidth: 0, maxWidth: '100%' }}
    >
      <Button
        variant="outlined"
        onClick={onClick}
        startIcon={<ManageSearch className="query-icon" sx={{ fontSize: '1.2rem' }} />}
        sx={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 2,
          borderColor: 'var(--header-query-border)',
          borderWidth: 1,
          borderStyle: 'solid',
          color: 'var(--header-query-fg)',
          textTransform: 'none',
          py: 1.15,
          px: 2.5,
          fontSize: '0.9rem',
          fontWeight: 600,
          flex: '0 0 auto',
          whiteSpace: 'nowrap',
          backgroundColor: 'var(--header-query-fill)',
          boxShadow: 'none',
          transition:
            'background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease',
          '& .MuiButton-startIcon': { flexShrink: 0, mr: 0.75, position: 'relative', zIndex: 1 },
          '& .query-icon': {
            transition: 'transform 0.25s ease',
          },
          '& .query-label': { position: 'relative', zIndex: 1 },
          ...(active && {
            backgroundColor: 'var(--header-query-fill-hover)',
            borderColor: theme.palette.primary.main,
            boxShadow: `inset 0 -2px 0 0 ${theme.palette.primary.main}`,
          }),
          '&:hover': {
            backgroundColor: 'var(--header-query-fill-hover)',
            borderColor: theme.palette.primary.main,
            color: 'var(--header-query-fg)',
            transform: 'translateY(-1px)',
            '& .query-icon': {
              transform: 'translateY(-1px) scale(1.06)',
            },
          },
          '&:active': {
            transform: 'translateY(0)',
          },
          '&:focus-visible': {
            outline: `2px solid ${theme.palette.primary.main}`,
            outlineOffset: 2,
          },
          [reduceMotionQuery]: {
            '& .query-entry-wave': { display: 'none' },
            '& .query-pointer-sheen': { display: 'none' },
            '&:hover': {
              transform: 'none',
              '& .query-icon': { transform: 'none' },
            },
          },
        }}
      >
        {/* Hover only: wave from entry toward opposite side */}
        {hovered && (
          <Box
            aria-hidden
            className="query-entry-wave"
            key={`qw-${sheen.entryX.toFixed(0)}-${sheen.entryY.toFixed(0)}`}
            sx={{
              position: 'absolute',
              width: wave.mode === 'h' ? '34%' : '100%',
              height: wave.mode === 'h' ? '100%' : '34%',
              transform: 'translate(-50%, -50%)',
              background:
                wave.mode === 'h'
                  ? `linear-gradient(90deg, transparent, var(--header-scan), transparent)`
                  : `linear-gradient(180deg, transparent, var(--header-scan), transparent)`,
              boxShadow: `0 0 10px var(--header-scan)`,
              pointerEvents: 'none',
              zIndex: 0,
              ['--q-from-x' as string]: wave.fromX,
              ['--q-from-y' as string]: wave.fromY,
              ['--q-to-x' as string]: wave.toX,
              ['--q-to-y' as string]: wave.toY,
              animation: `${queryEntryWave} 1.05s ease-in-out infinite`,
            }}
          />
        )}

        <Box
          aria-hidden
          className="query-pointer-sheen"
          sx={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(circle at ${sheen.x}% ${sheen.y}%, ${pointerSheen} 0%, transparent 55%)`,
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.18s ease',
            pointerEvents: 'none',
            zIndex: 0,
            mixBlendMode: 'soft-light',
          }}
        />
        <Box component="span" className="query-label">
          {label}
        </Box>
      </Button>
    </Box>
  );
};

export default QueryButton;
