import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material';
import { Palette } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setTheme } from '../../store/theme/themeSlice';
import { t } from '../../utils/translations';
import themeMolumeIcon from '../../asset/icons/home/themes/theme_molume.png';
import themePapirusIcon from '../../asset/icons/home/themes/theme_papirus.png';
import themeMagnefiteIcon from '../../asset/icons/home/themes/theme_magnefite.png';

const StyledMenuItem = styled(MenuItem)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '12px 16px',
  '&:hover': {
    backgroundColor: `${theme.palette.primary.main}22`,
  },
  '&.Mui-selected': {
    backgroundColor: `${theme.palette.primary.main}33`,
    '&:hover': {
      backgroundColor: `${theme.palette.primary.main}44`,
    },
  },
}));

const themes = [
  {
    id: 'molume' as const,
    nameKey: 'molume',
    icon: themeMolumeIcon,
  },
  {
    id: 'papirus' as const,
    nameKey: 'papirus',
    icon: themePapirusIcon,
  },
  {
    id: 'magnefite' as const,
    nameKey: 'magnefite',
    icon: themeMagnefiteIcon,
  },
];

const ThemeSelector = () => {
  const dispatch = useAppDispatch();
  const { name: themeName } = useAppSelector((state) => state.theme);
  const { currentLanguage } = useAppSelector((state) => state.language);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleThemeSelect = (selectedThemeName: 'molume' | 'papirus' | 'magnefite') => {
    dispatch(setTheme(selectedThemeName));
    handleClose();
  };

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleClick}
        sx={(theme) => ({
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
          '&:hover': {
            background: `${theme.palette.primary.main}22`,
          },
        })}
      >
        <Palette />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: (theme) => ({
            borderRadius: 1,
            boxShadow: theme.palette.mode === 'dark'
              ? `0 8px 32px ${theme.palette.primary.main}22`
              : `0 8px 32px ${theme.palette.grey[400]}33`,
            border: `1px solid ${theme.palette.primary.main}33`,
            background: theme.palette.mode === 'dark'
              ? `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`
              : theme.palette.background.paper,
            backdropFilter: 'blur(10px)',
            minWidth: 200,
            color: theme.palette.text.primary,
          }),
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {themes.map((themeItem) => (
          <StyledMenuItem
            key={themeItem.id}
            selected={themeName === themeItem.id}
            onClick={() => handleThemeSelect(themeItem.id)}
          >
            <Box
              component="img"
              src={themeItem.icon}
              alt={themeItem.id}
              sx={{
                width: 32,
                height: 24,
                objectFit: 'contain',
                borderRadius: 1,
              }}
            />
            <Typography variant="body2">
              {t(themeItem.nameKey, currentLanguage)}
            </Typography>
          </StyledMenuItem>
        ))}
      </Menu>
    </>
  );
};

export default ThemeSelector;