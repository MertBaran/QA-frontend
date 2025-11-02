import React, { forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Avatar,
} from '@mui/material';
import {
  ThumbUp,
  ThumbUpOutlined,
  Comment,
  Visibility,
  Delete,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { Question } from '../../types/question';
import BookmarkButton from '../ui/BookmarkButton';
import ParentInfoChip from '../ui/ParentInfoChip';
import { t } from '../../utils/translations';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { openModal } from '../../store/likes/likesSlice';
import { fetchLikedUsers } from '../../store/likes/likesThunks';

const StyledPaper = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(135deg, rgba(30, 58, 71, 0.95) 0%, rgba(21, 42, 53, 0.98) 100%)',
  borderRadius: 16,
  padding: theme.spacing(4),
  marginBottom: theme.spacing(3),
  border: '1px solid rgba(255, 184, 0, 0.15)',
  boxShadow: '0 4px 20px rgba(10, 26, 35, 0.2)',
  transition: 'all 0.3s ease',
  position: 'relative',
  overflow: 'hidden',
  color: 'white',
  backdropFilter: 'blur(10px)',
  userSelect: 'none',
  WebkitUserSelect: 'none',
  MozUserSelect: 'none',
  msUserSelect: 'none',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 32px rgba(255, 184, 0, 0.2)',
    border: '1px solid rgba(255, 184, 0, 0.3)',
    background: 'linear-gradient(135deg, rgba(30, 58, 71, 1) 0%, rgba(21, 42, 53, 1) 100%)',
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '3px',
    background: 'linear-gradient(90deg, #FFB800 0%, #FF8F00 50%, #FFB800 100%)',
    opacity: 0,
    transition: 'opacity 0.3s ease',
  },
  '&:hover::before': {
    opacity: 1,
  },
}));

interface QuestionCardProps {
  question: Question;
  onLike: (questionId: string) => void;
  onUnlike: (questionId: string) => void;
  onDelete: (questionId: string) => void;
  parentQuestions?: Record<string, Question>;
  parentAnswers?: Record<string, any>;
  parentAnswerQuestions?: Record<string, Question>;
}

const QuestionCard = forwardRef<HTMLDivElement, QuestionCardProps>(({
  question,
  onLike,
  onUnlike,
  onDelete,
  parentQuestions = {},
  parentAnswers = {},
  parentAnswerQuestions = {},
}, ref) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentLanguage } = useAppSelector(state => state.language);
  const { user } = useAppSelector(state => state.auth);

  const handleLikeClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (question.likedByUsers.includes(user?.id || '')) {
      onUnlike(question.id);
    } else {
      onLike(question.id);
    }
  };

  const handleLikesCountClick = async (e: React.MouseEvent) => {
    if (question.likesCount > 0 && question.likedByUsers.length > 0) {
      e.stopPropagation();
      try {
        await dispatch(fetchLikedUsers(question.likedByUsers));
        dispatch(openModal());
      } catch (err) {
        console.error('Kullanıcılar yüklenirken hata:', err);
      }
    }
  };

  const parentId = question.parentQuestionId || question.parentAnswerId;
  const parentQ = parentId ? parentQuestions[parentId] : undefined;
  const parentA = parentId ? parentAnswers[parentId] : undefined;
  const parentAQ = parentId ? parentAnswerQuestions[parentId] : undefined;

  return (
    <StyledPaper ref={ref}>
      {/* Parent Question/Answer Info */}
      {parentId && (
        <ParentInfoChip 
          parentQuestion={parentQ}
          parentAnswer={parentA}
          parentId={parentId}
          parentAnswerQuestion={parentAQ}
        />
      )}
      
      {/* Tıklanabilir alan - kartın çeperlerinden 2px içeride */}
      <Box 
        sx={{ 
          cursor: 'pointer',
          padding: '2px',
          margin: '-2px',
          borderRadius: '14px',
          '&:hover': {
            opacity: 0.9
          }
        }}
        onClick={() => window.location.href = `/questions/${question.id}`}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Avatar 
                src={question.userInfo?.profile_image || question.author.avatar} 
                sx={{ 
                  width: 32, 
                  height: 32,
                  cursor: 'pointer',
                  '&:hover': { opacity: 0.8 }
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/profile/${question.author.id}`);
                }}
              />
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'rgba(255,255,255,0.8)',
                  cursor: 'pointer',
                  '&:hover': { color: 'rgba(255,184,0,0.8)' }
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/profile/${question.author.id}`);
                }}
              >
                {question.userInfo?.name || question.author.name}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                •
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                {question.timeAgo}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                •
              </Typography>
              <Chip 
                label={question.category} 
                size="small" 
                sx={{ 
                  bgcolor: 'rgba(255,184,0,0.2)', 
                  color: 'rgba(255,184,0,0.9)',
                  fontSize: '0.75rem',
                }} 
              />
            </Box>
            
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 600, 
                mb: 2,
                color: 'white',
              }}
            >
              {question.title}
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ mb: 3, lineHeight: 1.6, color: 'rgba(255,255,255,0.9)' }}
            >
              {question.content.length > 200 
                ? `${question.content.substring(0,200)}...` 
                : question.content
              }
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              {question.tags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  size="small"
                  variant="outlined"
                  sx={{ 
                    borderRadius: 2,
                    borderColor: 'primary.main',
                    color: 'primary.main',
                    bgcolor: 'rgba(255,255,255,0.08)',
                    '&:hover': {
                      background: 'rgba(255, 184, 0, 0.1)',
                    }
                  }}
                />
              ))}
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton
                  onClick={handleLikeClick}
                  sx={{ 
                    color: question.likedByUsers.includes(user?.id || '') ? '#FFB800' : 'rgba(255,255,255,0.7)',
                    '&:hover': {
                      color: question.likedByUsers.includes(user?.id || '') ? '#FF8F00' : '#FFB800',
                    }
                  }}
                >
                  {question.likedByUsers.includes(user?.id || '') ? <ThumbUp /> : <ThumbUpOutlined />}
                </IconButton>
                <span 
                  style={{ 
                    color: 'rgba(255,255,255,0.8)', 
                    fontSize: 14,
                    cursor: question.likesCount > 0 ? 'pointer' : 'default'
                  }}
                  onClick={handleLikesCountClick}
                >
                  {question.likesCount}
                </span>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Comment sx={{ fontSize: 18, color: 'rgba(255,255,255,0.7)' }} />
                <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>{question.answers}</span>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Visibility sx={{ fontSize: 18, color: 'rgba(255,255,255,0.7)' }} />
                <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>{question.views}</span>
              </Box>
            </Box>
          </Box>
          
          {/* Right side buttons */}
          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'flex-start', ml: 2 }}>
            <BookmarkButton 
              targetType={'question'} 
              targetId={question.id} 
              targetData={{
                title: question.title,
                content: question.content,
                author: question.author?.name,
                authorId: question.author?.id,
                created_at: question.createdAt,
                url: window.location.origin + '/questions/' + question.id,
              }}
            />
            {user && (
              question.author.id === user.id || 
              question.userInfo?._id === user.id ||
              question.author.id === user.id?.toString()
            ) && (
              <IconButton 
                size="small" 
                sx={{ 
                  color: 'rgba(255,80,80,0.8)',
                  cursor: 'pointer',
                  '&:hover': {
                    color: 'rgba(255,80,80,1)',
                  }
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(question.id);
                }}
                title={t('delete', currentLanguage)}
              >
                <Delete />
              </IconButton>
            )}
          </Box>
        </Box>
      </Box>
    </StyledPaper>
  );
});

export default QuestionCard;
