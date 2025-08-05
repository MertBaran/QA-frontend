import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { Security } from '@mui/icons-material';
import { t } from '../../utils/translations';
import { useAppSelector } from '../../store/hooks';

const AdminPermissions: React.FC = () => {
  const { currentLanguage } = useAppSelector((state) => state.language);

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Security color="primary" sx={{ fontSize: 32 }} />
        <Typography variant="h4">
          {t('permission_management', currentLanguage)}
        </Typography>
      </Box>
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          {t('permission_management', currentLanguage)}
        </Typography>
        <Typography color="text.secondary">
          {t('coming_soon', currentLanguage)}
        </Typography>
      </Paper>
    </Box>
  );
};

export default AdminPermissions; 