import React from 'react';
import { Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

const ActiveFilterChip = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(135deg, rgba(255, 184, 0, 0.2) 0%, rgba(255, 143, 0, 0.3) 100%)',
  color: 'white',
  border: '1px solid rgba(255, 184, 0, 0.4)',
  borderRadius: 8,
  padding: theme.spacing(0.5, 1),
  cursor: 'pointer',
  fontSize: '0.875rem',
  '&:hover': {
    background: 'linear-gradient(135deg, rgba(255, 184, 0, 0.3) 0%, rgba(255, 143, 0, 0.4) 100%)',
  },
}));

interface ActiveFiltersProps {
  filters: string[];
  onRemoveFilter: (filter: string) => void;
}

const ActiveFilters: React.FC<ActiveFiltersProps> = ({ filters, onRemoveFilter }) => {
  if (filters.length === 0) return null;

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mb: 1 }}>
        Aktif Filtreler:
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {filters.map((filter, index) => (
          <ActiveFilterChip
            key={index}
            onClick={() => onRemoveFilter(filter)}
          >
            {filter}
          </ActiveFilterChip>
        ))}
      </Box>
    </Box>
  );
};

export default ActiveFilters;

