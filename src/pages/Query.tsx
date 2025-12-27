import React from 'react';
import { Container, Typography, Paper } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useAppSelector } from '../store/hooks';
import { t } from '../utils/translations';

const Query: React.FC = () => {
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
          {t('query', currentLanguage)}
        </Typography>
        <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
          This feature is under development.
        </Typography>
      </Paper>
    </Container>
  );
};

export default Query;

