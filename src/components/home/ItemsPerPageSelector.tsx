import React from 'react';
import { Box, Typography, RadioGroup, FormControlLabel, Radio } from '@mui/material';
import { styled } from '@mui/material/styles';
import { t } from '../../utils/translations';

const Container = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  padding: theme.spacing(2),
  background: 'linear-gradient(135deg, rgba(30, 58, 71, 0.95) 0%, rgba(21, 42, 53, 0.98) 100%)',
  borderRadius: 12,
  border: '1px solid rgba(255, 184, 0, 0.15)',
  marginBottom: theme.spacing(2),
}));

interface ItemsPerPageSelectorProps {
  itemsPerPage: number;
  totalQuestions: number;
  onItemsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  currentLanguage: string;
}

const ItemsPerPageSelector: React.FC<ItemsPerPageSelectorProps> = ({
  itemsPerPage,
  totalQuestions,
  onItemsPerPageChange,
  currentLanguage,
}) => {
  return (
    <Container>
      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
        {t('items_per_page', currentLanguage)}:
      </Typography>
      <RadioGroup
        row
        value={itemsPerPage.toString()}
        onChange={onItemsPerPageChange}
        sx={{
          '& .MuiFormControlLabel-root': {
            margin: 0,
            marginRight: 2,
          },
          '& .MuiRadio-root': {
            color: 'rgba(255,255,255,0.7)',
            '&.Mui-checked': {
              color: '#FFB800',
            },
          },
          '& .MuiFormControlLabel-label': {
            color: 'rgba(255,255,255,0.8)',
            fontSize: '0.875rem',
          },
        }}
      >
        <FormControlLabel value="10" control={<Radio />} label="10" />
        <FormControlLabel value="25" control={<Radio />} label="25" />
        <FormControlLabel value="50" control={<Radio />} label="50" />
      </RadioGroup>
      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', ml: 'auto' }}>
        {t('total_questions', currentLanguage)}: {totalQuestions}
      </Typography>
    </Container>
  );
};

export default ItemsPerPageSelector;

