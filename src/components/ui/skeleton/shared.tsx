import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import papyrusVertical1 from '../../../asset/textures/papyrus_vertical_1.png';

// Question Card Styled Paper - QuestionCard'ın bire bir taklidi
export const StyledPaper = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isPapirus' && prop !== 'isMagnefite' && prop !== 'isAlternateTexture',
})<{ isPapirus?: boolean; isMagnefite?: boolean; isAlternateTexture?: boolean }>(({ theme, isPapirus, isMagnefite }) => {
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

// Answer Card Styled Paper - AnswerCard'ın bire bir taklidi
export const AnswerCardStyledPaper = styled(Box, {
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
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        opacity: theme.palette.mode === 'dark' ? 0.12 : 0.15,
        pointerEvents: 'none',
        zIndex: 0,
      },
    } : {}),
  };
});

