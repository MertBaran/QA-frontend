import React from 'react';
import { Box, Typography } from '@mui/material';
import { Construction } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { t } from '../../utils/translations';
import { useAppSelector } from '../../store/hooks';

const MaintenanceScreen: React.FC = () => {
  const theme = useTheme();
  const { currentLanguage } = useAppSelector((state) => state.language);
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: isDark ? 'background.default' : 'grey.100',
        p: 3,
      }}
    >
      <Construction
        sx={{
          fontSize: 80,
          color: 'primary.main',
          mb: 2,
          opacity: 0.9,
        }}
      />
      <Typography variant="h5" fontWeight={600} gutterBottom color="text.primary">
        {t('maintenance_title', currentLanguage)}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', maxWidth: 400 }}>
        {t('maintenance_message', currentLanguage)}
      </Typography>
    </Box>
  );
};

export default MaintenanceScreen;
