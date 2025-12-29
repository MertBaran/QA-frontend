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

const HeaderBox = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isMolume' && prop !== 'isMagnefite',
})<{ isMolume?: boolean; isMagnefite?: boolean }>(({ theme, isMolume, isMagnefite }) => {
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


const QuestionItem = styled(ListItem, {
  shouldForwardProp: (prop) => prop !== 'isMolume' && prop !== 'isMagnefite',
})<{ isMolume?: boolean; isMagnefite?: boolean }>(({ theme, isMolume, isMagnefite }) => {
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

const AnswerItem = styled(ListItem, {
  shouldForwardProp: (prop) => prop !== 'isMolume' && prop !== 'isMagnefite',
})<{ isMolume?: boolean; isMagnefite?: boolean }>(({ theme, isMolume, isMagnefite }) => {
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

const DepthIndicator = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isMolume' && prop !== 'isMagnefite' && prop !== 'depth',
})<{ isMolume?: boolean; isMagnefite?: boolean; depth: number }>(({ theme, isMolume, isMagnefite, depth }) => {
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
  // Depth 0 (parent) için özel renk - her zaman parentColor kullan
  const indicatorColor = depth === 0 ? parentColor : (depth % 2 === 0 ? parentColor : parentDark);
  return {
  position: 'absolute',
  left: 0,
  top: 0,
  bottom: 0,
  width: '4px',
  background: `linear-gradient(90deg, ${indicatorColor}66 0%, ${indicatorColor}00 100%)`,
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
  onClose: (event?: React.SyntheticEvent) => void;
  ancestors: AncestorReference[];
  currentQuestionId: string;
  contentType?: 'question' | 'answer'; // Add contentType to distinguish between question and answer
}

const AncestorsDrawer: React.FC<AncestorsDrawerProps> = ({
  open,
  onClose,
  ancestors,
  currentQuestionId,
  contentType = 'question', // Default to 'question' for backward compatibility
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { currentLanguage } = useAppSelector(state => state.language);
  const { name: themeName } = useAppSelector(state => state.theme);
  const isPapirus: boolean = themeName === 'papirus';
  const [ancestorItems, setAncestorItems] = useState<AncestorItem[]>([]);
  const [parentItem, setParentItem] = useState<AncestorItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loadedCount, setLoadedCount] = useState(0);
  const [lastQuestionId, setLastQuestionId] = useState<string>('');
  const ITEMS_PER_LOAD = 5;

  // Find parent (depth 0) and filter ancestors with depth > 0
  const parentAncestor = ancestors.find(a => a.depth === 0);
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
      const loadedItemsResults = await Promise.all(
        itemsToLoad.map(async (ancestor) => {
          try {
            if (ancestor.type === 'question') {
              const question = await questionService.getQuestionById(ancestor.id);
              return [{
                id: ancestor.id,
                type: 'question' as const,
                depth: ancestor.depth,
                data: question,
              } as AncestorItem];
            } else {
              const answer = await answerService.getAnswerById(ancestor.id);
              // If answer has a question, load it and add it as an ancestor item
              const items: AncestorItem[] = [{
                id: ancestor.id,
                type: 'answer' as const,
                depth: ancestor.depth,
                data: answer,
              } as AncestorItem];
              
              // If answer has a questionId, add the question as an ancestor too
              if (answer && answer.questionId) {
                try {
                  const question = await questionService.getQuestionById(answer.questionId);
                  if (question) {
                    items.push({
                      id: answer.questionId,
                      type: 'question' as const,
                      depth: ancestor.depth + 1, // Normal depth sequence
                      data: question,
                    } as AncestorItem);
                  }
                } catch (error) {
                  console.error(`Error loading answer's question ${answer.questionId}:`, error);
                }
              }
              
              return items;
            }
          } catch (error) {
            console.error(`Error loading ancestor ${ancestor.id}:`, error);
            return [{
              id: ancestor.id,
              type: ancestor.type,
              depth: ancestor.depth,
              loading: false,
            } as AncestorItem];
          }
        })
      );
      
      // Flatten the array (since answer items can return multiple items)
      const flattenedItems = loadedItemsResults.flat();

      setAncestorItems(prev => {
        const existingIds = new Set(prev.map(item => item.id));
        const newItems = flattenedItems.filter(item => !existingIds.has(item.id));
        
        // Find all existing depths to avoid conflicts
        const existingDepths = new Set(prev.map(item => item.depth));
        
        // Adjust depths for answer questions to avoid conflicts
        const adjustedItems = newItems.map(item => {
          // If this is a question that was added after an answer, check if depth conflicts
          if (item.type === 'question') {
            // Check if there's already an item at this depth
            if (existingDepths.has(item.depth)) {
              // Find the next available depth
              let nextDepth = item.depth;
              while (existingDepths.has(nextDepth)) {
                nextDepth++;
              }
              existingDepths.add(nextDepth);
              return { ...item, depth: nextDepth };
            }
            existingDepths.add(item.depth);
          } else {
            existingDepths.add(item.depth);
          }
          return item;
        });
        
        // Sort by depth to maintain order
        const sorted = [...prev, ...adjustedItems].sort((a, b) => a.depth - b.depth);
        return sorted;
      });
      setLoadedCount(startIndex + itemsToLoad.length);
      setHasMore(startIndex + itemsToLoad.length < filteredAncestors.length);
    } catch (error) {
      console.error('Error loading ancestors:', error);
    } finally {
      setLoading(false);
    }
  }, [filteredAncestors]);

  // Load parent (depth 0) if exists
  const loadParent = useCallback(async () => {
    if (!parentAncestor) {
      setParentItem(null);
      return;
    }

    setLoading(true);
    try {
      if (parentAncestor.type === 'question') {
        const question = await questionService.getQuestionById(parentAncestor.id);
        if (question) {
          setParentItem({
            id: parentAncestor.id,
            type: parentAncestor.type,
            depth: 0,
            data: question,
          });
        }
      } else {
        const answer = await answerService.getAnswerById(parentAncestor.id);
        if (answer) {
          setParentItem({
            id: parentAncestor.id,
            type: parentAncestor.type,
            depth: 0,
            data: answer,
          });
          
          // If answer has a questionId, load the question and add it to ancestorItems
          if (answer.questionId) {
            try {
              const question = await questionService.getQuestionById(answer.questionId);
              if (question) {
                setAncestorItems(prev => {
                  const existingIds = new Set(prev.map(item => item.id));
                  if (!existingIds.has(answer.questionId!)) {
                    // Find all existing depths to avoid conflicts
                    const existingDepths = new Set(prev.map(item => item.depth));
                    
                    // Start with depth 1, but find next available if conflict
                    let questionDepth = 1;
                    while (existingDepths.has(questionDepth)) {
                      questionDepth++;
                    }
                    
                    const questionItem: AncestorItem = {
                      id: answer.questionId!,
                      type: 'question',
                      depth: questionDepth,
                      data: question,
                    };
                    return [questionItem, ...prev].sort((a, b) => a.depth - b.depth);
                  }
                  return prev;
                });
              }
            } catch (error) {
              console.error(`Error loading parent answer's question ${answer.questionId}:`, error);
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error loading parent ${parentAncestor.id}:`, error);
      setParentItem({
        id: parentAncestor.id,
        type: parentAncestor.type,
        depth: 0,
        loading: false,
      });
    } finally {
      setLoading(false);
    }
  }, [parentAncestor]);

  // Initial load when opening drawer or question changes
  useEffect(() => {
    if (open && lastQuestionId !== currentQuestionId) {
      // Reset state only when question changes
      setAncestorItems([]);
      setParentItem(null);
      setLoadedCount(0);
      setHasMore(true);
      setLastQuestionId(currentQuestionId);
      
      // Load parent first
      loadParent();
      
      // Then load ancestors
      if (filteredAncestors.length > 0) {
      const initialCount = getInitialLoadCount();
      loadAncestors(0, initialCount);
      }
    } else if (open && ancestorItems.length === 0 && !parentItem && filteredAncestors.length > 0) {
      // Initial load if items are empty
      loadParent();
      const initialCount = getInitialLoadCount();
      loadAncestors(0, initialCount);
    } else if (open && !parentItem && parentAncestor) {
      // Load parent if not loaded yet
      loadParent();
    }
  }, [open, currentQuestionId, lastQuestionId, filteredAncestors.length, ancestorItems.length, parentItem, parentAncestor, getInitialLoadCount, loadAncestors, loadParent]);

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

  const handleDrawerClose = (event: React.SyntheticEvent) => {
    event?.stopPropagation();
    onClose(event);
  };

  return (
    <StyledDrawer
      anchor="left"
      open={open}
      onClose={handleDrawerClose}
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
            {t(contentType === 'answer' ? 'answer_ancestors' : 'question_ancestors', currentLanguage)}
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
        {loading && ancestorItems.length === 0 && !parentItem ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress sx={{ 
              color: getThemeColor(themeName, theme, 'primary')
            }} />
          </Box>
        ) : ancestorItems.length === 0 && !parentItem ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Help sx={{ fontSize: 48, color: theme.palette.text.disabled, mb: 2 }} />
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
              {t('no_ancestors', currentLanguage)}
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0, pb: 2, pr: 1 }}>
            {/* Parent Item - #1 */}
            {parentItem && (
              <Box key={parentItem.id} sx={{ position: 'relative' }}>
                <DepthIndicator depth={0} isMolume={themeName === 'molume'} isMagnefite={themeName === 'magnefite'} />
                {parentItem.type === 'question' && parentItem.data ? (
                  <QuestionItem 
                    isMolume={themeName === 'molume'} 
                    isMagnefite={themeName === 'magnefite'}
                    sx={{ 
                      borderBottom: `1px solid ${theme.palette.divider}`,
                      '&:hover': {
                        borderLeft: `3px solid ${getThemeColor(themeName, theme, 'primary')}`,
                      }
                    }}
                    onClick={(e) => handleQuestionClick(e, parentItem.id)}
                    onMouseDown={(e) => {
                      if (e.button === 1) {
                        handleQuestionClick(e, parentItem.id);
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
                              label="#1"
                              size="small" 
                              sx={(theme) => {
                                const parentColor = getThemeColor(themeName, theme, 'primary');
                                return { 
                                  bgcolor: `${parentColor}66`, 
                                  color: theme.palette.text.primary,
                                  height: '20px',
                                  fontSize: '0.7rem',
                                  fontWeight: 700
                                };
                              }} 
                            />
                            <Avatar 
                              src={(parentItem.data as Question).userInfo?.profile_image || (parentItem.data as Question).author.avatar} 
                              sx={{ 
                                width: 28, 
                                height: 28,
                                cursor: 'pointer',
                                '&:hover': { opacity: 0.7, transform: 'scale(1.1)' },
                                transition: 'all 0.2s ease'
                              }}
                              onClick={(e) => handleAvatarClick(e, (parentItem.data as Question).author.id)}
                              onMouseDown={(e) => {
                                if (e.button === 1) {
                                  handleAvatarClick(e, (parentItem.data as Question).author.id);
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
                              onClick={(e) => handleNameClick(e, (parentItem.data as Question).author.id)}
                              onMouseDown={(e) => {
                                if (e.button === 1) {
                                  handleNameClick(e, (parentItem.data as Question).author.id);
                                }
                              }}
                            >
                              {(parentItem.data as Question).userInfo?.name || (parentItem.data as Question).author.name}
                            </Typography>
                            <Chip 
                              label={t('question', currentLanguage)} 
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
                            {(parentItem.data as Question).title}
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
                          {(parentItem.data as Question).content}
                        </Typography>
                      }
                    />
                  </QuestionItem>
                ) : parentItem.type === 'answer' && parentItem.data ? (
                  <AnswerItem 
                    isMolume={themeName === 'molume'} 
                    isMagnefite={themeName === 'magnefite'}
                    sx={{ 
                      borderBottom: `1px solid ${theme.palette.divider}`,
                      '&:hover': {
                        borderLeft: `3px solid ${getThemeColor(themeName, theme, 'primary')}`,
                      }
                    }}
                    onClick={(e) => handleAnswerClick(e, parentItem.data as Answer)}
                    onMouseDown={(e) => {
                      if (e.button === 1) {
                        handleAnswerClick(e, parentItem.data as Answer);
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
                              label="#1"
                              size="small" 
                              sx={(theme) => {
                                const parentColor = getThemeColor(themeName, theme, 'primary');
                                return { 
                                  bgcolor: `${parentColor}66`, 
                                  color: theme.palette.text.primary,
                                  height: '20px',
                                  fontSize: '0.7rem',
                                  fontWeight: 700
                                };
                              }} 
                            />
                            <Avatar 
                              src={(parentItem.data as Answer).userInfo?.profile_image || (parentItem.data as Answer).author.avatar} 
                              sx={{ 
                                width: 28, 
                                height: 28,
                                cursor: 'pointer',
                                '&:hover': { opacity: 0.7, transform: 'scale(1.1)' },
                                transition: 'all 0.2s ease'
                              }}
                              onClick={(e) => handleAvatarClick(e, (parentItem.data as Answer).author.id)}
                              onMouseDown={(e) => {
                                if (e.button === 1) {
                                  handleAvatarClick(e, (parentItem.data as Answer).author.id);
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
                              onClick={(e) => handleNameClick(e, (parentItem.data as Answer).author.id)}
                              onMouseDown={(e) => {
                                if (e.button === 1) {
                                  handleNameClick(e, (parentItem.data as Answer).author.id);
                                }
                              }}
                            >
                              {(parentItem.data as Answer).userInfo?.name || (parentItem.data as Answer).author.name}
                            </Typography>
                            <Chip 
                              label={t('answer', currentLanguage)} 
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
                            {(parentItem.data as Answer).content}
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
                          {(parentItem.data as Answer).questionTitle}
                        </Typography>
                      }
                    />
                  </AnswerItem>
                ) : null}
              </Box>
            )}
            {/* Other Ancestors */}
            {ancestorItems.map((item, index) => {
              // Calculate display number: parent is #1, first ancestor is #2, etc.
              const displayNumber = index + 2; // +2 because parent is #1
              return (
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
                              label={`#${displayNumber}`}
                              size="small" 
                              sx={(theme) => {
                                const parentColor = getThemeColor(themeName, theme, 'primary');
                                const parentDark = getThemeColor(themeName, theme, 'dark');
                                return { 
                                bgcolor: displayNumber % 2 === 0 
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
                              label={t('question', currentLanguage)} 
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
                              label={`#${displayNumber}`}
                              size="small" 
                              sx={(theme) => {
                                const parentColor = getThemeColor(themeName, theme, 'primary');
                                const parentDark = getThemeColor(themeName, theme, 'dark');
                                return { 
                                bgcolor: displayNumber % 2 === 0 
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
                              label={t('answer', currentLanguage)} 
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
                      secondary={null}
                    />
                  </AnswerItem>
                ) : null}
              </Box>
            );
            })}
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
