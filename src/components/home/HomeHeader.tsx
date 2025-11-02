import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { FilterList, Add } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { t } from '../../utils/translations';

const FilterButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(135deg, #FFB800 0%, #FF8F00 100%)',
  color: 'white',
  borderRadius: 25,
  px: 3,
  py: 1.5,
  fontWeight: 600,
  boxShadow: '0 4px 20px rgba(255, 184, 0, 0.3)',
  '&:hover': {
    background: 'linear-gradient(135deg, #FFD54F 0%, #FFB800 100%)',
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 25px rgba(255, 184, 0, 0.4)',
  },
  transition: 'all 0.3s ease',
}));

interface HomeHeaderProps {
  onOpenCreateModal: () => void;
  onOpenFilterModal: () => void;
  currentLanguage: string;
}

const HomeHeader: React.FC<HomeHeaderProps> = ({
  onOpenCreateModal,
  onOpenFilterModal,
  currentLanguage,
}) => {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
      <Typography variant="h4" sx={{ 
        fontWeight: 700,
        background: 'linear-gradient(135deg, #FFB800 0%, #FF8F00 100%)',
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}>
        {t('questions', currentLanguage)}
      </Typography>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          onClick={onOpenCreateModal}
          startIcon={<Add />}
          sx={{
            background: 'linear-gradient(135deg, #00ED64 0%, #00C853 100%)',
            borderRadius: 12,
            px: 3,
            py: 1.5,
            fontWeight: 600,
            boxShadow: '0 4px 20px rgba(0, 237, 100, 0.3)',
            '&:hover': {
              background: 'linear-gradient(135deg, #00FF6B 0%, #00ED64 100%)',
              transform: 'translateY(-2px)',
              boxShadow: '0 6px 25px rgba(0, 237, 100, 0.4)',
            },
            transition: 'all 0.3s ease',
          }}
        >
          {t('create_question', currentLanguage)}
        </Button>
        <FilterButton
          onClick={onOpenFilterModal}
          startIcon={<FilterList />}
        >
          {t('filter', currentLanguage)}
        </FilterButton>
      </Box>
    </Box>
  );
};

export default HomeHeader;

