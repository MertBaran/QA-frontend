import React, { useState } from 'react';
import { Box, IconButton } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { getScrollbarSx } from '../../theme/scrollbarStyles';
import { referenceNotchColor } from '../../theme/referenceNotchColor';
import { useAppSelector } from '../../store/hooks';

interface InlineSidePanelProps {
  open: boolean;
  onToggle: () => void;
  label: string;
  children: React.ReactNode;
  width?: number;
  /** Yazma kartında düğme editörün üstünde, sağ üst köşede durur. */
  buttonPosition?: 'inside' | 'corner';
  /** Referans, dosya veya metadata varsa dolu renk; yoksa boş renk. */
  hasContent?: boolean;
}

const MAX_EXTRA = 520;
const FIT_MAX_WIDTH = 480;
const FIT_MAX_HEIGHT = 520;

/** Cevap kutusunun sağında açılan panel. Sağ ve alt kenardan büyütülebilir. */
const InlineSidePanel: React.FC<InlineSidePanelProps> = ({
  open,
  onToggle,
  label,
  children,
  width = 340,
  buttonPosition = 'inside',
  hasContent,
}) => {
  const theme = useTheme();
  const themeName = useAppSelector(state => state.theme.name);
  const [extraWidth, setExtraWidth] = useState(0);
  const [extraHeight, setExtraHeight] = useState(0);
  const [resizing, setResizing] = useState(false);

  const startResize = (axis: 'x' | 'y' | 'both') => (event: React.PointerEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const originX = event.clientX;
    const originY = event.clientY;
    const baseWidth = extraWidth;
    const baseHeight = extraHeight;
    setResizing(true);
    const onMove = (moveEvent: PointerEvent) => {
      if (axis !== 'y') {
        setExtraWidth(Math.min(MAX_EXTRA, Math.max(0, baseWidth + moveEvent.clientX - originX)));
      }
      if (axis !== 'x') {
        setExtraHeight(Math.min(MAX_EXTRA, Math.max(0, baseHeight + moveEvent.clientY - originY)));
      }
    };
    const onUp = () => {
      setResizing(false);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  return (
    <Box onClick={event => event.stopPropagation()} sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 8 }}>
      <IconButton
        size="small"
        aria-label={label}
        onClick={event => {
          event.stopPropagation();
          onToggle();
        }}
        sx={{
          pointerEvents: 'auto',
          position: 'absolute',
          top: buttonPosition === 'corner' ? 10 : 72,
          right: buttonPosition === 'corner' ? 10 : 12,
          width: buttonPosition === 'corner' ? 32 : 36,
          height: buttonPosition === 'corner' ? 32 : 64,
          borderRadius: '8px',
          color: 'text.secondary',
          bgcolor: 'background.paper',
          border: 1,
          borderColor: 'divider',
          boxShadow: 1,
          zIndex: 2,
        }}
      >
        {open ? <ChevronRight fontSize="small" /> : <ChevronLeft fontSize="small" />}
        {hasContent !== undefined && (
          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              bottom: buttonPosition === 'corner' ? 3 : 8,
              left: '50%',
              width: 6,
              height: 6,
              borderRadius: '50%',
              transform: 'translateX(-50%)',
              bgcolor: referenceNotchColor(themeName, theme.palette.mode, !!hasContent),
            }}
          />
        )}
      </IconButton>
      {open && (
        <Box
          sx={{
            pointerEvents: 'auto',
            position: 'absolute',
            top: 0,
            left: '100%',
            display: 'flex',
            flexDirection: 'column',
            width: 'max-content',
            minWidth: width,
            maxWidth: FIT_MAX_WIDTH + extraWidth,
            height: 'fit-content',
            maxHeight: `min(calc(100vh - 96px), ${FIT_MAX_HEIGHT + extraHeight}px)`,
            transition: resizing ? 'none' : 'max-width 220ms ease, max-height 220ms ease',
          }}
        >
        <Box
          sx={{
            position: 'relative',
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            display: 'flex',
            maxHeight: 'inherit',
            bgcolor: 'background.paper',
            border: 1,
            borderColor: 'divider',
            borderRadius: '0 12px 12px 0',
            boxShadow: 3,
          }}
        >
          <Box sx={theme => ({ flex: 1, width: '100%', minWidth: 0, minHeight: 0, overflow: 'auto', p: 1.5, ...getScrollbarSx(theme) })}>{children}</Box>
          <Box
            onPointerDown={startResize('x')}
            sx={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 12,
              width: 8,
              cursor: 'col-resize',
              touchAction: 'none',
            }}
          />
          <Box
            onPointerDown={startResize('y')}
            sx={{
              position: 'absolute',
              left: 0,
              right: 12,
              bottom: 0,
              height: 8,
              cursor: 'row-resize',
              touchAction: 'none',
            }}
          />
          <Box
            onPointerDown={startResize('both')}
            sx={{
              position: 'absolute',
              right: 0,
              bottom: 0,
              width: 14,
              height: 14,
              cursor: 'nwse-resize',
              touchAction: 'none',
            }}
          />
        </Box>
        </Box>
      )}
    </Box>
  );
};

export default InlineSidePanel;
