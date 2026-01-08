import { Box, Skeleton as MuiSkeleton, useTheme } from '@mui/material';
import { useAppSelector } from '../../../store/hooks';
import { StyledPaper } from './shared';

export const QuestionSkeleton = ({ isAlternateTexture = false }: { isAlternateTexture?: boolean }) => {
  const theme = useTheme();
  const { name: themeName } = useAppSelector(state => state.theme);
  const isPapirus = themeName === 'papirus';
  const isMagnefite = themeName === 'magnefite';

  return (
    <StyledPaper isPapirus={isPapirus} isMagnefite={isMagnefite} isAlternateTexture={isAlternateTexture}>
      {/* Content */}
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        {/* Avatar, Kullanıcı Adı, Kategori, Zaman */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <MuiSkeleton variant="circular" width={32} height={32} />
          <MuiSkeleton variant="text" width={120} height={20} />
          <MuiSkeleton variant="text" width={8} height={20} />
          <MuiSkeleton variant="text" width={80} height={20} />
          <MuiSkeleton variant="text" width={8} height={20} />
          <MuiSkeleton variant="rectangular" width={60} height={20} sx={{ borderRadius: 1 }} />
        </Box>

        {/* Başlık ve İçerik Container */}
        <Box sx={{ 
          mb: 2, 
          display: 'flex',
          gap: 2,
          alignItems: 'flex-start',
        }}>
          <Box sx={{ 
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
          }}>
            {/* Başlık */}
            <MuiSkeleton 
              variant="text" 
              width="90%" 
              height={32} 
              sx={{ mb: 1.5 }} 
            />
            <MuiSkeleton 
              variant="text" 
              width="95%" 
              height={32} 
              sx={{ mb: 1.5 }} 
            />

            {/* İçerik */}
            <MuiSkeleton variant="text" width="100%" height={20} sx={{ mb: 0.5 }} />
            <MuiSkeleton variant="text" width="95%" height={20} sx={{ mb: 0.5 }} />
            <MuiSkeleton variant="text" width="90%" height={20} sx={{ mb: 0.5 }} />
            <MuiSkeleton variant="text" width="85%" height={20} />
          </Box>

          {/* Thumbnail placeholder (opsiyonel) */}
          <MuiSkeleton variant="rectangular" width={60} height={60} sx={{ borderRadius: 1.5, flexShrink: 0 }} />
        </Box>

        {/* Stats Container - Alt Kısım */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 3,
          mt: 2,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <MuiSkeleton variant="circular" width={18} height={18} />
            <MuiSkeleton variant="text" width={20} height={16} />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <MuiSkeleton variant="circular" width={18} height={18} />
            <MuiSkeleton variant="text" width={20} height={16} />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <MuiSkeleton variant="circular" width={18} height={18} />
            <MuiSkeleton variant="text" width={20} height={16} />
          </Box>
          {/* Related Questions (opsiyonel) */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <MuiSkeleton variant="circular" width={18} height={18} />
            <MuiSkeleton variant="text" width={20} height={16} />
          </Box>
        </Box>
      </Box>
    </StyledPaper>
  );
};

