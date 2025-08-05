import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { Settings } from '@mui/icons-material';
import { t } from '../../utils/translations';
import { useAppSelector } from '../../store/hooks';

const AdminSettings: React.FC = () => {
  const { currentLanguage } = useAppSelector((state) => state.language);

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Settings color="primary" sx={{ fontSize: 32 }} />
        <Typography variant="h4">
          {t('admin_settings', currentLanguage)}
        </Typography>
      </Box>
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          {t('admin_settings', currentLanguage)}
        </Typography>
        <Typography color="text.secondary">
          {t('coming_soon', currentLanguage)}
        </Typography>
      </Paper>
    </Box>
  );
};

export default AdminSettings; 