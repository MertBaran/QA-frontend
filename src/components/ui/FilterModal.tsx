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
  Slide,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  FilterList,
  Clear,
  Close,
  Search as SearchIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { categories, sortOptions } from '../../types/question';
import { t } from '../../utils/translations';
import { useAppSelector } from '../../store/hooks';

const FilterModalContainer = styled(Modal)(({ theme }) => ({
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'center',
  paddingTop: theme.spacing(8),
}));

const FilterModalContent = styled(Paper)(({ theme }) => ({
  position: 'relative',
  width: '90%',
  maxWidth: 1200,
  maxHeight: '80vh',
  background: 'linear-gradient(135deg, rgba(10, 26, 35, 0.98) 0%, rgba(21, 42, 53, 0.99) 100%)',
  border: '1px solid rgba(255, 184, 0, 0.2)',
  borderRadius: 16,
  backdropFilter: 'blur(10px)',
  color: 'white',
  padding: theme.spacing(4),
  overflow: 'auto',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
}));

const FilterSection = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

const FilterRow = styled(Grid)(({ theme }) => ({
  alignItems: 'center',
  gap: theme.spacing(2),
}));

const ActiveFilterChip = styled(Chip)(({ theme }) => ({
  background: 'linear-gradient(135deg, rgba(255, 184, 0, 0.2) 0%, rgba(255, 143, 0, 0.3) 100%)',
  color: 'white',
  border: '1px solid rgba(255, 184, 0, 0.4)',
  borderRadius: 8,
  '&:hover': {
    background: 'linear-gradient(135deg, rgba(255, 184, 0, 0.3) 0%, rgba(255, 143, 0, 0.4) 100%)',
  },
}));

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
  const { currentLanguage } = useAppSelector(state => state.language);

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
        <FilterModalContent>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
              <FilterList sx={{ mr: 1, color: '#FFB800' }} />
              {t('advanced_filters', currentLanguage)}
            </Typography>
            <IconButton 
              onClick={handleClose}
              sx={{ 
                color: 'rgba(255,255,255,0.8)',
                '&:hover': {
                  background: 'rgba(255,255,255,0.1)',
                }
              }}
            >
              <Close />
            </IconButton>
          </Box>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.2)', mb: 3 }} />

          {/* Active Filters */}
          {activeFilters.length > 0 && (
            <FilterSection>
              <Typography variant="h6" sx={{ mb: 2, color: 'rgba(255,255,255,0.9)' }}>
                {t('active_filters', currentLanguage)}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                {activeFilters.map((filter, index) => (
                  <ActiveFilterChip
                    key={index}
                    label={filter}
                    onDelete={() => onRemoveFilter(filter)}
                    size="small"
                  />
                ))}
              </Box>
            </FilterSection>
          )}

          {/* Filter Options */}
          <FilterSection>
            <Typography variant="h6" sx={{ mb: 3, color: 'rgba(255,255,255,0.9)' }}>
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
                      color: 'white',
                      '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                      '&:hover fieldset': { borderColor: 'rgba(255,184,0,0.5)' },
                      '&.Mui-focused fieldset': { borderColor: 'rgba(255,184,0,0.8)' },
                    },
                    '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
                    '& .MuiInputLabel-root.Mui-focused': { color: 'rgba(255,184,0,0.8)' },
                  }}
                />
              </Grid>

              {/* Category */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: 'rgba(255,255,255,0.7)' }}>{t('category', currentLanguage)}</InputLabel>
                  <Select
                    value={localFilters.category}
                    onChange={(e) => handleLocalFilterChange('category', e.target.value)}
                    label={t('category', currentLanguage)}
                    sx={{
                      color: 'white',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,184,0,0.5)' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,184,0,0.8)' },
                      '& .MuiSvgIcon-root': { color: 'rgba(255,255,255,0.7)' },
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
                  <InputLabel sx={{ color: 'rgba(255,255,255,0.7)' }}>{t('sorting', currentLanguage)}</InputLabel>
                  <Select
                    value={localFilters.sortBy}
                    onChange={(e) => handleLocalFilterChange('sortBy', e.target.value)}
                    label={t('sorting', currentLanguage)}
                    sx={{
                      color: 'white',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,184,0,0.5)' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,184,0,0.8)' },
                      '& .MuiSvgIcon-root': { color: 'rgba(255,255,255,0.7)' },
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
                      color: 'white',
                      '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                      '&:hover fieldset': { borderColor: 'rgba(255,184,0,0.5)' },
                      '&.Mui-focused fieldset': { borderColor: 'rgba(255,184,0,0.8)' },
                    },
                    '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
                    '& .MuiInputLabel-root.Mui-focused': { color: 'rgba(255,184,0,0.8)' },
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

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.2)', my: 3 }} />

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={handleClear}
              startIcon={<Clear />}
              sx={{
                color: 'rgba(255,255,255,0.8)',
                borderColor: 'rgba(255,255,255,0.3)',
                '&:hover': {
                  borderColor: 'rgba(255,255,255,0.5)',
                  background: 'rgba(255,255,255,0.1)',
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
                background: 'linear-gradient(135deg, #FFB800 0%, #FF8F00 100%)',
                color: 'white',
                fontWeight: 600,
                px: 4,
                '&:hover': {
                  background: 'linear-gradient(135deg, #FFD54F 0%, #FFB800 100%)',
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