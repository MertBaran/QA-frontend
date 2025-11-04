import React, { forwardRef, useState } from 'react';
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
  AccountTree,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { Question } from '../../types/question';
import BookmarkButton from '../ui/BookmarkButton';
import ParentInfoChip from '../ui/ParentInfoChip';
import AncestorsDrawer from './AncestorsDrawer';
import MarkdownRenderer from '../ui/MarkdownRenderer';
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
  const { user, isAuthenticated } = useAppSelector(state => state.auth);
  const { items: bookmarks } = useAppSelector(state => state.bookmarks);
  const [ancestorsDrawerOpen, setAncestorsDrawerOpen] = useState(false);

  // Check if this question is bookmarked
  const questionBookmark = bookmarks.find(
    b => b.target_type === 'question' && b.target_id === question.id
  );
  const isBookmarked = !!questionBookmark;
  const bookmarkId = questionBookmark?._id || null;

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

  // Use parentContentInfo from backend if available, otherwise fall back to old logic
  const parentId = question.parentContentInfo?.id || question.parentQuestionId || question.parentAnswerId;
  const hasBackendParentInfo = !!question.parentContentInfo;
  
  // Old logic for backward compatibility
  const parentQ = parentId && !hasBackendParentInfo ? parentQuestions[parentId] : undefined;
  const parentA = parentId && !hasBackendParentInfo ? parentAnswers[parentId] : undefined;
  const parentAQ = parentId && !hasBackendParentInfo ? parentAnswerQuestions[parentId] : undefined;

  return (
    <StyledPaper ref={ref}>
      {/* Action Buttons - Sağ Üst Köşe */}
      <Box sx={{ 
        position: 'absolute',
        top: theme => theme.spacing(2),
        right: theme => theme.spacing(2),
        display: 'flex',
        gap: 0.5,
        alignItems: 'center',
        zIndex: 10,
      }}>
        <Box sx={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          width: '40px',
          height: '40px',
          flexShrink: 0,
          '& > span': {
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            '& .MuiIconButton-root': {
              width: '40px !important',
              height: '40px !important',
              padding: '0 !important',
              minWidth: '40px',
              minHeight: '40px',
            },
          },
        }}>
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
            isBookmarked={isBookmarked}
            bookmarkId={bookmarkId}
          />
        </Box>
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
              width: '40px',
              height: '40px',
              padding: 0,
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

      {/* Parent Question/Answer Info with Ancestors Button */}
      {parentId && (
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 2 }}>
      {question.ancestors && question.ancestors.length > 1 && (
            <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                setAncestorsDrawerOpen(true);
                  }}
                  sx={{
                color: 'rgba(255,184,0,0.8)',
                    '&:hover': {
                  color: 'rgba(255,184,0,1)',
                  bgcolor: 'rgba(255,184,0,0.1)',
                }
              }}
              title={t('show_all_ancestors', currentLanguage)}
            >
              <AccountTree />
            </IconButton>
          )}
        <ParentInfoChip 
          parentQuestion={hasBackendParentInfo ? undefined : parentQ}
          parentAnswer={hasBackendParentInfo ? undefined : parentA}
          parentId={parentId}
          parentAnswerQuestion={hasBackendParentInfo ? undefined : parentAQ}
          parentContentInfo={question.parentContentInfo}
        />
        </Box>
      )}
      
      {/* Tıklanabilir alan - kartın çeperlerinden 2px içeride */}
      <Box 
        sx={{ 
          cursor: 'pointer',
          padding: '2px',
          margin: '-2px',
          display: 'flex',
          gap: 2,
          alignItems: 'flex-start',
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
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                wordBreak: 'break-word',
                maxWidth: '100%',
              }}
            >
              {question.title}
            </Typography>
            <Box sx={{ 
              mb: 3, 
              overflow: 'hidden', 
              wordWrap: 'break-word',
              wordBreak: 'break-word',
              maxWidth: '100%',
            }}>
              {question.content.length > 200 
                ? (
                    <Box sx={{ maxWidth: '100%', overflow: 'hidden' }}>
                      <MarkdownRenderer content={question.content.substring(0, 200)} />
                      <Typography variant="body2" sx={{ color: 'rgba(255,184,0,0.8)', mt: 1 }}>
                        ...
                      </Typography>
                    </Box>
                  )
                : <Box sx={{ maxWidth: '100%', overflow: 'hidden' }}>
                    <MarkdownRenderer content={question.content} />
                  </Box>
              }
            </Box>
            
            <Box sx={{ 
              flex: 1,
              minWidth: 0,
              maxWidth: '100%',
              overflow: 'hidden',
            }}>
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
          </Box>
        </Box>
      </Box>
      
      {/* Ancestors Drawer */}
      <AncestorsDrawer
        open={ancestorsDrawerOpen}
        onClose={() => setAncestorsDrawerOpen(false)}
        ancestors={question.ancestors || []}
        currentQuestionId={question.id}
      />
    </StyledPaper>
  );
});

export default QuestionCard;
