import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { t } from '../../utils/translations';
import AskQuestionButton from './AskQuestionButton';

interface HomeHeaderProps {
  onOpenCreateModal: () => void;
  currentLanguage: string;
}

const HomeHeader: React.FC<HomeHeaderProps> = ({
  onOpenCreateModal,
  currentLanguage,
}) => {
  const theme = useTheme();

  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
      <Typography variant="h4" sx={{
        fontWeight: 700,
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}>
        {t('questions', currentLanguage)}
      </Typography>
      <AskQuestionButton
        label={t('new_question', currentLanguage)}
        onClick={onOpenCreateModal}
      />
    </Box>
  );
};

export default HomeHeader;
