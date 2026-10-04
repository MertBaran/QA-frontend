import React, { ReactNode } from 'react';
import { Box } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import type { QueryMatchExplanation } from '../../types/query';
import QueryMatchBadges from './QueryMatchBadges';

interface Props {
  matches: QueryMatchExplanation[];
  currentLanguage: string;
  children: ReactNode;
}

/** Groups match-reason strip + content card as one visual unit. */
const QueryResultItem: React.FC<Props> = ({ matches, currentLanguage, children }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        mb: 2.5,
        borderRadius: 1.5,
        overflow: 'hidden',
        border: `1px solid ${alpha(theme.palette.divider, 0.4)}`,
        backgroundColor: theme.palette.background.paper,
      }}
    >
      <QueryMatchBadges matches={matches} currentLanguage={currentLanguage} embedded />
      <Box
        sx={{
          // Soften nested card chrome so the outer shell reads as one unit
          '& > *': {
            mb: '0 !important',
            borderRadius: '0 !important',
            boxShadow: 'none !important',
            border: 'none !important',
          },
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default QueryResultItem;
