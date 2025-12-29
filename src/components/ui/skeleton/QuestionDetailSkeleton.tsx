import { Box, Skeleton as MuiSkeleton, useTheme } from '@mui/material';
import { useAppSelector } from '../../../store/hooks';
import { StyledPaper } from './shared';
import { AnswersListSkeleton } from './AnswersListSkeleton';

export const QuestionDetailSkeleton = () => {
  const theme = useTheme();
  const { name: themeName } = useAppSelector(state => state.theme);
  const isPapirus = themeName === 'papirus';

  return (
    <Box>
      {/* Question Card Skeleton */}
      <StyledPaper isPapirus={isPapirus} isMagnefite={false} isAlternateTexture={false}>
        {/* Action Buttons - Sağ Üst Köşe */}
        <Box sx={(theme) => ({ 
          position: 'absolute',
          top: theme.spacing(4),
          right: theme.spacing(2),
          display: 'flex',
          gap: 0.5,
          alignItems: 'center',
          zIndex: 20,
        })}>
          <MuiSkeleton variant="circular" width={40} height={40} />
          <MuiSkeleton variant="circular" width={40} height={40} />
        </Box>

        {/* Content */}
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          {/* Parent Info (optional) */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <MuiSkeleton variant="rectangular" width={200} height={32} sx={{ borderRadius: 2 }} />
          </Box>

          {/* Yazar Bilgisi */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <MuiSkeleton variant="circular" width={40} height={40} />
            <Box>
              <MuiSkeleton variant="text" width={120} height={20} sx={{ mb: 0.5 }} />
              <MuiSkeleton variant="text" width={80} height={16} />
            </Box>
          </Box>

          {/* Kategori */}
          <Box sx={{ mb: 2 }}>
            <MuiSkeleton variant="rectangular" width={60} height={24} sx={{ borderRadius: 1 }} />
          </Box>

          {/* Başlık ve İçerik */}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', mb: 4 }}>
            <Box sx={{ flex: 1 }}>
              <MuiSkeleton variant="text" width="90%" height={40} sx={{ mb: 2 }} />
              <MuiSkeleton variant="text" width="100%" height={20} sx={{ mb: 0.5 }} />
              <MuiSkeleton variant="text" width="95%" height={20} sx={{ mb: 0.5 }} />
              <MuiSkeleton variant="text" width="90%" height={20} sx={{ mb: 0.5 }} />
              <MuiSkeleton variant="text" width="85%" height={20} sx={{ mb: 2 }} />
            </Box>
            {/* Thumbnail placeholder */}
            <MuiSkeleton variant="rectangular" width={60} height={60} sx={{ borderRadius: 1.5 }} />
          </Box>

          {/* Stats Container */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <MuiSkeleton variant="circular" width={18} height={18} />
              <MuiSkeleton variant="text" width={20} height={16} />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <MuiSkeleton variant="circular" width={18} height={18} />
              <MuiSkeleton variant="text" width={20} height={16} />
            </Box>
          </Box>
        </Box>
      </StyledPaper>

      {/* Answer Writing Section Skeleton */}
      <StyledPaper isPapirus={isPapirus} isMagnefite={false} isAlternateTexture={false} sx={{ mt: 3 }}>
        <MuiSkeleton variant="text" width="30%" height={32} sx={{ mb: 2 }} />
        <MuiSkeleton variant="rectangular" width="100%" height={300} sx={{ borderRadius: 1, mb: 2 }} />
        <MuiSkeleton variant="rectangular" width={150} height={40} sx={{ borderRadius: 1 }} />
      </StyledPaper>

      {/* Answers List Skeleton */}
      <Box sx={{ mt: 3 }}>
        <MuiSkeleton variant="text" width="20%" height={32} sx={{ mb: 2 }} />
        <AnswersListSkeleton count={3} />
      </Box>
    </Box>
  );
};

