import React, { useEffect, useRef, useState } from 'react';
import { Box, IconButton, InputBase, Tooltip, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Close, Search as SearchIcon } from '@mui/icons-material';
import { mountAnimationSx, reduceMotionQuery, searchIconNudge } from './headerTrioMotion';

const FIELD_HEIGHT = 42;
const MIN_SEARCH_LENGTH = 3;

interface HeaderSearchFieldProps {
  value: string;
  placeholder: string;
  clearLabel?: string;
  searchLabel?: string;
  onChange: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
  /** true iken kısa submit denemesinde hafif sarsıntı / border uyarısı */
  errorFlash?: boolean;
  onErrorFlashEnd?: () => void;
}

const HeaderSearchField: React.FC<HeaderSearchFieldProps> = ({
  value,
  placeholder,
  clearLabel = 'Clear',
  searchLabel = 'Search',
  onChange,
  onSubmit,
  errorFlash = false,
  onErrorFlashEnd,
}) => {
  const theme = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);
  const nudgeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [focused, setFocused] = useState(false);
  const [nudge, setNudge] = useState(false);

  useEffect(() => {
    return () => {
      if (nudgeTimerRef.current) clearTimeout(nudgeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!errorFlash) return;
    const t = window.setTimeout(() => onErrorFlashEnd?.(), 480);
    return () => clearTimeout(t);
  }, [errorFlash, onErrorFlashEnd]);

  const triggerNudge = () => {
    setNudge(true);
    if (nudgeTimerRef.current) clearTimeout(nudgeTimerRef.current);
    nudgeTimerRef.current = setTimeout(() => setNudge(false), 280);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    triggerNudge();
    onSubmit(event);
  };

  const handleClear = () => {
    onChange('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      if (value) {
        event.preventDefault();
        handleClear();
      } else {
        inputRef.current?.blur();
      }
    }
  };

  const canClear = value.length > 0;
  const borderColor = errorFlash
    ? theme.palette.error.main
    : focused
      ? theme.palette.primary.main
      : theme.palette.divider;

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      role="search"
      sx={{
        ...mountAnimationSx(80),
        flex: '1 1 auto',
        minWidth: 72,
        display: 'flex',
        alignItems: 'center',
        height: FIELD_HEIGHT,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          height: FIELD_HEIGHT,
          minWidth: 0,
          pl: 1.5,
          pr: 0.5,
          gap: 0.25,
          borderRadius: 2,
          border: `1px solid ${borderColor}`,
          backgroundColor: focused
            ? theme.palette.mode === 'dark'
              ? alpha(theme.palette.common.white, 0.06)
              : theme.palette.background.paper
            : theme.palette.mode === 'dark'
              ? alpha(theme.palette.common.white, 0.04)
              : alpha(theme.palette.common.black, 0.03),
          boxShadow: errorFlash
            ? `0 0 0 2px ${alpha(theme.palette.error.main, 0.2)}`
            : focused
              ? `0 0 0 2px ${alpha(theme.palette.primary.main, 0.16)}`
              : 'none',
          transition: 'border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease',
          '&:hover': {
            borderColor: errorFlash
              ? theme.palette.error.main
              : focused
                ? theme.palette.primary.main
                : theme.palette.text.disabled,
          },
          ...(errorFlash && {
            '@keyframes searchShake': {
              '0%, 100%': { transform: 'translateX(0)' },
              '25%': { transform: 'translateX(-3px)' },
              '75%': { transform: 'translateX(3px)' },
            },
            animation: 'searchShake 0.35s ease',
            [reduceMotionQuery]: { animation: 'none' },
          }),
        }}
      >
        <InputBase
          inputRef={inputRef}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={handleKeyDown}
          inputProps={{
            'aria-label': searchLabel,
            enterKeyHint: 'search',
          }}
          sx={{
            flex: 1,
            minWidth: 0,
            height: '100%',
            '& .MuiInputBase-input': {
              py: 0,
              px: 0,
              height: FIELD_HEIGHT - 2,
              lineHeight: `${FIELD_HEIGHT - 2}px`,
              fontSize: '0.925rem',
              color: theme.palette.text.primary,
              '&::placeholder': {
                color: theme.palette.text.secondary,
                opacity: 0.85,
              },
            },
          }}
        />

        {canClear && (
          <Tooltip title={clearLabel}>
            <IconButton
              type="button"
              size="small"
              aria-label={clearLabel}
              onClick={handleClear}
              sx={{
                width: 32,
                height: 32,
                flexShrink: 0,
                color: theme.palette.text.secondary,
                '&:hover': {
                  color: theme.palette.text.primary,
                  backgroundColor: alpha(theme.palette.text.primary, 0.06),
                },
              }}
            >
              <Close sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        )}

        <Tooltip title={searchLabel}>
          <IconButton
            type="submit"
            size="small"
            aria-label={searchLabel}
            sx={{
              width: 34,
              height: 34,
              flexShrink: 0,
              color: focused || value.trim().length >= MIN_SEARCH_LENGTH
                ? theme.palette.primary.main
                : theme.palette.text.secondary,
              '&:hover': {
                color: theme.palette.primary.main,
                backgroundColor: alpha(theme.palette.primary.main, 0.08),
              },
              '& .MuiSvgIcon-root': {
                fontSize: 22,
                display: 'block',
                ...(nudge && {
                  animation: `${searchIconNudge} 0.28s ease`,
                }),
              },
              [reduceMotionQuery]: {
                '& .MuiSvgIcon-root': { animation: 'none !important' },
              },
            }}
          >
            <SearchIcon />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default HeaderSearchField;
export { MIN_SEARCH_LENGTH, FIELD_HEIGHT };
