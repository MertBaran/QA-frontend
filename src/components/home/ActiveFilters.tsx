import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { styled } from '@mui/material/styles';

const ActiveFilterChip = styled(Box)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.main}33 0%, ${theme.palette.primary.dark}4D 100%)`,
  color: theme.palette.text.primary,
  border: `1px solid ${theme.palette.primary.main}66`,
  borderRadius: 8,
  padding: theme.spacing(0.5, 1),
  cursor: 'pointer',
  fontSize: '0.875rem',
  '&:hover': {
    background: `linear-gradient(135deg, ${theme.palette.primary.main}4D 0%, ${theme.palette.primary.dark}66 100%)`,
  },
}));

interface ActiveFiltersProps {
  filters: string[];
  onRemoveFilter: (filter: string) => void;
}

const ActiveFilters: React.FC<ActiveFiltersProps> = ({ filters, onRemoveFilter }) => {
  const theme = useTheme();
  
  if (filters.length === 0) return null;

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 1 }}>
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

