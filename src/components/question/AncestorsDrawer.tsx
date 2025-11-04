import React, { useEffect, useState, useCallback } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Avatar,
  Divider,
  Chip,
} from '@mui/material';
import { Close, QuestionAnswer, Help } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { t } from '../../utils/translations';
import { useAppSelector } from '../../store/hooks';
import { Question, AncestorReference } from '../../types/question';
import { Answer } from '../../types/answer';
import { questionService } from '../../services/questionService';
import { answerService } from '../../services/answerService';

const StyledDrawer = styled(Drawer)(({ theme }) => ({
  '& .MuiDrawer-paper': {
    width: 400,
    background: 'linear-gradient(135deg, rgba(10, 26, 35, 0.98) 0%, rgba(21, 42, 53, 0.99) 100%)',
    borderRight: '1px solid rgba(255, 184, 0, 0.2)',
    color: 'white',
  },
}));

const HeaderBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(2),
  borderBottom: '1px solid rgba(255, 184, 0, 0.2)',
  background: 'linear-gradient(135deg, rgba(255, 184, 0, 0.1) 0%, rgba(255, 143, 0, 0.05) 100%)',
  flexShrink: 0,
}));


const QuestionItem = styled(ListItem)(({ theme }) => ({
  cursor: 'pointer',
  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
  padding: theme.spacing(2),
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: 'rgba(255, 184, 0, 0.05)',
    borderLeft: '3px solid rgba(255, 184, 0, 0.5)',
  },
}));

const AnswerItem = styled(ListItem)(({ theme }) => ({
  cursor: 'pointer',
  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
  padding: theme.spacing(2),
  transition: 'all 0.2s ease',
  backgroundColor: 'rgba(255, 184, 0, 0.02)',
  '&:hover': {
    backgroundColor: 'rgba(255, 184, 0, 0.08)',
    borderLeft: '3px solid rgba(255, 143, 0, 0.5)',
  },
}));

const DepthIndicator = styled(Box)(({ theme, depth }: { theme?: any; depth: number }) => ({
  position: 'absolute',
  left: 0,
  top: 0,
  bottom: 0,
  width: '4px',
  background: depth % 2 === 0 
    ? 'linear-gradient(90deg, rgba(255, 184, 0, 0.3) 0%, rgba(255, 184, 0, 0) 100%)'
    : 'linear-gradient(90deg, rgba(255, 143, 0, 0.3) 0%, rgba(255, 143, 0, 0) 100%)',
  transition: 'background 0.2s ease',
}));

interface AncestorItem {
  id: string;
  type: 'question' | 'answer';
  depth: number;
  data?: Question | Answer;
  loading?: boolean;
}

interface AncestorsDrawerProps {
  open: boolean;
  onClose: () => void;
  ancestors: AncestorReference[];
  currentQuestionId: string;
}

const AncestorsDrawer: React.FC<AncestorsDrawerProps> = ({
  open,
  onClose,
  ancestors,
  currentQuestionId,
}) => {
  const navigate = useNavigate();
  const { currentLanguage } = useAppSelector(state => state.language);
  const [ancestorItems, setAncestorItems] = useState<AncestorItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loadedCount, setLoadedCount] = useState(0);
  const [lastQuestionId, setLastQuestionId] = useState<string>('');
  const ITEMS_PER_LOAD = 5;

  // Filter out current question's direct parent (depth 0) and only show ancestors with depth > 0
  // Sort from newest (lowest depth) to oldest (highest depth) - depth 1 is most recent, depth 5 is oldest
  const filteredAncestors = ancestors
    .filter(a => a.depth > 0)
    .sort((a, b) => a.depth - b.depth);
  
  // Calculate initial load count to ensure scrollbar is visible
  // Average item height ~120px, drawer scroll area ~500-700px
  // Need at least 6-7 items to trigger scrollbar
  const getInitialLoadCount = useCallback(() => {
    if (filteredAncestors.length <= ITEMS_PER_LOAD) {
      return filteredAncestors.length;
    }
    // If there are more items, load enough to ensure scrollbar appears
    // Load at least 8 items or total if less
    return Math.min(8, filteredAncestors.length);
  }, [filteredAncestors.length]);

  // Load ancestor data
  const loadAncestors = useCallback(async (startIndex: number, count: number) => {
    const itemsToLoad = filteredAncestors.slice(startIndex, startIndex + count);
    if (itemsToLoad.length === 0) {
      setHasMore(false);
      return;
    }

    setLoading(true);
    try {
      const loadedItems: AncestorItem[] = await Promise.all(
        itemsToLoad.map(async (ancestor) => {
          try {
            if (ancestor.type === 'question') {
              const question = await questionService.getQuestionById(ancestor.id);
              return {
                id: ancestor.id,
                type: 'question',
                depth: ancestor.depth,
                data: question,
              } as AncestorItem;
            } else {
              const answer = await answerService.getAnswerById(ancestor.id);
              return {
                id: ancestor.id,
                type: 'answer',
                depth: ancestor.depth,
                data: answer,
              } as AncestorItem;
            }
          } catch (error) {
            console.error(`Error loading ancestor ${ancestor.id}:`, error);
            return {
              id: ancestor.id,
              type: ancestor.type,
              depth: ancestor.depth,
              loading: false,
            } as AncestorItem;
          }
        })
      );

      setAncestorItems(prev => {
        const existingIds = new Set(prev.map(item => item.id));
        const newItems = loadedItems.filter(item => !existingIds.has(item.id));
        return [...prev, ...newItems];
      });
      setLoadedCount(startIndex + itemsToLoad.length);
      setHasMore(startIndex + itemsToLoad.length < filteredAncestors.length);
    } catch (error) {
      console.error('Error loading ancestors:', error);
    } finally {
      setLoading(false);
    }
  }, [filteredAncestors]);

  // Initial load when opening drawer or question changes
  useEffect(() => {
    if (open && filteredAncestors.length > 0 && lastQuestionId !== currentQuestionId) {
      // Reset state only when question changes
      setAncestorItems([]);
      setLoadedCount(0);
      setHasMore(true);
      setLastQuestionId(currentQuestionId);
      const initialCount = getInitialLoadCount();
      loadAncestors(0, initialCount);
    } else if (open && ancestorItems.length === 0 && filteredAncestors.length > 0) {
      // Initial load if items are empty
      const initialCount = getInitialLoadCount();
      loadAncestors(0, initialCount);
    }
  }, [open, currentQuestionId, lastQuestionId, filteredAncestors.length, getInitialLoadCount, loadAncestors]);

  // Reset when closed
  useEffect(() => {
    if (!open) {
      // Don't reset immediately, keep items for faster reopening
      // setAncestorItems([]);
      // setLoadedCount(0);
      // setHasMore(true);
    }
  }, [open]);

  // Handle scroll for infinite loading
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
    
    if (scrollBottom < 100 && !loading && hasMore) {
      loadAncestors(loadedCount, ITEMS_PER_LOAD);
    }
  }, [loading, hasMore, loadedCount, loadAncestors]);

  const handleAvatarClick = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();
    
    if (e.ctrlKey || e.metaKey || e.button === 1) {
      e.preventDefault();
      window.open(`/profile/${userId}`, '_blank');
      return;
    }

    navigate(`/profile/${userId}`);
  };

  const handleNameClick = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();
    
    if (e.ctrlKey || e.metaKey || e.button === 1) {
      e.preventDefault();
      window.open(`/profile/${userId}`, '_blank');
      return;
    }

    navigate(`/profile/${userId}`);
  };

  const handleQuestionClick = (e: React.MouseEvent, questionId: string) => {
    if (e.ctrlKey || e.metaKey || e.button === 1) {
      e.preventDefault();
      window.open(`/questions/${questionId}`, '_blank');
      return;
    }

    navigate(`/questions/${questionId}`);
  };

  const handleAnswerClick = (e: React.MouseEvent, answer: Answer) => {
    const questionId = answer.questionId;
    if (!questionId) return;

    if (e.ctrlKey || e.metaKey || e.button === 1) {
      e.preventDefault();
      window.open(`/questions/${questionId}#answer-${answer.id}`, '_blank');
      return;
    }

    navigate(`/questions/${questionId}#answer-${answer.id}`);
  };

  return (
    <StyledDrawer
      anchor="left"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          top: 'auto',
          height: '70%',
          maxHeight: '800px',
          display: 'flex',
          flexDirection: 'column',
        }
      }}
    >
      <HeaderBox>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <QuestionAnswer sx={{ color: 'rgba(255, 184, 0, 0.9)' }} />
          <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
            {t('ancestors', currentLanguage)}
          </Typography>
        </Box>
        <IconButton 
          onClick={onClose}
          sx={{ color: 'rgba(255,255,255,0.7)' }}
        >
          <Close />
        </IconButton>
      </HeaderBox>

      <Box 
        onScroll={handleScroll}
        sx={{ 
          padding: 0,
          flex: 1,
          minHeight: 0,
          maxHeight: 'calc(100% - 73px)',
          overflowY: 'auto',
          overflowX: 'hidden',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'rgba(255, 255, 255, 0.05)',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(255, 184, 0, 0.3)',
            borderRadius: '4px',
            '&:hover': {
              background: 'rgba(255, 184, 0, 0.5)',
            },
          },
        }}
      >
        {loading && ancestorItems.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress sx={{ color: 'rgba(255, 184, 0, 0.8)' }} />
          </Box>
        ) : ancestorItems.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Help sx={{ fontSize: 48, color: 'rgba(255,255,255,0.3)', mb: 2 }} />
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
              {t('no_ancestors', currentLanguage)}
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0, pb: 2, pr: 1 }}>
            {ancestorItems.map((item, index) => (
              <Box key={item.id} sx={{ position: 'relative' }}>
                <DepthIndicator depth={item.depth} />
                {item.type === 'question' && item.data ? (
                  <QuestionItem
                    onClick={(e) => handleQuestionClick(e, item.id)}
                    onMouseDown={(e) => {
                      if (e.button === 1) {
                        handleQuestionClick(e, item.id);
                      }
                    }}
                  >
                    <ListItemText
                      sx={{ 
                        ml: '16px',
                        '& .MuiListItemText-primary': {
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          wordBreak: 'break-word',
                          maxWidth: 'calc(100% - 16px)',
                        },
                        '& .MuiListItemText-secondary': {
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          wordBreak: 'break-word',
                          maxWidth: 'calc(100% - 16px)',
                        },
                      }}
                      primary={
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Chip 
                              label={`#${item.depth}`}
                              size="small" 
                              sx={{ 
                                bgcolor: item.depth % 2 === 0 
                                  ? 'rgba(255, 184, 0, 0.3)' 
                                  : 'rgba(255, 143, 0, 0.3)', 
                                color: 'rgba(255,255,255,0.9)',
                                height: '20px',
                                fontSize: '0.7rem',
                                fontWeight: 700
                              }} 
                            />
                            <Avatar 
                              src={(item.data as Question).userInfo?.profile_image || (item.data as Question).author.avatar} 
                              sx={{ 
                                width: 28, 
                                height: 28,
                                cursor: 'pointer',
                                '&:hover': { opacity: 0.7, transform: 'scale(1.1)' },
                                transition: 'all 0.2s ease'
                              }}
                              onClick={(e) => handleAvatarClick(e, (item.data as Question).author.id)}
                              onMouseDown={(e) => {
                                if (e.button === 1) {
                                  handleAvatarClick(e, (item.data as Question).author.id);
                                }
                              }}
                            />
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                color: 'rgba(255,184,0,0.9)', 
                                fontWeight: 600,
                                cursor: 'pointer',
                                '&:hover': { opacity: 0.7, textDecoration: 'underline' },
                                transition: 'all 0.2s ease'
                              }}
                              onClick={(e) => handleNameClick(e, (item.data as Question).author.id)}
                              onMouseDown={(e) => {
                                if (e.button === 1) {
                                  handleNameClick(e, (item.data as Question).author.id);
                                }
                              }}
                            >
                              {(item.data as Question).userInfo?.name || (item.data as Question).author.name}
                            </Typography>
                            <Chip 
                              label="Q" 
                              size="small" 
                              sx={{ 
                                bgcolor: 'rgba(255, 184, 0, 0.2)', 
                                color: 'rgba(255, 184, 0, 0.9)',
                                height: '18px',
                                fontSize: '0.7rem',
                                fontWeight: 700
                              }} 
                            />
                          </Box>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: 'white', 
                              fontWeight: 500,
                              wordBreak: 'break-word',
                            }}
                          >
                            {(item.data as Question).title}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: 'rgba(255,255,255,0.6)', 
                            mt: 0.5,
                            wordBreak: 'break-word',
                          }}
                        >
                          {(item.data as Question).content}
                        </Typography>
                      }
                    />
                  </QuestionItem>
                ) : item.type === 'answer' && item.data ? (
                  <AnswerItem
                    onClick={(e) => handleAnswerClick(e, item.data as Answer)}
                    onMouseDown={(e) => {
                      if (e.button === 1) {
                        handleAnswerClick(e, item.data as Answer);
                      }
                    }}
                  >
                    <ListItemText
                      sx={{ 
                        ml: '16px',
                        '& .MuiListItemText-primary': {
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          wordBreak: 'break-word',
                          maxWidth: 'calc(100% - 16px)',
                        },
                        '& .MuiListItemText-secondary': {
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          wordBreak: 'break-word',
                          maxWidth: 'calc(100% - 16px)',
                        },
                      }}
                      primary={
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Chip 
                              label={`#${item.depth}`}
                              size="small" 
                              sx={{ 
                                bgcolor: item.depth % 2 === 0 
                                  ? 'rgba(255, 184, 0, 0.3)' 
                                  : 'rgba(255, 143, 0, 0.3)', 
                                color: 'rgba(255,255,255,0.9)',
                                height: '20px',
                                fontSize: '0.7rem',
                                fontWeight: 700
                              }} 
                            />
                            <Avatar 
                              src={(item.data as Answer).userInfo?.profile_image || (item.data as Answer).author.avatar} 
                              sx={{ 
                                width: 28, 
                                height: 28,
                                cursor: 'pointer',
                                '&:hover': { opacity: 0.7, transform: 'scale(1.1)' },
                                transition: 'all 0.2s ease'
                              }}
                              onClick={(e) => handleAvatarClick(e, (item.data as Answer).author.id)}
                              onMouseDown={(e) => {
                                if (e.button === 1) {
                                  handleAvatarClick(e, (item.data as Answer).author.id);
                                }
                              }}
                            />
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                color: 'rgba(255,184,0,0.9)', 
                                fontWeight: 600,
                                cursor: 'pointer',
                                '&:hover': { opacity: 0.7, textDecoration: 'underline' },
                                transition: 'all 0.2s ease'
                              }}
                              onClick={(e) => handleNameClick(e, (item.data as Answer).author.id)}
                              onMouseDown={(e) => {
                                if (e.button === 1) {
                                  handleNameClick(e, (item.data as Answer).author.id);
                                }
                              }}
                            >
                              {(item.data as Answer).userInfo?.name || (item.data as Answer).author.name}
                            </Typography>
                            <Chip 
                              label="A" 
                              size="small" 
                              sx={{ 
                                bgcolor: 'rgba(255, 143, 0, 0.2)', 
                                color: 'rgba(255, 143, 0, 0.9)',
                                height: '18px',
                                fontSize: '0.7rem',
                                fontWeight: 700
                              }} 
                            />
                          </Box>
                          {(item.data as Answer).questionTitle && (
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                color: 'rgba(255,184,0,0.6)', 
                                mb: 0.5,
                                wordBreak: 'break-word',
                              }}
                            >
                              {(item.data as Answer).questionTitle}
                            </Typography>
                          )}
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: 'white', 
                              fontWeight: 500,
                              wordBreak: 'break-word',
                            }}
                          >
                            {(item.data as Answer).content}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: 'rgba(255,255,255,0.6)', 
                            mt: 0.5,
                            wordBreak: 'break-word',
                          }}
                        >
                          {(item.data as Answer).content}
                        </Typography>
                      }
                    />
                  </AnswerItem>
                ) : null}
              </Box>
            ))}
          </List>
        )}

        {loading && ancestorItems.length > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={24} sx={{ color: 'rgba(255, 184, 0, 0.8)' }} />
          </Box>
        )}
      </Box>
    </StyledDrawer>
  );
};

export default AncestorsDrawer;

