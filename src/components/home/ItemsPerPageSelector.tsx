import React from 'react';
import {
  Box,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  Select,
  MenuItem,
  FormControl,
  useTheme,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { t } from '../../utils/translations';
import { useAppSelector } from '../../store/hooks';
import papyrusVertical1 from '../../asset/textures/papyrus_vertical_1.png';

export type DateSortOrder = 'newest' | 'oldest';

export const dateSortToApiOrder = (sort: DateSortOrder): 'asc' | 'desc' =>
  sort === 'oldest' ? 'asc' : 'desc';

const Container = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isPapirus' && prop !== 'mode' && prop !== 'compact',
})<{ isPapirus?: boolean; mode?: 'light' | 'dark'; compact?: boolean }>(
  ({ theme, isPapirus, mode, compact }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: theme.spacing(compact ? 1 : 2),
    rowGap: theme.spacing(compact ? 1 : 1.5),
    padding: theme.spacing(compact ? 1 : 2, compact ? 1.25 : 2),
    marginBottom: theme.spacing(compact ? 1.5 : 2),
    position: 'relative',
    overflow: 'hidden',
    ...(compact
      ? {
          background: 'transparent',
          border: 'none',
          borderRadius: 0,
          borderBottom: `1px solid ${theme.palette.divider}`,
          paddingBottom: theme.spacing(1.25),
        }
      : {
          background:
            theme.palette.mode === 'dark'
              ? `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`
              : `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
          borderRadius: 12,
          border: `1px solid ${theme.palette.primary.main}33`,
          ...(isPapirus
            ? {
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
              }
            : {}),
        }),
  })
);

const radioSx = (theme: any) => ({
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
});

const compactSelectSx = {
  minWidth: 88,
  fontSize: '0.8125rem',
  '& .MuiSelect-select': {
    py: 0.5,
    px: 1.25,
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: (theme: any) => `${theme.palette.divider}`,
  },
};

interface ItemsPerPageSelectorProps {
  itemsPerPage: number;
  totalQuestions: number;
  onItemsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  currentLanguage: string;
  dateSort?: DateSortOrder;
  onDateSortChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  /** Dar kart / panel alanları için ince Select görünümü */
  variant?: 'default' | 'compact';
}

const ItemsPerPageSelector: React.FC<ItemsPerPageSelectorProps> = ({
  itemsPerPage,
  totalQuestions: _totalQuestions,
  onItemsPerPageChange,
  currentLanguage,
  dateSort = 'newest',
  onDateSortChange,
  variant = 'default',
}) => {
  const theme = useTheme();
  const { name: themeName, mode } = useAppSelector(state => state.theme);
  const isPapirus = themeName === 'papirus';
  const compact = variant === 'compact';

  if (compact) {
    return (
      <Container isPapirus={isPapirus} mode={mode} compact>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
          <Typography
            variant="caption"
            sx={{ color: 'text.secondary', whiteSpace: 'nowrap', fontWeight: 500 }}
          >
            {t('items_per_page', currentLanguage)}
          </Typography>
          <FormControl size="small" variant="outlined">
            <Select
              value={itemsPerPage.toString()}
              onChange={(e) =>
                onItemsPerPageChange({
                  target: { value: String(e.target.value) },
                } as React.ChangeEvent<HTMLInputElement>)
              }
              sx={compactSelectSx}
            >
              <MenuItem value="10">10</MenuItem>
              <MenuItem value="25">25</MenuItem>
              <MenuItem value="50">50</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {onDateSortChange && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 'auto', minWidth: 0 }}>
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', whiteSpace: 'nowrap', fontWeight: 500 }}
            >
              {t('sort_by_date', currentLanguage)}
            </Typography>
            <FormControl size="small" variant="outlined">
              <Select
                value={dateSort}
                onChange={(e) =>
                  onDateSortChange({
                    target: { value: String(e.target.value) },
                  } as React.ChangeEvent<HTMLInputElement>)
                }
                sx={{ ...compactSelectSx, minWidth: 110 }}
              >
                <MenuItem value="newest">{t('newest', currentLanguage)}</MenuItem>
                <MenuItem value="oldest">{t('oldest', currentLanguage)}</MenuItem>
              </Select>
            </FormControl>
          </Box>
        )}
      </Container>
    );
  }

  return (
    <Container isPapirus={isPapirus} mode={mode}>
      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="body2" sx={{ color: theme.palette.text.primary }}>
          {t('items_per_page', currentLanguage)}:
        </Typography>
        <RadioGroup
          row
          value={itemsPerPage.toString()}
          onChange={onItemsPerPageChange}
          sx={radioSx(theme)}
        >
          <FormControlLabel value="10" control={<Radio />} label="10" />
          <FormControlLabel value="25" control={<Radio />} label="25" />
          <FormControlLabel value="50" control={<Radio />} label="50" />
        </RadioGroup>
      </Box>

      {onDateSortChange && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
            ml: 'auto',
          }}
        >
          <Typography variant="body2" sx={{ color: theme.palette.text.primary }}>
            {t('sort_by_date', currentLanguage)}:
          </Typography>
          <RadioGroup
            row
            value={dateSort}
            onChange={onDateSortChange}
            sx={radioSx(theme)}
          >
            <FormControlLabel
              value="newest"
              control={<Radio />}
              label={t('newest', currentLanguage)}
            />
            <FormControlLabel
              value="oldest"
              control={<Radio />}
              label={t('oldest', currentLanguage)}
            />
          </RadioGroup>
        </Box>
      )}
    </Container>
  );
};

export default ItemsPerPageSelector;
