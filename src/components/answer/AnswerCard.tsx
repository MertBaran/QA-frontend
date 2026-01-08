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
  ThumbDown,
  Comment,
  AccountTree,
  Quiz,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { Answer } from '../../types/answer';
import ParentInfoChip from '../ui/ParentInfoChip';
import AncestorsDrawer from '../question/AncestorsDrawer';
import MarkdownRenderer from '../ui/MarkdownRenderer';
import ActionButtons from '../ui/ActionButtons';
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
  isAlternateTexture?: boolean;
  relatedQuestionsCount?: number;
  onShowRelatedQuestions?: (e: React.MouseEvent<Element>, answerId: string) => void;
  onLike?: (answerId: string) => void;
  onUnlike?: (answerId: string) => void;
  onDislike?: (answerId: string) => void;
  onUndislike?: (answerId: string) => void;
  onDelete?: (answerId: string) => void;
  onHelp?: (answerId: string) => void;
  questionId?: string;
  questionTitle?: string;
  showParentInfo?: boolean; // Parent info gösterilsin mi (sadece arama sayfasında true)
}

const AnswerCard = forwardRef<HTMLDivElement, AnswerCardProps>(({
  answer,
  isAlternateTexture = false,
  relatedQuestionsCount = 0,
  onShowRelatedQuestions,
  onLike,
  onUnlike,
  onDislike,
  onUndislike,
  onDelete,
  onHelp,
  questionId,
  questionTitle,
  showParentInfo = true, // Default true, soru detay sayfasında false olacak
}, ref) => {
  // Debug log for specific answer
  if (answer.id === '6951cc1f0ffdbcb4e9208825') {
    console.log('AnswerCard Debug:', {
      answerId: answer.id,
      ancestors: answer.ancestors,
      ancestorsLength: answer.ancestors?.length,
      parentId: answer.parentId,
      parentType: answer.parentType,
      parentContentInfo: answer.parentContentInfo,
      shouldShowButton: (answer.ancestors && answer.ancestors.length > 0) || 
                        (answer.parentContentInfo && answer.parentContentInfo.type === 'answer' && answer.parentContentInfo.questionId) || 
                        (answer.parentId && answer.parentContentInfo && answer.ancestors?.some(a => a.depth > 0)),
    });
  }
  
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentLanguage } = useAppSelector(state => state.language);
  const { user } = useAppSelector(state => state.auth);
  const { items: bookmarks } = useAppSelector(state => state.bookmarks);
  const { name: themeName } = useAppSelector(state => state.theme);
  const isPapirus = themeName === 'papirus';
  const isMagnefite = themeName === 'magnefite';

  const [ancestorsDrawerOpen, setAncestorsDrawerOpen] = React.useState(false);

  const handleClick = () => {
    if (answer.questionId) {
      const from = location.pathname + location.search;
      navigate(`/questions/${answer.questionId}#answer-${answer.id}`, {
        state: { from }
      });
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
    <Box sx={{ position: 'relative' }}>
    <StyledPaper 
      ref={ref} 
      isPapirus={isPapirus}
      isMagnefite={isMagnefite} 
      isAlternateTexture={isAlternateTexture}
      onClick={handleClick}
    >
        {/* Parent Info - Answer'ın parent'ı (question veya answer) with Ancestors Button */}
      {showParentInfo && answer.parentId && answer.parentContentInfo && (
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 2, position: 'relative' }}>
          {((answer.ancestors && answer.ancestors.length > 0) || (answer.parentContentInfo && answer.parentContentInfo.type === 'answer' && answer.parentContentInfo.questionId) || (answer.parentId && answer.parentContentInfo && answer.ancestors?.some(a => a.depth > 0))) && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setAncestorsDrawerOpen(true);
              }}
              sx={{
                color: themeName === 'molume' 
                  ? (theme.palette.mode === 'dark' ? '#7A4A75' : '#5E315A')
                  : themeName === 'magnefite'
                  ? (theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280')
                  : `${theme.palette.primary.main}CC`,
                '&:hover': {
                  color: themeName === 'molume' 
                    ? (theme.palette.mode === 'dark' ? '#7A4A75' : '#5E315A')
                    : themeName === 'magnefite'
                    ? (theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280')
                    : theme.palette.primary.main,
                  bgcolor: themeName === 'molume' 
                    ? (theme.palette.mode === 'dark' ? '#7A4A75' : '#5E315A') + '22'
                    : themeName === 'magnefite'
                    ? (theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280') + '22'
                    : `${theme.palette.primary.main}22`,
                }
              }}
              title={t('show_all_ancestors', currentLanguage)}
            >
              <AccountTree />
            </IconButton>
          )}
          <ParentInfoChip 
            parentId={answer.parentId}
            parentContentInfo={answer.parentContentInfo}
          />
        </Box>
      )}
      
      {/* Parent Question Info - Answer'ın ait olduğu soru */}
      {showParentInfo && answer.questionId && !answer.parentId && (
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 2, position: 'relative' }}>
          {answer.ancestors && answer.ancestors.length > 0 && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setAncestorsDrawerOpen(true);
              }}
              sx={{
                color: themeName === 'molume' 
                  ? (theme.palette.mode === 'dark' ? '#7A4A75' : '#5E315A')
                  : themeName === 'magnefite'
                  ? (theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280')
                  : `${theme.palette.primary.main}CC`,
                '&:hover': {
                  color: themeName === 'molume' 
                    ? (theme.palette.mode === 'dark' ? '#7A4A75' : '#5E315A')
                    : themeName === 'magnefite'
                    ? (theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280')
                    : theme.palette.primary.main,
                  bgcolor: themeName === 'molume' 
                    ? (theme.palette.mode === 'dark' ? '#7A4A75' : '#5E315A') + '22'
                    : themeName === 'magnefite'
                    ? (theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280') + '22'
                    : `${theme.palette.primary.main}22`,
                }
              }}
              title={t('show_all_ancestors', currentLanguage)}
            >
              <AccountTree />
            </IconButton>
          )}
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
        {/* Action Buttons - Sağ Üst Köşe */}
        {onLike && onUnlike && (
          <Box className="action-buttons-container" sx={{ 
            position: 'absolute',
            top: theme => theme.spacing(1),
            right: theme => theme.spacing(2),
            display: 'flex',
            gap: 0.5,
            alignItems: 'center',
            zIndex: 20,
          }}>
            <ActionButtons
              targetType="answer"
              targetId={answer.id}
              targetData={{
                title: questionTitle || '',
                content: answer.content,
                author: answer.author?.name,
                authorId: answer.author?.id,
                created_at: answer.createdAt,
                url: questionId 
                  ? window.location.origin + '/questions/' + questionId + '#answer-' + answer.id
                  : window.location.href,
              }}
              position="relative"
              showBookmark={true}
              showLike={true}
              showDislike={true}
              showDelete={!!(user && (answer.author.id === user.id || answer.userInfo?._id === user.id || answer.author.id === user.id?.toString()))}
              showHelp={true}
              isLiked={answer.likedByUsers.includes(user?.id || '')}
              isDisliked={answer.dislikedByUsers.includes(user?.id || '')}
              canDelete={!!(user && (answer.author.id === user.id || answer.userInfo?._id === user.id || answer.author.id === user.id?.toString()))}
              isBookmarked={!!bookmarks.find((b: any) => b.target_type === 'answer' && b.target_id === answer.id)}
              bookmarkId={bookmarks.find((b: any) => b.target_type === 'answer' && b.target_id === answer.id)?._id || null}
              onLike={(e) => {
                e.stopPropagation();
                onLike(answer.id);
              }}
              onUnlike={(e) => {
                e.stopPropagation();
                onUnlike(answer.id);
              }}
              onDislike={(e) => {
                e.stopPropagation();
                onDislike?.(answer.id);
              }}
              onUndislike={(e) => {
                e.stopPropagation();
                onUndislike?.(answer.id);
              }}
              onDelete={(e) => {
                e.stopPropagation();
                onDelete?.(answer.id);
              }}
              onHelp={(e) => {
                e.stopPropagation();
                onHelp?.(answer.id);
              }}
            />
          </Box>
        )}
        
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

          {/* Stats Container - Alt Kısım */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 3,
            mt: 2,
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <ThumbUp sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                {answer.likesCount}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <ThumbDown sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                {answer.dislikesCount}
              </Typography>
            </Box>
            {user && relatedQuestionsCount > 0 && onShowRelatedQuestions && (
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 0.5,
                  cursor: 'pointer',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onShowRelatedQuestions(e, answer.id);
                }}
                title={t('related_questions', currentLanguage)}
              >
                <Quiz sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  {relatedQuestionsCount}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
      
      {/* Ancestors Drawer */}
      {((answer.ancestors && answer.ancestors.length > 0) || (answer.parentContentInfo && answer.parentContentInfo.type === 'answer' && answer.parentContentInfo.questionId) || (answer.parentId && answer.parentContentInfo && answer.ancestors?.some(a => a.depth > 0))) && (
        <AncestorsDrawer
          open={ancestorsDrawerOpen}
          onClose={(event) => {
            if (event) {
              event.stopPropagation();
            }
            setAncestorsDrawerOpen(false);
          }}
          ancestors={answer.ancestors || (answer.parentId ? [{
            id: answer.parentId,
            type: (answer.parentType || 'answer') as 'question' | 'answer',
            depth: 0,
          }] : [])}
          currentQuestionId={answer.id}
          contentType="answer"
        />
      )}
    </StyledPaper>
    </Box>
  );
});

AnswerCard.displayName = 'AnswerCard';

export default AnswerCard;
