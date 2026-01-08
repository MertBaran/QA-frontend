import { Box, Skeleton as MuiSkeleton, useTheme } from '@mui/material';
import { useAppSelector } from '../../../store/hooks';
import { AnswerCardStyledPaper } from './shared';

export const AnswerCardSkeleton = ({ isAlternateTexture = false }: { isAlternateTexture?: boolean }) => {
  const theme = useTheme();
  const { name: themeName } = useAppSelector(state => state.theme);
  const isPapirus = themeName === 'papirus';
  const isMagnefite = themeName === 'magnefite';

  return (
    <AnswerCardStyledPaper isPapirus={isPapirus} isMagnefite={isMagnefite} isAlternateTexture={isAlternateTexture}>
      {/* Action Buttons - Sağ Üst Köşe */}
      <Box sx={(theme) => ({ 
        position: 'absolute',
        top: theme.spacing(1),
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
        {/* Avatar ve Kullanıcı Bilgisi */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
          <MuiSkeleton variant="circular" width={48} height={48} />
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <MuiSkeleton variant="text" width={120} height={20} />
              <MuiSkeleton variant="text" width={8} height={20} />
              <MuiSkeleton variant="text" width={80} height={20} />
            </Box>
            {/* Answer Content */}
            <MuiSkeleton variant="text" width="100%" height={20} sx={{ mb: 0.5 }} />
            <MuiSkeleton variant="text" width="95%" height={20} sx={{ mb: 0.5 }} />
            <MuiSkeleton variant="text" width="90%" height={20} sx={{ mb: 0.5 }} />
            <MuiSkeleton variant="text" width="85%" height={20} sx={{ mb: 2 }} />
            
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
        </Box>
      </Box>
    </AnswerCardStyledPaper>
  );
};

