import React from 'react';
import { Box, Typography, RadioGroup, FormControlLabel, Radio, useTheme } from '@mui/material';
import { styled } from '@mui/material/styles';
import { t } from '../../utils/translations';
import { useAppSelector } from '../../store/hooks';
import papyrusVertical1 from '../../asset/textures/papyrus_vertical_1.png';

const Container = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isPapirus' && prop !== 'mode',
})<{ isPapirus?: boolean; mode?: 'light' | 'dark' }>(({ theme, isPapirus, mode }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  padding: theme.spacing(2),
  background: theme.palette.mode === 'dark'
    ? `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`
    : `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
  borderRadius: 12,
  border: `1px solid ${theme.palette.primary.main}33`,
  marginBottom: theme.spacing(2),
  position: 'relative',
  overflow: 'hidden',
  ...(isPapirus ? {
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundImage: `url(${papyrusVertical1})`,
      backgroundSize: '120%',
      backgroundPosition: 'center 15%',
      backgroundRepeat: 'no-repeat',
      opacity: mode === 'dark' ? 0.12 : 0.15,
      pointerEvents: 'none',
      zIndex: 0,
    },
    '& > *': {
      position: 'relative',
      zIndex: 1,
    },
  } : {}),
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
  const theme = useTheme();
  const { name: themeName, mode } = useAppSelector(state => state.theme);
  const isPapirus = themeName === 'papirus';
  
  return (
    <Container isPapirus={isPapirus} mode={mode}>
      <Typography variant="body2" sx={{ color: theme.palette.text.primary }}>
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
            color: theme.palette.text.secondary,
            '&.Mui-checked': {
              color: theme.palette.primary.main,
            },
          },
          '& .MuiFormControlLabel-label': {
            color: theme.palette.text.primary,
            fontSize: '0.875rem',
          },
        }}
      >
        <FormControlLabel value="10" control={<Radio />} label="10" />
        <FormControlLabel value="25" control={<Radio />} label="25" />
        <FormControlLabel value="50" control={<Radio />} label="50" />
      </RadioGroup>
    </Container>
  );
};

export default ItemsPerPageSelector;
