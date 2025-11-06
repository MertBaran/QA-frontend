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
import { styled, useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { t } from '../../utils/translations';
import { useAppSelector } from '../../store/hooks';
import { Question, AncestorReference } from '../../types/question';
import { Answer } from '../../types/answer';
import { questionService } from '../../services/questionService';
import { answerService } from '../../services/answerService';
import papyrusHorizontal1 from '../../asset/textures/papyrus_horizontal_1.png';

// Helper function to get theme-specific colors
const getThemeColor = (themeName: string, theme: any, colorType: 'primary' | 'dark' = 'primary') => {
  if (themeName === 'molume') {
    return colorType === 'primary'
      ? (theme.palette.mode === 'dark' ? '#7A4A75' : '#5E315A') // Brighter purple in dark mode
      : (theme.palette.mode === 'dark' ? '#6D3B68' : '#4A2544'); // Brighter dark in dark mode
  } else if (themeName === 'magnefite') {
    return colorType === 'primary'
      ? (theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280') // Gray for Magnefite
      : (theme.palette.mode === 'dark' ? '#6B7280' : '#4B5563'); // Gray dark for Magnefite
  }
  return colorType === 'primary'
    ? theme.palette.primary.main
    : theme.palette.primary.dark;
};

const StyledDrawer = styled(Drawer, {
  shouldForwardProp: (prop) => prop !== 'isPapirus',
})<{ isPapirus?: boolean }>(({ theme, isPapirus }) => ({
  '& .MuiDrawer-paper': {
    width: 400,
    background: theme.palette.mode === 'dark'
      ? `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`
      : `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
    borderRight: `1px solid ${theme.palette.divider}`,
    color: theme.palette.text.primary,
    position: 'relative',
    overflow: 'hidden',
    ...(isPapirus ? {
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `url(${papyrusHorizontal1})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center 10%',
        backgroundRepeat: 'no-repeat',
        opacity: theme.palette.mode === 'dark' ? 0.12 : 0.15,
        pointerEvents: 'none',
        zIndex: 0,
      },
      '& > *': {
        position: 'relative',
        zIndex: 1,
      },
    } : {}),
  },
}));

const HeaderBox = styled(Box)<{ isMolume?: boolean; isMagnefite?: boolean }>(({ theme, isMolume, isMagnefite }) => {
  let parentColor: string, parentDark: string, parentLight: string;
  if (isMolume) {
    parentColor = theme.palette.mode === 'dark' ? '#7A4A75' : '#5E315A'; // Brighter purple in dark mode
    parentDark = theme.palette.mode === 'dark' ? '#6D3B68' : '#4A2544';
    parentLight = theme.palette.mode === 'dark' ? '#8B5A85' : '#6D3B68';
  } else if (isMagnefite) {
    parentColor = theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280'; // Gray for Magnefite
    parentDark = theme.palette.mode === 'dark' ? '#6B7280' : '#4B5563';
    parentLight = theme.palette.mode === 'dark' ? '#D1D5DB' : '#9CA3AF';
  } else {
    parentColor = theme.palette.primary.main;
    parentDark = theme.palette.primary.dark;
    parentLight = theme.palette.primary.light;
  }
  return {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(2),
    borderBottom: `1px solid ${theme.palette.divider}`,
    background: theme.palette.mode === 'dark'
      ? `linear-gradient(135deg, ${parentColor}22 0%, ${parentDark}11 100%)`
      : `linear-gradient(135deg, ${parentColor}11 0%, ${parentLight}05 100%)`,
  flexShrink: 0,
  };
});


const QuestionItem = styled(ListItem)<{ isMolume?: boolean; isMagnefite?: boolean }>(({ theme, isMolume, isMagnefite }) => {
  const parentColor = isMolume 
    ? (theme.palette.mode === 'dark' ? '#7A4A75' : '#5E315A') // Brighter purple in dark mode
    : isMagnefite 
    ? (theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280') // Gray for Magnefite
    : theme.palette.primary.main;
  return {
  cursor: 'pointer',
  borderBottom: `1px solid ${theme.palette.divider}`,
  padding: theme.spacing(2),
  transition: 'all 0.2s ease',
  '&:hover': {
      backgroundColor: theme.palette.mode === 'dark'
        ? `${parentColor}22`
        : `${parentColor}11`,
      borderLeft: `3px solid ${parentColor}`,
  },
  };
});

const AnswerItem = styled(ListItem)<{ isMolume?: boolean; isMagnefite?: boolean }>(({ theme, isMolume, isMagnefite }) => {
  const parentColor = isMolume 
    ? (theme.palette.mode === 'dark' ? '#7A4A75' : '#5E315A') // Brighter purple in dark mode
    : isMagnefite 
    ? (theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280') // Gray for Magnefite
    : theme.palette.primary.main;
  const parentDark = isMolume 
    ? (theme.palette.mode === 'dark' ? '#6D3B68' : '#4A2544') // Brighter dark in dark mode
    : isMagnefite 
    ? (theme.palette.mode === 'dark' ? '#6B7280' : '#4B5563') // Gray dark for Magnefitetetete
    : theme.palette.primary.dark;
  return {
  cursor: 'pointer',
  borderBottom: `1px solid ${theme.palette.divider}`,
  padding: theme.spacing(2),
  transition: 'all 0.2s ease',
    backgroundColor: theme.palette.mode === 'dark'
      ? `${parentColor}11`
      : `${parentColor}08`,
  '&:hover': {
      backgroundColor: theme.palette.mode === 'dark'
        ? `${parentColor}33`
        : `${parentColor}22`,
      borderLeft: `3px solid ${parentDark}`,
  },
  };
});

const DepthIndicator = styled(Box)<{ isMolume?: boolean; isMagnefite?: boolean; depth: number }>(({ theme, isMolume, isMagnefite, depth }) => {
  const parentColor = isMolume 
    ? (theme.palette.mode === 'dark' ? '#7A4A75' : '#5E315A') // Brighter purple in dark mode
    : isMagnefite 
    ? (theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280') // Gray for Magnefite
    : theme.palette.primary.main;
  const parentDark = isMolume 
    ? (theme.palette.mode === 'dark' ? '#6D3B68' : '#4A2544') // Brighter dark in dark mode
    : isMagnefite 
    ? (theme.palette.mode === 'dark' ? '#6B7280' : '#4B5563') // Gray dark for Magnefitetete
    : theme.palette.primary.dark;
  return {
  position: 'absolute',
  left: 0,
  top: 0,
  bottom: 0,
  width: '4px',
  background: depth % 2 === 0 
      ? `linear-gradient(90deg, ${parentColor}66 0%, ${parentColor}00 100%)`
      : `linear-gradient(90deg, ${parentDark}66 0%, ${parentDark}00 100%)`,
  transition: 'background 0.2s ease',
  };
});

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
  const theme = useTheme();
  const navigate = useNavigate();
  const { currentLanguage } = useAppSelector(state => state.language);
  const { name: themeName } = useAppSelector(state => state.theme);
  const isPapirus: boolean = themeName === 'papirus';
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
      isPapirus={isPapirus}
      PaperProps={{
        sx: {
          top: 80, // Topbar'dan aşağıda açılması için
          height: 'calc(100% - 80px)',
          maxHeight: '1000px',
          display: 'flex',
          flexDirection: 'column',
        }
      }}
    >
      <HeaderBox isMolume={themeName === 'molume'} isMagnefite={themeName === 'magnefite'}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <QuestionAnswer sx={{ 
            color: getThemeColor(themeName, theme, 'primary')
          }} />
          <Typography variant="h6" sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
            {t('ancestors', currentLanguage)}
          </Typography>
        </Box>
        <IconButton 
          onClick={onClose}
          sx={{ color: theme.palette.text.secondary }}
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
            background: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
          },
          '&::-webkit-scrollbar-thumb': {
            background: `${getThemeColor(themeName, theme, 'primary')}66`,
            borderRadius: '4px',
            '&:hover': {
              background: `${getThemeColor(themeName, theme, 'primary')}99`,
            },
          },
        }}
      >
        {loading && ancestorItems.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress sx={{ 
              color: getThemeColor(themeName, theme, 'primary')
            }} />
          </Box>
        ) : ancestorItems.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Help sx={{ fontSize: 48, color: theme.palette.text.disabled, mb: 2 }} />
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
              {t('no_ancestors', currentLanguage)}
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0, pb: 2, pr: 1 }}>
            {ancestorItems.map((item, index) => (
              <Box key={item.id} sx={{ position: 'relative' }}>
                <DepthIndicator depth={item.depth} isMolume={themeName === 'molume'} isMagnefite={themeName === 'magnefite'} />
                {item.type === 'question' && item.data ? (
                    <QuestionItem isMolume={themeName === 'molume'} isMagnefite={themeName === 'magnefite'}
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
                              sx={(theme) => {
                                const parentColor = getThemeColor(themeName, theme, 'primary');
                                const parentDark = getThemeColor(themeName, theme, 'dark');
                                return { 
                                bgcolor: item.depth % 2 === 0 
                                    ? `${parentColor}66` 
                                    : `${parentDark}66`, 
                                color: theme.palette.text.primary,
                                height: '20px',
                                fontSize: '0.7rem',
                                fontWeight: 700
                                };
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
                              sx={(theme) => ({ 
                                color: getThemeColor(themeName, theme, 'primary'), 
                                fontWeight: 600,
                                cursor: 'pointer',
                                '&:hover': { opacity: 0.7, textDecoration: 'underline' },
                                transition: 'all 0.2s ease'
                              })}
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
                              sx={(theme) => {
                                const parentColor = getThemeColor(themeName, theme, 'primary');
                                return { 
                                  bgcolor: `${parentColor}33`, 
                                  color: parentColor,
                                height: '18px',
                                fontSize: '0.7rem',
                                fontWeight: 700
                                };
                              }} 
                            />
                          </Box>
                          <Typography 
                            variant="body2" 
                            sx={(theme) => ({ 
                              color: theme.palette.text.primary, 
                              fontWeight: 500,
                              wordBreak: 'break-word',
                            })}
                          >
                            {(item.data as Question).title}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Typography 
                          variant="caption" 
                          sx={(theme) => ({ 
                            color: theme.palette.text.secondary, 
                            mt: 0.5,
                            wordBreak: 'break-word',
                          })}
                        >
                          {(item.data as Question).content}
                        </Typography>
                      }
                    />
                  </QuestionItem>
                ) : item.type === 'answer' && item.data ? (
                    <AnswerItem isMolume={themeName === 'molume'} isMagnefite={themeName === 'magnefite'}
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
                              sx={(theme) => {
                                const parentColor = getThemeColor(themeName, theme, 'primary');
                                const parentDark = getThemeColor(themeName, theme, 'dark');
                                return { 
                                bgcolor: item.depth % 2 === 0 
                                    ? `${parentColor}66` 
                                    : `${parentDark}66`, 
                                color: theme.palette.text.primary,
                                height: '20px',
                                fontSize: '0.7rem',
                                fontWeight: 700
                                };
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
                              sx={(theme) => ({ 
                                color: getThemeColor(themeName, theme, 'primary'), 
                                fontWeight: 600,
                                cursor: 'pointer',
                                '&:hover': { opacity: 0.7, textDecoration: 'underline' },
                                transition: 'all 0.2s ease'
                              })}
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
                              sx={(theme) => {
                                const parentDark = getThemeColor(themeName, theme, 'dark');
                                return { 
                                  bgcolor: `${parentDark}33`, 
                                  color: parentDark,
                                height: '18px',
                                fontSize: '0.7rem',
                                fontWeight: 700
                                };
                              }} 
                            />
                          </Box>
                          {(item.data as Answer).questionTitle && (
                            <Typography 
                              variant="caption" 
                              sx={(theme) => ({ 
                                color: theme.palette.text.secondary, 
                                mb: 0.5,
                                wordBreak: 'break-word',
                              })}
                            >
                              {(item.data as Answer).questionTitle}
                            </Typography>
                          )}
                          <Typography 
                            variant="body2" 
                            sx={(theme) => ({ 
                              color: theme.palette.text.primary, 
                              fontWeight: 500,
                              wordBreak: 'break-word',
                            })}
                          >
                            {(item.data as Answer).content}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Typography 
                          variant="caption" 
                          sx={(theme) => ({ 
                            color: theme.palette.text.secondary, 
                            mt: 0.5,
                            wordBreak: 'break-word',
                          })}
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
            <CircularProgress size={24} sx={{ 
              color: getThemeColor(themeName, theme, 'primary')
            }} />
          </Box>
        )}
      </Box>
    </StyledDrawer>
  );
};

export default AncestorsDrawer;
