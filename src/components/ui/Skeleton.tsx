import { Box, Skeleton as MuiSkeleton, Card, Avatar, useTheme } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useAppSelector } from '../../store/hooks';
import papyrusVertical1 from '../../asset/textures/papyrus_vertical_1.png';

// Question Card Skeleton - QuestionCard'ın bire bir taklidi
const StyledPaper = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isPapirus' && prop !== 'isMagnefite' && prop !== 'isAlternateTexture',
})<{ isPapirus?: boolean; isMagnefite?: boolean; isAlternateTexture?: boolean }>(({ theme, isPapirus, isMagnefite }) => {
  const hoverColor = isMagnefite 
    ? (theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280')
    : theme.palette.primary.main;
  
  return {
    background: theme.palette.mode === 'dark'
      ? `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`
      : `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
    borderRadius: 16,
    padding: theme.spacing(4),
    marginBottom: theme.spacing(3),
    border: `1px solid ${theme.palette.primary.main}33`,
    boxShadow: theme.palette.mode === 'dark'
      ? '0 4px 20px rgba(0, 0, 0, 0.2)'
      : '0 4px 20px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'hidden',
    color: theme.palette.text.primary,
    backdropFilter: 'blur(10px)',
    ...(isPapirus ? {
      '&::after': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `url(${papyrusVertical1})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center 70%',
        backgroundRepeat: 'no-repeat',
        opacity: theme.palette.mode === 'dark' ? 0.12 : 0.15,
        pointerEvents: 'none',
        zIndex: 0,
      },
    } : {}),
  };
});

// Question Skeleton
export const QuestionSkeleton = ({ isAlternateTexture = false }: { isAlternateTexture?: boolean }) => {
  const theme = useTheme();
  const { name: themeName, mode } = useAppSelector(state => state.theme);
  const isPapirus = themeName === 'papirus';
  const isMagnefite = themeName === 'magnefite';

  return (
    <StyledPaper isPapirus={isPapirus} isMagnefite={isMagnefite} isAlternateTexture={isAlternateTexture}>
      {/* Action Buttons - Sağ Üst Köşe */}
      <Box sx={{ 
        position: 'absolute',
        top: theme.spacing(2),
        right: theme.spacing(2),
        display: 'flex',
        gap: 0.5,
        alignItems: 'center',
        zIndex: 20,
      }}>
        <MuiSkeleton variant="circular" width={40} height={40} />
        <MuiSkeleton variant="circular" width={40} height={40} />
      </Box>

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

        {/* Başlık */}
        <MuiSkeleton 
          variant="text" 
          width="85%" 
          height={32} 
          sx={{ mb: 2, mt: 1 }} 
        />
        <MuiSkeleton 
          variant="text" 
          width="95%" 
          height={32} 
          sx={{ mb: 2 }} 
        />

        {/* İçerik */}
        <MuiSkeleton variant="text" width="100%" height={20} sx={{ mb: 0.5 }} />
        <MuiSkeleton variant="text" width="95%" height={20} sx={{ mb: 0.5 }} />
        <MuiSkeleton variant="text" width="90%" height={20} sx={{ mb: 0.5 }} />
        <MuiSkeleton variant="text" width="85%" height={20} sx={{ mb: 3 }} />

        {/* Tag'ler */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <MuiSkeleton variant="rectangular" width={60} height={28} sx={{ borderRadius: 2 }} />
          <MuiSkeleton variant="rectangular" width={80} height={28} sx={{ borderRadius: 2 }} />
          <MuiSkeleton variant="rectangular" width={70} height={28} sx={{ borderRadius: 2 }} />
        </Box>

        {/* Beğeni, Yorum, Görüntüleme */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MuiSkeleton variant="circular" width={18} height={18} />
            <MuiSkeleton variant="text" width={20} height={16} />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MuiSkeleton variant="circular" width={18} height={18} />
            <MuiSkeleton variant="text" width={20} height={16} />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MuiSkeleton variant="circular" width={18} height={18} />
            <MuiSkeleton variant="text" width={30} height={16} />
          </Box>
        </Box>
      </Box>
    </StyledPaper>
  );
};

// Questions List Skeleton
export const QuestionsListSkeleton = ({ count = 5 }) => {
  return (
    <Box>
      {Array.from({ length: count }).map((_, index) => (
        <QuestionSkeleton key={index} isAlternateTexture={index % 2 === 1} />
      ))}
    </Box>
  );
};

// User Profile Skeleton
export const UserProfileSkeleton = () => {
  return (
    <Card sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
        {/* Profile Avatar */}
        <Avatar sx={{ width: 80, height: 80 }}>
          <MuiSkeleton variant="circular" width={80} height={80} />
        </Avatar>

        <Box sx={{ flex: 1 }}>
          {/* User Name */}
          <MuiSkeleton variant="text" width="60%" height={32} sx={{ mb: 1 }} />

          {/* User Email */}
          <MuiSkeleton variant="text" width="40%" height={20} sx={{ mb: 1 }} />

          {/* User Stats */}
          <Box sx={{ display: 'flex', gap: 3 }}>
            <MuiSkeleton variant="text" width={60} height={20} />
            <MuiSkeleton variant="text" width={60} height={20} />
            <MuiSkeleton variant="text" width={60} height={20} />
          </Box>
        </Box>
      </Box>

      {/* User Bio */}
      <MuiSkeleton variant="text" width="100%" height={20} sx={{ mb: 0.5 }} />
      <MuiSkeleton variant="text" width="80%" height={20} sx={{ mb: 0.5 }} />
      <MuiSkeleton variant="text" width="60%" height={20} />
    </Card>
  );
};

// Form Skeleton
export const FormSkeleton = () => {
  return (
    <Card sx={{ p: 3 }}>
      {/* Form Title */}
      <MuiSkeleton variant="text" width="50%" height={32} sx={{ mb: 3 }} />

      {/* Form Fields */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <MuiSkeleton variant="rectangular" width="100%" height={56} />
        <MuiSkeleton variant="rectangular" width="100%" height={56} />
        <MuiSkeleton variant="rectangular" width="100%" height={120} />
        <MuiSkeleton variant="rectangular" width={120} height={40} />
      </Box>
    </Card>
  );
};

// Answer Skeleton
export const AnswerSkeleton = () => {
  return (
    <Card sx={{ mb: 2, p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
        {/* User Avatar */}
        <Avatar sx={{ width: 32, height: 32 }}>
          <MuiSkeleton variant="circular" width={32} height={32} />
        </Avatar>

        <Box sx={{ flex: 1 }}>
          {/* Answer Content */}
          <MuiSkeleton
            variant="text"
            width="100%"
            height={20}
            sx={{ mb: 0.5 }}
          />
          <MuiSkeleton
            variant="text"
            width="90%"
            height={20}
            sx={{ mb: 0.5 }}
          />
          <MuiSkeleton variant="text" width="70%" height={20} sx={{ mb: 1 }} />

          {/* Answer Meta */}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <MuiSkeleton variant="text" width={60} height={16} />
            <MuiSkeleton variant="text" width={80} height={16} />
          </Box>
        </Box>
      </Box>
    </Card>
  );
};

// Home Page Skeleton - Ana sayfa tasarımının bire bir taklidi (sadece soru kartları)
export const HomePageSkeleton = () => {
  return (
    <QuestionsListSkeleton count={5} />
  );
};

const Skeleton = {
  QuestionSkeleton,
  QuestionsListSkeleton,
  UserProfileSkeleton,
  FormSkeleton,
  AnswerSkeleton,
  HomePageSkeleton,
};
export default Skeleton;
