import { Box, Skeleton as MuiSkeleton, Card, useTheme } from '@mui/material';
import { useAppSelector } from '../../../store/hooks';
import { QuestionsListSkeleton } from './QuestionsListSkeleton';
import { AnswersListSkeleton } from './AnswersListSkeleton';

export const ProfilePageSkeleton = () => {
  const theme = useTheme();
  const { name: themeName } = useAppSelector(state => state.theme);
  const isPapirus = themeName === 'papirus';

  return (
    <Box>
      {/* User Info Card Skeleton */}
      <Card sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
          <MuiSkeleton variant="circular" width={80} height={80} />
          <Box sx={{ flex: 1 }}>
            <MuiSkeleton variant="text" width="40%" height={32} sx={{ mb: 1 }} />
            <MuiSkeleton variant="text" width="60%" height={20} sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', gap: 3 }}>
              <MuiSkeleton variant="text" width={80} height={20} />
              <MuiSkeleton variant="text" width={80} height={20} />
            </Box>
          </Box>
        </Box>
      </Card>

      {/* Questions Section Skeleton */}
      <Box sx={{ mb: 4 }}>
        <MuiSkeleton variant="text" width="30%" height={32} sx={{ mb: 2 }} />
        <QuestionsListSkeleton count={3} />
      </Box>

      {/* Answers Section Skeleton */}
      <Box>
        <MuiSkeleton variant="text" width="30%" height={32} sx={{ mb: 2 }} />
        <AnswersListSkeleton count={3} />
      </Box>
    </Box>
  );
};

