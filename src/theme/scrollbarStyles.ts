import type { Theme } from '@mui/material/styles';

/** Tema uyumlu, zarif scrollbar stilleri */
export const getScrollbarSx = (theme: Theme) => ({
  '&::-webkit-scrollbar': {
    width: 10,
    height: 10,
  },
  '&::-webkit-scrollbar-track': {
    background: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
    borderRadius: 5,
  },
  '&::-webkit-scrollbar-thumb': {
    background: `${theme.palette.primary.main}99`,
    borderRadius: 5,
    '&:hover': {
      background: `${theme.palette.primary.main}cc`,
    },
  },
  // Firefox
  scrollbarWidth: 'thin' as const,
  scrollbarColor: `${theme.palette.primary.main}99 ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}`,
});
