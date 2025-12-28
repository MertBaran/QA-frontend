import React, { forwardRef, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Avatar,
  useTheme,
  Dialog,
} from '@mui/material';
import {
  ThumbUp,
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
import { useAppSelector } from '../../store/hooks';
import papyrusVertical1 from '../../asset/textures/papyrus_vertical_1.png';
import papyrusHorizontal2 from '../../asset/textures/papyrus_horizontal_2.png';

const StyledPaper = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isPapirus' && prop !== 'isMagnefite' && prop !== 'isAlternateTexture' && prop !== 'isAnswerWriting',
})<{ isPapirus?: boolean; isMagnefite?: boolean; isAlternateTexture?: boolean; isAnswerWriting?: boolean }>(({ theme, isPapirus, isMagnefite, isAlternateTexture, isAnswerWriting }) => {
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
      backgroundImage: `url(${isAnswerWriting ? papyrusHorizontal2 : papyrusVertical1})`,
      backgroundSize: 'cover',
      backgroundPosition: isAnswerWriting ? 'center' : 'center 70%',
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

interface QuestionCardProps {
  question?: Question;
  onLike?: (questionId: string) => void;
  onUnlike?: (questionId: string) => void;
  onDelete?: (questionId: string) => void;
  parentQuestions?: Record<string, Question>;
  parentAnswers?: Record<string, any>;
  parentAnswerQuestions?: Record<string, Question>;
  isAlternateTexture?: boolean; // For alternating textures in papirus theme
  isAnswerWriting?: boolean; // For answer writing section texture
  children?: React.ReactNode; // Allow children for answer writing section
}

const QuestionCard = forwardRef<HTMLDivElement, QuestionCardProps>(({
  question,
  onLike,
  onUnlike,
  onDelete,
  parentQuestions = {},
  parentAnswers = {},
  parentAnswerQuestions = {},
  isAlternateTexture = false,
  isAnswerWriting = false,
  children,
}, ref) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentLanguage } = useAppSelector(state => state.language);
  const { user } = useAppSelector(state => state.auth);
  const { items: bookmarks } = useAppSelector(state => state.bookmarks);
  const { name: themeName } = useAppSelector(state => state.theme);
  const isPapirus = themeName === 'papirus';
  const isMagnefite = themeName === 'magnefite';
  const [ancestorsDrawerOpen, setAncestorsDrawerOpen] = useState(false);
  const [thumbnailPreviewOpen, setThumbnailPreviewOpen] = useState(false);
  const [thumbnailUrlState, setThumbnailUrlState] = useState<string | null>(null);

  // Thumbnail URL'ini oluştur (key varsa ama URL yoksa)
  useEffect(() => {
    if (question?.thumbnail?.key) {
      if (question.thumbnail.url) {
        setThumbnailUrlState(question.thumbnail.url);
      } else {
        // URL yoksa, key'den URL oluştur
        const loadThumbnailUrl = async () => {
          try {
            const { contentAssetService } = await import('../../services/contentAssetService');
            const url = await contentAssetService.resolveAssetUrl({
              key: question.thumbnail!.key,
              type: 'question-thumbnail',
              entityId: question.id,
            });
            setThumbnailUrlState(url);
          } catch (error) {
            // Silent fail
            setThumbnailUrlState(null);
          }
        };
        loadThumbnailUrl();
      }
    } else {
      setThumbnailUrlState(null);
    }
  }, [question?.thumbnail?.key, question?.thumbnail?.url, question?.thumbnail, question?.id]);

  // If no question provided, render children (for answer writing section)
  if (!question) {
    return (
      <StyledPaper ref={ref} isPapirus={isPapirus} isMagnefite={isMagnefite} isAlternateTexture={isAlternateTexture} isAnswerWriting={isAnswerWriting}>
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          {children}
        </Box>
      </StyledPaper>
    );
  }

  // Check if this question is bookmarked
  const questionBookmark = bookmarks.find(
    b => b.target_type === 'question' && b.target_id === question.id
  );
  const isBookmarked = !!questionBookmark;
  const bookmarkId = questionBookmark?._id || null;

  const thumbnailUrl = thumbnailUrlState || question.thumbnail?.url;
  const hasThumbnail = Boolean(question.thumbnail?.key || thumbnailUrl);


  // Use parentContentInfo from backend if available, otherwise fall back to old logic
  const parentId = question.parentContentInfo?.id || question.parentQuestionId || question.parentAnswerId;
  const hasBackendParentInfo = !!question.parentContentInfo;
  
  // Old logic for backward compatibility
  const parentQ = parentId && !hasBackendParentInfo ? parentQuestions[parentId] : undefined;
  const parentA = parentId && !hasBackendParentInfo ? parentAnswers[parentId] : undefined;
  const parentAQ = parentId && !hasBackendParentInfo ? parentAnswerQuestions[parentId] : undefined;

  return (
    <StyledPaper ref={ref} isPapirus={isPapirus} isMagnefite={isMagnefite} isAlternateTexture={isAlternateTexture} isAnswerWriting={isAnswerWriting}>
      {/* Action Buttons - Sağ Üst Köşe */}
      <Box sx={{ 
        position: 'absolute',
        top: theme => theme.spacing(2),
        right: theme => theme.spacing(2),
        display: 'flex',
        gap: 0.5,
        alignItems: 'center',
        zIndex: 20,
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
            sx={(theme) => {
              // Theme-specific negative colors
              const getNegativeColor = () => {
                if (themeName === 'molume') {
                  return '#FF3B30'; // Red
                } else if (themeName === 'papirus') {
                  return theme.palette.mode === 'dark' ? '#A0522D' : '#8B4513'; // Sienna brown
                } else {
                  return '#DB7093'; // Pink-red
                }
              };
              const negativeColor = getNegativeColor();
              
              return {
                color: negativeColor,
              cursor: 'pointer',
              width: '40px',
              height: '40px',
              padding: 0,
                border: theme.palette.mode === 'light' ? `1px solid ${theme.palette.divider}` : 'none',
                backgroundColor: theme.palette.mode === 'light' ? theme.palette.background.paper : 'transparent',
              '&:hover': {
                  color: negativeColor,
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? `${negativeColor}22` 
                    : `${negativeColor}11`,
                  borderColor: theme.palette.mode === 'light' ? negativeColor : undefined,
              }
              };
            }}
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(question.id);
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
                    color: themeName === 'molume' 
                      ? (theme.palette.mode === 'dark' ? '#7A4A75' : '#5E315A') // Brighter purple in dark mode
                      : themeName === 'magnefite'
                      ? (theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280') // Gray for Magnefite
                      : `${theme.palette.primary.main}CC`,
                    '&:hover': {
                      color: themeName === 'molume' 
                        ? (theme.palette.mode === 'dark' ? '#7A4A75' : '#5E315A') // Brighter purple in dark mode
                        : themeName === 'magnefite'
                        ? (theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280') // Gray for Magnefite
                        : theme.palette.primary.main,
                      bgcolor: themeName === 'molume' 
                        ? (theme.palette.mode === 'dark' ? '#7A4A75' : '#5E315A') + '22' // Brighter purple in dark mode
                        : themeName === 'magnefite'
                        ? (theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280') + '22' // Gray for Magnefite
                        : `${theme.palette.primary.main}22`,
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
          padding: theme => theme.spacing(1),
          margin: theme => `-${theme.spacing(1)}`,
          display: 'flex',
          gap: 2,
          alignItems: 'flex-start',
          borderRadius: '14px',
          '&:hover': {
            opacity: 0.9
          }
        }}
        onClick={() => {
          const from = location.pathname + location.search;
          navigate(`/questions/${question.id}`, { 
            state: { from } 
          });
        }}
      >
        <Box sx={{ flex: 1, paddingX: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
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
                color: isMagnefite 
                  ? (theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280') // Gray for Magnefite
                  : theme.palette.text.secondary,
                cursor: 'pointer',
                '&:hover': { 
                  color: isMagnefite 
                    ? (theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280') // Gray for Magnefite
                    : theme.palette.primary.main 
                }
              }}
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/profile/${question.author.id}`);
              }}
            >
              {question.userInfo?.name || question.author.name}
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.disabled }}>
              •
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
              {question.timeAgo}
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.disabled }}>
              •
            </Typography>
            <Chip 
              label={question.category} 
              size="small" 
              sx={(theme) => {
                const chipColor = isMagnefite 
                  ? (theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280') // Gray for Magnefite
                  : theme.palette.primary.main;
                return {
                  bgcolor: `${chipColor}33`, 
                  color: chipColor,
                  fontSize: '0.75rem',
                };
              }} 
            />
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
              <Typography 
                variant="h5"
                sx={{
                  fontWeight: 700,
                  mb: 1.5,
                  color: theme.palette.text.primary,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  wordBreak: 'break-word',
                }}
              >
                {question.title}
              </Typography>

              <Box sx={{ 
                overflow: 'hidden',
                wordBreak: 'break-all',
                overflowWrap: 'break-word',
                '& .wmde-markdown': {
                  overflow: 'hidden',
                  wordBreak: 'break-all',
                  overflowWrap: 'break-word',
                  maxWidth: '100%',
                },
              }}>
                <MarkdownRenderer content={`${question.content.slice(0, 280)}${question.content.length > 280 ? '...' : ''}`} />
              </Box>
            </Box>

            {/* Thumbnail Container - Dikey olarak ortalanmış */}
            {hasThumbnail && thumbnailUrl && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  alignSelf: 'stretch',
                  flexShrink: 0,
                }}
              >
                <Box
                  sx={(theme) => ({
                    width: 60,
                    height: 60,
                    borderRadius: 1.5,
                    overflow: 'hidden',
                    border: `1px solid ${theme.palette.divider}`,
                    boxShadow: theme.palette.mode === 'dark'
                      ? '0 2px 8px rgba(0,0,0,0.2)'
                      : '0 2px 8px rgba(0,0,0,0.1)',
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease',
                    backgroundColor: theme.palette.background.paper,
                    '&:hover': {
                      transform: 'scale(1.05)',
                    },
                  })}
                  onClick={(e) => {
                    e.stopPropagation();
                    setThumbnailPreviewOpen(true);
                  }}
                >
                  <img
                    src={thumbnailUrl || ''}
                    alt={question.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={async (e) => {
                      const img = e.currentTarget;
                      const currentSrc = img.src;
                      
                      // Eğer thumbnail key varsa ama URL yüklenemiyorsa, yeniden URL oluşturmayı dene
                      if (question?.thumbnail?.key) {
                        try {
                          const { contentAssetService } = await import('../../services/contentAssetService');
                          const newUrl = await contentAssetService.resolveAssetUrl({
                            key: question.thumbnail.key,
                            type: 'question-thumbnail',
                            entityId: question.id,
                          });
                          if (newUrl && newUrl !== currentSrc) {
                            img.src = newUrl;
                            return; // Yeniden yükleme başarılı
                          }
                        } catch (error) {
                          // Silent fail - thumbnail yüklenemiyorsa gizlenir
                        }
                      }
                      
                      // Başarısız olursa gizle
                      img.style.display = 'none';
                    }}
                  />
                </Box>
              </Box>
            )}
          </Box>

          {question.tags.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {question.tags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  size="small"
                  variant="outlined"
                  sx={(theme) => {
                    const tagColor = isMagnefite 
                      ? (theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280') // Gray for Magnefite
                      : theme.palette.primary.main;
                    const tagDark = isMagnefite 
                      ? (theme.palette.mode === 'dark' ? '#6B7280' : '#4B5563') // Darker gray for Magnefite
                      : theme.palette.primary.dark;
                    return {
                      borderRadius: 2,
                      borderColor: tagColor,
                      color: tagColor,
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)',
                      '&:hover': {
                        background: `${tagColor}22`,
                        borderColor: tagDark,
                      }
                    };
                  }}
                />
              ))}
            </Box>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <ThumbUp sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                {question.likesCount}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Comment sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                {question.answers}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Visibility sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                {question.views}
              </Typography>
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

      <Dialog
        open={thumbnailPreviewOpen}
        onClose={() => setThumbnailPreviewOpen(false)}
        maxWidth="md"
      >
        {(thumbnailUrl || question?.thumbnail?.key) && (
          <Box sx={{ p: 0, m: 0 }}>
            <img
              src={thumbnailUrl || ''}
              alt={question.title}
              style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
              onError={async (e) => {
                const img = e.currentTarget;
                const currentSrc = img.src;
                
                // Eğer thumbnail key varsa, yeniden URL oluşturmayı dene
                if (question?.thumbnail?.key) {
                  try {
                    const { contentAssetService } = await import('../../services/contentAssetService');
                    const newUrl = await contentAssetService.resolveAssetUrl({
                      key: question.thumbnail.key,
                      type: 'question-thumbnail',
                      entityId: question.id,
                    });
                    if (newUrl && newUrl !== currentSrc) {
                      setThumbnailUrlState(newUrl);
                      img.src = newUrl;
                      return;
                    }
                  } catch (error) {
                    // Silent fail
                  }
                }
                
                img.style.display = 'none';
              }}
            />
          </Box>
        )}
      </Dialog>
    </StyledPaper>
  );
});

export default QuestionCard;
