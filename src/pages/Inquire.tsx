import React from 'react';
import { Box, Container, Typography, Paper } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useAppSelector } from '../store/hooks';
import { t } from '../utils/translations';

const Inquire: React.FC = () => {
  const theme = useTheme();
  const { currentLanguage } = useAppSelector(state => state.language);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper
        sx={{
          p: 4,
          textAlign: 'center',
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <Typography variant="h4" sx={{ mb: 2, color: theme.palette.text.primary }}>
          {t('inquire', currentLanguage)}
        </Typography>
        <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
          This feature is under development.
        </Typography>
      </Paper>
    </Container>
  );
};

export default Inquire;

