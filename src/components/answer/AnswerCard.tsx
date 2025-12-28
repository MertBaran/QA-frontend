import React, { forwardRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  IconButton,
  Avatar,
  useTheme,
} from '@mui/material';
import {
  ThumbUp,
  Comment,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { Answer } from '../../types/answer';
import ParentInfoChip from '../ui/ParentInfoChip';
import MarkdownRenderer from '../ui/MarkdownRenderer';
import { t } from '../../utils/translations';
import { useAppSelector } from '../../store/hooks';
import papyrusHorizontal2 from '../../asset/textures/papyrus_horizontal_2.png';

const StyledPaper = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isPapirus' && prop !== 'isMagnefite' && prop !== 'isAlternateTexture',
})<{ isPapirus?: boolean; isMagnefite?: boolean; isAlternateTexture?: boolean }>(({ theme, isPapirus, isMagnefite, isAlternateTexture }) => {
  // Magnefite'da hover için gri kullan
  const hoverColor = isMagnefite 
    ? (theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280') // Gray
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
  userSelect: 'none',
  WebkitUserSelect: 'none',
  MozUserSelect: 'none',
  msUserSelect: 'none',
  ...(isPapirus ? {
    '&::after': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundImage: `url(${papyrusHorizontal2})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      opacity: theme.palette.mode === 'dark' ? 0.12 : 0.15,
      pointerEvents: 'none',
      zIndex: 0,
    },
  } : {}),
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: `0 8px 32px ${hoverColor}33`,
    border: `1px solid ${hoverColor}66`,
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '3px',
    background: `linear-gradient(90deg, ${hoverColor} 0%, ${theme.palette.primary.dark} 50%, ${hoverColor} 100%)`,
    opacity: 0,
    transition: 'opacity 0.3s ease',
    zIndex: 2,
  },
  '&:hover::before': {
    opacity: 1,
  },
  };
});

interface AnswerCardProps {
  answer: Answer;
  onLike?: (answerId: string) => void;
  onUnlike?: (answerId: string) => void;
  isAlternateTexture?: boolean;
}

const AnswerCard = forwardRef<HTMLDivElement, AnswerCardProps>(({
  answer,
  onLike,
  onUnlike,
  isAlternateTexture = false,
}, ref) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentLanguage } = useAppSelector(state => state.language);
  const { user } = useAppSelector(state => state.auth);
  const { name: themeName } = useAppSelector(state => state.theme);
  const isPapirus = themeName === 'papirus';
  const isMagnefite = themeName === 'magnefite';

  const isLiked = user ? answer.likedByUsers.includes(user.id) : false;

  const handleClick = () => {
    if (answer.questionId) {
      const from = location.pathname + location.search;
      navigate(`/questions/${answer.questionId}#answer-${answer.id}`, {
        state: { from }
      });
    }
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLiked) {
      onUnlike?.(answer.id);
    } else {
      onLike?.(answer.id);
    }
  };

  const handleProfileClick = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();
    
    // Ctrl/Cmd + click veya middle click için yeni sekme
    if (e.ctrlKey || e.metaKey || e.button === 1) {
      e.preventDefault();
      window.open(`/profile/${userId}`, '_blank');
      return;
    }

    navigate(`/profile/${userId}`);
  };

  return (
    <StyledPaper 
      ref={ref} 
      isPapirus={isPapirus}
      isMagnefite={isMagnefite} 
      isAlternateTexture={isAlternateTexture}
      onClick={handleClick}
    >
      {/* Parent Question Info */}
      {answer.questionId && (
        <Box sx={{ mb: 2 }}>
          <ParentInfoChip 
            parentId={answer.questionId}
            parentContentInfo={{
              id: answer.questionId,
              type: 'question',
              title: answer.questionTitle,
              userInfo: undefined,
            }}
          />
        </Box>
      )}

      {/* Tıklanabilir alan */}
      <Box 
        sx={{ 
          cursor: 'pointer',
          padding: theme => theme.spacing(1),
          margin: theme => `-${theme.spacing(1)}`,
          display: 'flex',
          gap: 2,
          alignItems: 'flex-start',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Author Avatar */}
        <Avatar
          src={answer.userInfo?.profile_image || answer.author.avatar}
          sx={{
            width: 48,
            height: 48,
            cursor: 'pointer',
            flexShrink: 0,
            border: `2px solid ${theme.palette.primary.main}33`,
            '&:hover': {
              borderColor: theme.palette.primary.main,
              transform: 'scale(1.05)',
            },
            transition: 'all 0.2s ease',
          }}
          onClick={(e) => handleProfileClick(e, answer.author.id)}
          onMouseDown={(e) => {
            if (e.button === 1) {
              handleProfileClick(e, answer.author.id);
            }
          }}
        />

        {/* Content */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {/* Author Name */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                cursor: 'pointer',
                color: theme.palette.text.primary,
                '&:hover': {
                  color: theme.palette.primary.main,
                  textDecoration: 'underline',
                },
                transition: 'all 0.2s ease',
              }}
              onClick={(e) => handleProfileClick(e, answer.author.id)}
              onMouseDown={(e) => {
                if (e.button === 1) {
                  handleProfileClick(e, answer.author.id);
                }
              }}
            >
              {answer.userInfo?.name || answer.author.name}
            </Typography>
            {answer.author.title && (
              <Typography variant="caption" color="text.secondary">
                • {answer.author.title}
              </Typography>
            )}
            <Typography variant="caption" color="text.secondary">
              • {answer.timeAgo}
            </Typography>
          </Box>

          {/* Answer Content */}
          <Box sx={{ mb: 2 }}>
            <MarkdownRenderer content={answer.content} />
          </Box>

          {/* Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <IconButton
                size="small"
                onClick={handleLikeClick}
                sx={{
                  color: isLiked ? theme.palette.primary.main : theme.palette.text.secondary,
                  '&:hover': {
                    color: theme.palette.primary.main,
                    backgroundColor: `${theme.palette.primary.main}11`,
                  },
                }}
              >
                <ThumbUp fontSize="small" />
              </IconButton>
              <Typography variant="body2" color="text.secondary">
                {answer.likesCount}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
              <Comment fontSize="small" />
              <Typography variant="body2" color="text.secondary">
                {t('answer', currentLanguage)}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </StyledPaper>
  );
});

AnswerCard.displayName = 'AnswerCard';

export default AnswerCard;
