import React from 'react';
import { Box, Typography, Button, useTheme } from '@mui/material';
import { FilterList, Add } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { t } from '../../utils/translations';
import { useAppSelector } from '../../store/hooks';

const FilterButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== 'isMagnefite',
})<{ isMagnefite?: boolean }>(({ theme, isMagnefite }) => {
  // Magnefite'da gri kullan
  const primaryColor = isMagnefite
    ? (theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280') // Gray
    : theme.palette.primary.main;
  const primaryLight = isMagnefite
    ? (theme.palette.mode === 'dark' ? '#D1D5DB' : '#9CA3AF') // Lighter gray
    : theme.palette.primary.light;
  const primaryDark = isMagnefite
    ? (theme.palette.mode === 'dark' ? '#6B7280' : '#4B5563') // Darker gray
    : theme.palette.primary.dark;
  
  return {
    background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryDark} 100%)`,
    color: theme.palette.primary.contrastText || 'white',
    borderRadius: 25,
    px: 3,
    py: 1.5,
    fontWeight: 600,
    boxShadow: `0 4px 20px ${primaryColor}33`,
    '&:hover': {
      background: `linear-gradient(135deg, ${primaryLight} 0%, ${primaryColor} 100%)`,
      transform: 'translateY(-2px)',
      boxShadow: `0 6px 25px ${primaryColor}66`,
    },
    transition: 'all 0.3s ease',
  };
});

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
  const theme = useTheme();
  const { name: themeName } = useAppSelector(state => state.theme);
  
  // Molume temasında yeşil, diğer temalarda success rengini kullan
  const getCreateButtonColors = () => {
    if (themeName === 'molume') {
      return {
        main: '#00ED64',
        light: '#00FF6B',
        dark: '#00C853',
        contrastText: '#000000',
      };
    }
    return {
      main: theme.palette.success.main,
      light: theme.palette.success.light,
      dark: theme.palette.success.dark,
      contrastText: theme.palette.success.contrastText || 'white',
    };
  };

  const createButtonColors = getCreateButtonColors();
  
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
      <Typography variant="h4" sx={{ 
        fontWeight: 700,
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
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
            background: `linear-gradient(135deg, ${createButtonColors.main} 0%, ${createButtonColors.dark} 100%)`,
            color: createButtonColors.contrastText,
            borderRadius: 12,
            px: 3,
            py: 1.5,
            fontWeight: 600,
            boxShadow: `0 4px 20px ${createButtonColors.main}33`,
            '&:hover': {
              background: `linear-gradient(135deg, ${createButtonColors.light} 0%, ${createButtonColors.main} 100%)`,
              transform: 'translateY(-2px)',
              boxShadow: `0 6px 25px ${createButtonColors.main}66`,
            },
            transition: 'all 0.3s ease',
          }}
        >
          {t('create_question', currentLanguage)}
        </Button>
        <FilterButton
          onClick={onOpenFilterModal}
          startIcon={<FilterList />}
          isMagnefite={themeName === 'magnefite'}
        >
          {t('filter', currentLanguage)}
        </FilterButton>
      </Box>
    </Box>
  );
};

export default HomeHeader;

