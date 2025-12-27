import React, { useState } from 'react';
import {
  Box,
  Modal,
  Paper,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  IconButton,
  Grid,
  Divider,
  Fade,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  FilterList,
  Clear,
  Close,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { categories, sortOptions } from '../../types/question';
import { t } from '../../utils/translations';
import { useAppSelector } from '../../store/hooks';
import { useTheme } from '@mui/material/styles';

const FilterModalContainer = styled(Modal)(({ theme }) => ({
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'center',
  paddingTop: theme.spacing(8),
}));

const FilterModalContent = styled(Paper, {
  shouldForwardProp: (prop) => prop !== 'themeName',
})<{ themeName?: string }>(({ theme, themeName }) => {
  const isMolume = themeName === 'molume';
  const isMagnefite = themeName === 'magnefite';
  const isPapirus = themeName === 'papirus';
  
  // Tema bazlı renkler
  let borderColor = theme.palette.primary.main;
  let bgGradient = theme.palette.mode === 'dark'
    ? `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`
    : `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`;
  
  if (isMolume) {
    borderColor = theme.palette.primary.main;
  } else if (isMagnefite) {
    borderColor = theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280';
  } else if (isPapirus) {
    borderColor = theme.palette.mode === 'dark' ? '#8B6F47' : '#A0826D';
  }
  
  return {
    position: 'relative',
    width: '90%',
    maxWidth: 1200,
    maxHeight: '80vh',
    background: bgGradient,
    border: `1px solid ${borderColor}33`,
    borderRadius: 16,
    backdropFilter: theme.palette.mode === 'dark' ? 'blur(10px)' : 'none',
    color: theme.palette.text.primary,
    padding: theme.spacing(4),
    overflow: 'auto',
    boxShadow: theme.palette.mode === 'dark'
      ? `0 8px 32px ${theme.palette.primary.main}22`
      : `0 8px 32px ${theme.palette.grey[400]}33`,
  };
});

const FilterSection = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

const FilterRow = styled(Grid)(({ theme }) => ({
  alignItems: 'center',
  gap: theme.spacing(2),
}));

const ActiveFilterChip = styled(Chip, {
  shouldForwardProp: (prop) => prop !== 'themeName',
})<{ themeName?: string }>(({ theme, themeName }) => {
  const isMolume = themeName === 'molume';
  const isMagnefite = themeName === 'magnefite';
  const isPapirus = themeName === 'papirus';
  
  let chipColor = theme.palette.primary.main;
  if (isMolume) {
    chipColor = theme.palette.primary.main;
  } else if (isMagnefite) {
    chipColor = theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280';
  } else if (isPapirus) {
    chipColor = theme.palette.mode === 'dark' ? '#8B6F47' : '#A0826D';
  }
  
  return {
    background: `linear-gradient(135deg, ${chipColor}33 0%, ${chipColor}44 100%)`,
    color: theme.palette.text.primary,
    border: `1px solid ${chipColor}66`,
    borderRadius: 8,
    '&:hover': {
      background: `linear-gradient(135deg, ${chipColor}44 0%, ${chipColor}55 100%)`,
    },
  };
});

interface FilterModalProps {
  open: boolean;
  onClose: () => void;
  filters: {
    search: string;
    category: string;
    tags: string;
    sortBy: string;
    savedOnly?: string;
  };
  onFilterChange: (field: string, value: string) => void;
  onApplyFilters: (applied: { search: string; category: string; tags: string; sortBy: string; savedOnly?: string }) => void;
  onClearFilters: () => void;
  activeFilters: string[];
  onRemoveFilter: (filter: string) => void;
}

const FilterModal: React.FC<FilterModalProps> = ({
  open,
  onClose,
  filters,
  onFilterChange,
  onApplyFilters,
  onClearFilters,
  activeFilters,
  onRemoveFilter,
}) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const theme = useTheme();
  const { currentLanguage } = useAppSelector(state => state.language);
  const { name: themeName } = useAppSelector(state => state.theme);
  
  const isMolume = themeName === 'molume';
  const isMagnefite = themeName === 'magnefite';
  const isPapirus = themeName === 'papirus';
  
  // Tema bazlı renkler
  let primaryColor = theme.palette.primary.main;
  let primaryLight = theme.palette.primary.light;
  let primaryDark = theme.palette.primary.dark;
  
  if (isMolume) {
    primaryColor = theme.palette.primary.main;
    primaryLight = theme.palette.primary.light;
    primaryDark = theme.palette.primary.dark;
  } else if (isMagnefite) {
    primaryColor = theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280';
    primaryLight = theme.palette.mode === 'dark' ? '#D1D5DB' : '#9CA3AF';
    primaryDark = theme.palette.mode === 'dark' ? '#6B7280' : '#4B5563';
  } else if (isPapirus) {
    primaryColor = theme.palette.mode === 'dark' ? '#8B6F47' : '#A0826D';
    primaryLight = theme.palette.mode === 'dark' ? '#A0826D' : '#B8956F';
    primaryDark = theme.palette.mode === 'dark' ? '#6B5739' : '#8B6F47';
  }

  const handleLocalFilterChange = (field: string, value: string) => {
    setLocalFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleApply = () => {
    // Local filters'ı parent'a gönder
    Object.entries(localFilters).forEach(([key, value]) => {
      onFilterChange(key, value);
    });
    onApplyFilters(localFilters as any);
    onClose();
  };

  const handleClear = () => {
    setLocalFilters({
      search: '',
      category: '',
      tags: '',
      sortBy: 'En Yeni',
      savedOnly: 'false',
    } as any);
    onClearFilters();
  };

  const handleClose = () => {
    // Local filters'ı reset et
    setLocalFilters(filters);
    onClose();
  };

  return (
    <FilterModalContainer
      open={open}
      onClose={handleClose}
      aria-labelledby="filter-modal-title"
      aria-describedby="filter-modal-description"
    >
      <Fade in={open}>
        <FilterModalContent themeName={themeName}>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', color: theme.palette.text.primary }}>
              <FilterList sx={{ mr: 1, color: primaryColor }} />
              {t('advanced_filters', currentLanguage)}
            </Typography>
            <IconButton 
              onClick={handleClose}
              sx={{ 
                color: theme.palette.text.secondary,
                '&:hover': {
                  background: theme.palette.action.hover,
                }
              }}
            >
              <Close />
            </IconButton>
          </Box>

          <Divider sx={{ borderColor: theme.palette.divider, mb: 3 }} />

          {/* Active Filters */}
          {activeFilters.length > 0 && (
            <FilterSection>
              <Typography variant="h6" sx={{ mb: 2, color: theme.palette.text.primary }}>
                {t('active_filters', currentLanguage)}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                {activeFilters.map((filter, index) => (
                  <ActiveFilterChip
                    key={index}
                    label={filter}
                    onDelete={() => onRemoveFilter(filter)}
                    size="small"
                    themeName={themeName}
                  />
                ))}
              </Box>
            </FilterSection>
          )}

          {/* Filter Options */}
          <FilterSection>
            <Typography variant="h6" sx={{ mb: 3, color: theme.palette.text.primary }}>
              {t('filter_options', currentLanguage)}
            </Typography>
            
            <FilterRow container spacing={3}>
              {/* Search */}
              <Grid item xs={12} md={6}>
                <TextField
                  label={t('search', currentLanguage)}
                  variant="outlined"
                  fullWidth
                  value={localFilters.search}
                  onChange={(e) => handleLocalFilterChange('search', e.target.value)}
                  placeholder={t('search_placeholder', currentLanguage)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: theme.palette.text.primary,
                      '& fieldset': { borderColor: theme.palette.divider },
                      '&:hover fieldset': { borderColor: `${primaryColor}80` },
                      '&.Mui-focused fieldset': { borderColor: primaryColor },
                    },
                    '& .MuiInputLabel-root': { color: theme.palette.text.secondary },
                    '& .MuiInputLabel-root.Mui-focused': { color: primaryColor },
                  }}
                />
              </Grid>

              {/* Category */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: theme.palette.text.secondary }}>{t('category', currentLanguage)}</InputLabel>
                  <Select
                    value={localFilters.category}
                    onChange={(e) => handleLocalFilterChange('category', e.target.value)}
                    label={t('category', currentLanguage)}
                    sx={{
                      color: theme.palette.text.primary,
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.divider },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: `${primaryColor}80` },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: primaryColor },
                      '& .MuiSvgIcon-root': { color: theme.palette.text.secondary },
                    }}
                  >
                    <MenuItem value="">{t('all_categories', currentLanguage)}</MenuItem>
                    {categories.map((category) => (
                      <MenuItem key={category} value={category}>{category}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>



              {/* Sorting */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: theme.palette.text.secondary }}>{t('sorting', currentLanguage)}</InputLabel>
                  <Select
                    value={localFilters.sortBy}
                    onChange={(e) => handleLocalFilterChange('sortBy', e.target.value)}
                    label={t('sorting', currentLanguage)}
                    sx={{
                      color: theme.palette.text.primary,
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.divider },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: `${primaryColor}80` },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: primaryColor },
                      '& .MuiSvgIcon-root': { color: theme.palette.text.secondary },
                    }}
                  >
                    {sortOptions.map((option) => (
                      <MenuItem key={option} value={option}>{option}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Tags */}
              <Grid item xs={12}>
                <TextField
                  label={t('tags_label', currentLanguage)}
                  variant="outlined"
                  fullWidth
                  value={localFilters.tags}
                  onChange={(e) => handleLocalFilterChange('tags', e.target.value)}
                  placeholder={t('tags_placeholder', currentLanguage)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: theme.palette.text.primary,
                      '& fieldset': { borderColor: theme.palette.divider },
                      '&:hover fieldset': { borderColor: `${primaryColor}80` },
                      '&.Mui-focused fieldset': { borderColor: primaryColor },
                    },
                    '& .MuiInputLabel-root': { color: theme.palette.text.secondary },
                    '& .MuiInputLabel-root.Mui-focused': { color: primaryColor },
                  }}
                />
              </Grid>

              {/* Saved Only */}
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={localFilters as any && (localFilters as any).savedOnly === 'true'}
                      onChange={(e) =>
                        handleLocalFilterChange('savedOnly', e.target.checked ? 'true' : 'false')
                      }
                      color="primary"
                    />
                  }
                  label={t('saved_only', currentLanguage)}
                />
              </Grid>
            </FilterRow>
          </FilterSection>

          <Divider sx={{ borderColor: theme.palette.divider, my: 3 }} />

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={handleClear}
              startIcon={<Clear />}
              sx={{
                color: theme.palette.text.secondary,
                borderColor: theme.palette.divider,
                '&:hover': {
                  borderColor: primaryColor,
                  background: theme.palette.action.hover,
                },
              }}
            >
              {t('reset_filters', currentLanguage)}
            </Button>
            <Button
              variant="contained"
              onClick={handleApply}
              startIcon={<FilterList />}
              sx={{
                background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryDark} 100%)`,
                color: theme.palette.getContrastText(primaryColor),
                fontWeight: 600,
                px: 4,
                '&:hover': {
                  background: `linear-gradient(135deg, ${primaryLight} 0%, ${primaryColor} 100%)`,
                },
              }}
            >
              {t('filter', currentLanguage)}
            </Button>
          </Box>
        </FilterModalContent>
      </Fade>
    </FilterModalContainer>
  );
};

export default FilterModal; 