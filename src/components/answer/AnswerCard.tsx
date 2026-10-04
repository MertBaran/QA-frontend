import React, { forwardRef, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  IconButton,
  Avatar,
  Tooltip,
  useTheme,
} from '@mui/material';
import {
  ThumbUp,
  ThumbDown,
  AccountTree,
  Quiz,
} from '@mui/icons-material';
import { alpha, styled } from '@mui/material/styles';
import { Answer } from '../../types/answer';
import ParentInfoChip from '../ui/ParentInfoChip';
import AncestorsDrawer from '../question/AncestorsDrawer';
import QuestionHoverPreview, { useDelayedQuestionPreview } from '../question/QuestionHoverPreview';
import ExpandableMarkdown from '../ui/ExpandableMarkdown';
import CommentThread from '../comment/CommentThread';
import AnswerReferenceList from './AnswerReferenceList';
import InlineSidePanel from '../ui/InlineSidePanel';
import ReportContentButton from '../ui/ReportContentButton';
import { filledMetadata, filledReferences } from '../../utils/filledEntries';
import ActionButtons from '../ui/ActionButtons';
import { matchesAny, OwnerRoleLabel, QuestionOwnerReaction } from '../ui/OwnerMarks';
import { t } from '../../utils/translations';
import ContentTime from '../ui/ContentTime';
import { useAppSelector } from '../../store/hooks';
import papyrusHorizontal2 from '../../asset/textures/papyrus_horizontal_2.png';

const StyledPaper = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isPapirus' && prop !== 'isMagnefite' && prop !== 'isAlternateTexture' && prop !== 'isHighlighted' && prop !== 'isQuestionOwner',
})<{ isPapirus?: boolean; isMagnefite?: boolean; isAlternateTexture?: boolean; isHighlighted?: boolean; isQuestionOwner?: boolean }>(({ theme, isPapirus, isMagnefite, isAlternateTexture, isHighlighted, isQuestionOwner }) => {
  // Magnefite'da hover için gri kullan
  const hoverColor = isMagnefite 
    ? (theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280') // Gray
    : theme.palette.primary.main;
  
  // Magnefite light modunda daha koyu background
  const getBackground = () => {
    if (isMagnefite && theme.palette.mode === 'light') {
      return 'linear-gradient(135deg, #B5BAC0 0%, #A8AEB6 100%)';
    }
    return theme.palette.mode === 'dark'
      ? `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`
      : `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`;
  };

  return {
  background: getBackground(),
  borderRadius: 16,
  padding: theme.spacing(4),
  marginBottom: theme.spacing(3),
  border: isHighlighted
    ? `1px solid ${hoverColor}99`
    : isQuestionOwner
      ? `1px solid ${alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.35 : 0.55)}`
      : `1px solid ${theme.palette.primary.main}33`,
  boxShadow: [
    isQuestionOwner ? `inset 0 0 0 1000px ${alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.07 : 0.1)}` : '',
    isHighlighted
      ? `0 12px 40px ${hoverColor}66`
      : (theme.palette.mode === 'dark'
        ? '0 4px 20px rgba(0, 0, 0, 0.2)'
        : '0 4px 20px rgba(0, 0, 0, 0.1)'),
  ].filter(Boolean).join(', '),
  transform: isHighlighted ? 'translateY(-4px)' : 'none',
  transition: 'all 0.3s ease',
  position: 'relative',
  overflow: 'hidden',
  color: theme.palette.text.primary,
  backdropFilter: 'blur(10px)',
  userSelect: 'text',
  WebkitUserSelect: 'text',
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
    boxShadow: isHighlighted
      ? `0 12px 40px ${hoverColor}66`
      : `0 8px 32px ${hoverColor}33`,
    border: isHighlighted
      ? `1px solid ${hoverColor}99`
      : `1px solid ${hoverColor}66`,
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '3px',
    background: `linear-gradient(90deg, ${hoverColor} 0%, ${theme.palette.primary.dark} 50%, ${hoverColor} 100%)`,
    opacity: isHighlighted ? 1 : 0,
    transition: 'opacity 0.3s ease',
    zIndex: 2,
    borderRadius: '16px 16px 0 0',
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
  onShowLikedUsers?: (answerId: string) => void;
  onShowDislikedUsers?: (answerId: string) => void;
  questionOwnerId?: string;
  questionId?: string;
  questionSummary?: string;
  showParentInfo?: boolean; // Parent info gösterilsin mi (sadece arama sayfasında true)
  isHighlighted?: boolean; // Highlight efekti için
  comments?: import('../../types/comment').CommentItem[];
  onCreateComment?: (body: string, parentId?: string) => Promise<void>;
  onUpdateComment?: (id: string, body: string) => Promise<void>;
  onDeleteComment?: (id: string) => Promise<void>;
  onReactComment?: (id: string, type: 'like' | 'dislike') => Promise<void>;
  showReport?: boolean;
  onRevealComment?: (element: HTMLElement) => void;
  showHoverPreview?: boolean;
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
  onShowLikedUsers,
  onShowDislikedUsers,
  onHelp,
  questionOwnerId,
  questionId,
  questionSummary,
  showParentInfo = true, // Default true, soru detay sayfasında false olacak
  isHighlighted = false,
  comments,
  onCreateComment,
  onUpdateComment,
  onDeleteComment,
  onReactComment,
  showReport = false,
  onRevealComment,
  showHoverPreview = false,
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
  const [referencesOpen, setReferencesOpen] = React.useState(false);
  const [hoveredRefIndex, setHoveredRefIndex] = React.useState<number | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);

  // Profile image URL'ini resolve et (key ise)
  useEffect(() => {
    if (!answer) return;
    
    const profileImage = answer.userInfo?.profile_image || answer.author.avatar;
    
    if (profileImage && !profileImage.startsWith('http')) {
      // Key ise URL resolve et
      if (profileImage.includes('user-profile-avatars') || profileImage.match(/^\d{4}\/\d{2}\/\d{2}\//)) {
        const loadProfileImageUrl = async () => {
          try {
            const { contentAssetService } = await import('../../services/contentAssetService');
            const url = await contentAssetService.resolveAssetUrl({
              key: profileImage,
              type: 'user-profile-avatar',
              ownerId: answer.userInfo?._id || answer.author.id,
              visibility: 'public',
              presignedUrl: false, // Use public URL if available, fallback to presigned if not
            });
            setProfileImageUrl(url);
          } catch (error) {
            console.error('Failed to resolve profile image URL:', error);
            setProfileImageUrl(null);
          }
        };
        loadProfileImageUrl();
      } else {
        setProfileImageUrl(null);
      }
    } else {
      setProfileImageUrl(profileImage || null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- profile image resolution depends on answer identity fields only
  }, [answer?.userInfo?.profile_image, answer?.author.avatar, answer?.userInfo?._id, answer?.author.id]);

  const hoverPreview = useDelayedQuestionPreview({ respectHomeLock: true });

  const handleClick = () => {
    if (window.getSelection()?.toString()) return;
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
    <Box sx={{ position: 'relative', mb: 3 }}>
    <StyledPaper
      sx={{ mb: 0 }} 
      ref={ref} 
      isPapirus={isPapirus}
      isMagnefite={isMagnefite} 
      isAlternateTexture={isAlternateTexture}
      isHighlighted={isHighlighted}
      isQuestionOwner={matchesAny(questionOwnerId, [answer.author?.id, answer.userInfo?._id])}
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
              summary: answer.questionSummary,
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
        {...(showHoverPreview ? hoverPreview.bindAnswer(answer) : {})}
      >
        {/* Action Buttons - Sağ Üst Köşe */}
        {onLike && onUnlike && !answer.deleted && (
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
                title: questionSummary || '',
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
              messageRecipient={{
                id: answer.userInfo?._id || answer.author.id,
                name: answer.author.name,
                profile_image: answer.userInfo?.profile_image || answer.author.avatar,
              }}
              mention={questionId ? { questionId, answerId: answer.id } : undefined}
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
          src={profileImageUrl || answer.userInfo?.profile_image || answer.author.avatar}
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
            {matchesAny(questionOwnerId, [answer.author?.id, answer.userInfo?._id]) && (
              <OwnerRoleLabel role="question" currentLanguage={currentLanguage} />
            )}
            <QuestionOwnerReaction
              liked={matchesAny(questionOwnerId, answer.likedByUsers)}
              disliked={matchesAny(questionOwnerId, answer.dislikedByUsers)}
              currentLanguage={currentLanguage}
            />
            {answer.author.title && (
              <Typography variant="caption" color="text.secondary">
                • {answer.author.title}
              </Typography>
            )}
            <Typography variant="caption" color="text.secondary" component="span">
              •{' '}
              <ContentTime
                value={answer.createdAt}
                currentLanguage={currentLanguage}
                variant="caption"
              />
            </Typography>
          </Box>

          {/* Answer Content */}
          <Box sx={{ mb: 2, maxWidth: '100%' }}>
            {answer.deleted ? (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                {t('answer_deleted', currentLanguage)}
              </Typography>
            ) : (
              <ExpandableMarkdown
                content={answer.content}
                maxLength={600}
                maxHeight={420}
                highlightedRefIndex={hoveredRefIndex}
                onRefHover={(idx) => {
                  setHoveredRefIndex(idx);
                  if (idx != null) setReferencesOpen(true);
                }}
                onRefClick={(idx) => {
                  setHoveredRefIndex(idx);
                  setReferencesOpen(true);
                }}
              />
            )}
          </Box>

          {/* Stats Container - Alt Kısım */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 3,
            mt: 2,
          }}>
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 0.5,
                cursor: answer.likesCount > 0 && onShowLikedUsers ? 'pointer' : 'default',
                '&:hover': answer.likesCount > 0 && onShowLikedUsers ? { opacity: 0.7 } : {},
              }}
              onClick={answer.likesCount > 0 && onShowLikedUsers ? (e) => {
                e.stopPropagation();
                onShowLikedUsers(answer.id);
              } : undefined}
              title={answer.likesCount > 0 && onShowLikedUsers ? t('users_who_liked', currentLanguage) : ''}
            >
              <ThumbUp sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                {answer.likesCount}
              </Typography>
            </Box>
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 0.5,
                cursor: answer.dislikesCount > 0 && onShowDislikedUsers ? 'pointer' : 'default',
                '&:hover': answer.dislikesCount > 0 && onShowDislikedUsers ? { opacity: 0.7 } : {},
              }}
              onClick={answer.dislikesCount > 0 && onShowDislikedUsers ? (e) => {
                e.stopPropagation();
                onShowDislikedUsers(answer.id);
              } : undefined}
              title={answer.dislikesCount > 0 && onShowDislikedUsers ? t('users_who_disliked', currentLanguage) : ''}
            >
              <ThumbDown sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                {answer.dislikesCount}
              </Typography>
            </Box>
            <Tooltip title={t('related_questions', currentLanguage)}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  cursor: onShowRelatedQuestions ? 'pointer' : 'default',
                }}
                onClick={onShowRelatedQuestions ? (e) => {
                  e.stopPropagation();
                  onShowRelatedQuestions(e, answer.id);
                } : undefined}
              >
                <Quiz sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  {relatedQuestionsCount}
                </Typography>
              </Box>
            </Tooltip>
          </Box>
          {onCreateComment && onUpdateComment && onDeleteComment && (
            <CommentThread
              comments={comments ?? []}
              currentUserId={user?.id}
              currentLanguage={currentLanguage}
              onCreate={onCreateComment}
              onUpdate={onUpdateComment}
              onDelete={onDeleteComment}
              onReact={onReactComment}
              questionOwnerId={questionOwnerId}
              questionId={questionId}
              answerOwnerId={answer.userInfo?._id || answer.author?.id}
              collapsible
              listMode="feed"
              showReport={showReport}
              onReveal={onRevealComment}
            />
          )}
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
      {showReport && (
        <>
          <Box sx={{ height: 28 }} />
          <ReportContentButton />
        </>
      )}
    </StyledPaper>
    {showHoverPreview && (
      <QuestionHoverPreview
        placement="below"
        question={hoverPreview.question}
        featuredAnswer={hoverPreview.featuredAnswer}
        anchorEl={hoverPreview.anchorEl}
        onMouseEnter={hoverPreview.previewHandlers.onMouseEnter}
        onMouseLeave={hoverPreview.previewHandlers.onMouseLeave}
      />
    )}
    {!answer.deleted && <InlineSidePanel
      open={referencesOpen}
      onToggle={() => setReferencesOpen(open => !open)}
      label={t('references', currentLanguage)}
      hasContent={
        filledReferences(answer.references).length > 0 ||
        filledMetadata(answer.metadata).length > 0 ||
        (answer.attachments?.length ?? 0) > 0
      }
    >
      <AnswerReferenceList
        answerId={answer.id}
        ownerId={answer.author?.id}
        references={answer.references}
        metadata={answer.metadata}
        attachments={answer.attachments}
        currentLanguage={currentLanguage}
        highlightedRefIndex={hoveredRefIndex}
        onRefHover={setHoveredRefIndex}
      />
    </InlineSidePanel>}
    </Box>
  );
});

AnswerCard.displayName = 'AnswerCard';

export default AnswerCard;
