import React from 'react';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import {
  ThumbUp,
  ThumbUpOutlined,
  ThumbDown,
  ThumbDownOutlined,
  Delete,
  HelpOutline,
  Edit,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import BookmarkButton from './BookmarkButton';
import { t } from '../../utils/translations';
import { useAppSelector } from '../../store/hooks';
import { useTheme } from '@mui/material/styles';
import type { AddBookmarkRequest } from '../../types/bookmark';

const AskButtonWrapperStyled = styled(Box)(({ theme }) => ({
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'flex-start',
  cursor: 'pointer',
  flexShrink: 0,
  width: '40px',
  height: '40px',
  overflow: 'visible',
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(0.5),
  margin: `-${theme.spacing(0.5)}`,
  boxSizing: 'border-box',
  transition: 'background-color 0.3s ease-in-out, border-color 0.3s ease-in-out, width 0.3s ease-in-out, min-width 0.3s ease-in-out, padding-left 0.3s ease-in-out, margin-left 0.3s ease-in-out',
  '& .hover-text': {
    position: 'relative',
    whiteSpace: 'nowrap',
    opacity: 0,
    transition: 'transform 0.3s ease-in-out',
    pointerEvents: 'none',
    zIndex: 1000,
    transform: 'translateX(0)',
    marginLeft: theme.spacing(0.5),
  },
  '& .hover-icon-box': {
    position: 'relative',
    transition: 'transform 0.5s ease-out',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    flexShrink: 0,
    zIndex: 1,
          '& .MuiIconButton-root': {
      transform: 'translateX(0)',
      transition: 'transform 0.5s ease-out, color 0.2s ease-in-out',
      '& svg': {
        transition: 'transform 0.5s ease-out',
        transform: 'rotate(0deg)',
      },
      '&:hover': {
        transform: 'translateX(0) !important',
        backgroundColor: 'transparent',
        color: '#FFB800',
      },
    },
  },
  '&:hover': {
    width: 'max-content',
    minWidth: 'max-content',
    paddingLeft: 'calc(8px + var(--text-width, 0px) * 0.3)',
    marginLeft: 'calc(-1 * var(--text-width, 0px) * 0.3)',
    backgroundColor: 'rgba(255, 184, 0, 0.1)',
    border: '1px solid rgba(255, 184, 0, 0.3)',
    '& .hover-text': {
      opacity: 1,
      transition: 'opacity 0.3s ease-in-out 0.15s, transform 0.8s ease-in-out',
      transitionDelay: '0.15s, 0s',
      transform: 'translateX(calc(-1 * var(--text-width , 0px) * 0.3))',
    },
    '& .hover-icon-box': {
      transform: 'translateX(calc(-1 * var(--text-width, 0px) * 0.3))',
      '& .MuiIconButton-root': {
        transform: 'translateX(0)',
        '& svg': {
          transform: 'rotate(180deg)',
        },
      },
    },
  },
}));



interface ActionButtonsProps {
  targetType: 'question' | 'answer';
  targetId: string;
  targetData: AddBookmarkRequest['targetData'];
  
  // Position
  position?: 'absolute' | 'relative';
  top?: string | number;
  right?: string | number;
  
  // Visibility flags
  showBookmark?: boolean;
  showLike?: boolean;
  showDislike?: boolean;
  showDelete?: boolean;
  showHelp?: boolean; // Only for questions
  showEdit?: boolean;
  // State
  isLiked?: boolean;
  isDisliked?: boolean;
  canDelete?: boolean;
  isBookmarked?: boolean;
  bookmarkId?: string | null;
  
  // Handlers
  onLike?: (e: React.MouseEvent) => void;
  onUnlike?: (e: React.MouseEvent) => void;
  onDislike?: (e: React.MouseEvent) => void;
  onUndislike?: (e: React.MouseEvent) => void;
  onDelete?: (e: React.MouseEvent) => void;
  onHelp?: (e: React.MouseEvent) => void;
  onEdit?: (e: React.MouseEvent) => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  targetType,
  targetId,
  targetData,
  position = 'absolute',
  top,
  right,
  showBookmark = true,
  showLike = false,
  showDislike = false,
  showDelete = false,
  showHelp = false,
  showEdit = false,
  isLiked = false,
  isDisliked = false,
  canDelete = false,
  isBookmarked,
  bookmarkId,
  onLike,
  onUnlike,
  onDislike,
  onUndislike,
  onDelete,
  onHelp,
  onEdit,
}) => {
  const theme = useTheme();
  const { currentLanguage } = useAppSelector(state => state.language);
  const { user } = useAppSelector(state => state.auth);
  const { name: themeName } = useAppSelector(state => state.theme);
  
  // Get negative and positive colors from theme
  const negativeColor = (theme.palette as any).custom?.negative || theme.palette.error.main;
  const positiveColor = (theme.palette as any).custom?.positive || theme.palette.success.main;
  
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
  
  // Theme-specific positive colors for like button
  const getPositiveColor = () => {
    if (themeName === 'magnefite') {
      // Magnefite uses #7A9470 (brighter greenish-gray) for like button
      return '#7A9470';
    }
    return positiveColor;
  };
  
  const negativeColorFinal = getNegativeColor();
  const positiveColorFinal = getPositiveColor();
  
  return (
    <Box sx={(theme) => {
      const baseStyles = {
        display: 'flex',
        gap: 1.5, // Gap'i 0.5'ten 1'e çıkardık
        alignItems: 'center',
        flexShrink: 0,
        flexDirection: 'row' as const,
      };
      
      if (position === 'absolute') {
        return {
          ...baseStyles,
          position: 'absolute',
          top: top !== undefined ? top : theme.spacing(2),
          right: right !== undefined ? right : theme.spacing(2),
          zIndex: 20,
        };
      }
      
      return baseStyles;
    }}>
      {showBookmark && (
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
            targetType={targetType}
            targetId={targetId} 
            targetData={targetData}
            isBookmarked={isBookmarked}
            bookmarkId={bookmarkId}
          />
        </Box>
      )}

      {showEdit && onEdit && (
        <Tooltip title={t('edit_question', currentLanguage)}>
          <IconButton
            size="small"
            onClick={onEdit}
            sx={{
              color: theme.palette.text.secondary,
              width: '40px',
              height: '40px',
              padding: 0,
              border: theme.palette.mode === 'light' ? `1px solid ${theme.palette.divider}` : 'none',
              backgroundColor: theme.palette.mode === 'light' ? theme.palette.background.paper : 'transparent',
              '&:hover': {
                color: theme.palette.primary.main,
                backgroundColor:
                  theme.palette.mode === 'dark'
                    ? `${theme.palette.primary.main}22`
                    : `${theme.palette.primary.main}11`,
                borderColor: theme.palette.mode === 'light' ? theme.palette.primary.main : undefined,
              },
            }}
          >
            <Edit />
          </IconButton>
        </Tooltip>
      )}

      {showLike && onLike && onUnlike && (
        <Tooltip title={isLiked ? t('unlike', currentLanguage) : t('like', currentLanguage)}>
          <IconButton
            size="small"
            onClick={isLiked ? onUnlike : onLike}
            sx={{
              color: isLiked ? positiveColorFinal : theme.palette.text.secondary,
              width: '40px',
              height: '40px',
              padding: 0,
              border: theme.palette.mode === 'light' ? `1px solid ${theme.palette.divider}` : 'none',
              backgroundColor: theme.palette.mode === 'light' ? theme.palette.background.paper : 'transparent',
              '&:hover': {
                color: isLiked ? positiveColorFinal : positiveColorFinal,
                backgroundColor: theme.palette.mode === 'dark' 
                  ? `${positiveColorFinal}22` 
                  : `${positiveColorFinal}11`,
                borderColor: theme.palette.mode === 'light' ? positiveColorFinal : undefined,
              },
            }}
          >
            {isLiked ? <ThumbUp /> : <ThumbUpOutlined />}
          </IconButton>
        </Tooltip>
      )}
      
      {showDislike && onDislike && onUndislike && (
        <Tooltip title={isDisliked ? t('undislike', currentLanguage) : t('dislike', currentLanguage)}>
          <IconButton
            size="small"
            onClick={isDisliked ? onUndislike : onDislike}
            sx={{
              color: isDisliked ? negativeColorFinal : theme.palette.text.secondary,
              width: '40px',
              height: '40px',
              padding: 0,
              border: theme.palette.mode === 'light' ? `1px solid ${theme.palette.divider}` : 'none',
              backgroundColor: theme.palette.mode === 'light' ? theme.palette.background.paper : 'transparent',
              '&:hover': {
                color: negativeColorFinal,
                backgroundColor: theme.palette.mode === 'dark' 
                  ? `${negativeColorFinal}22` 
                  : `${negativeColorFinal}11`,
                borderColor: theme.palette.mode === 'light' ? negativeColorFinal : undefined,
              },
            }}
          >
            {isDisliked ? <ThumbDown /> : <ThumbDownOutlined />}
          </IconButton>
        </Tooltip>
      )}
      
      {showDelete && canDelete && onDelete && (
        <Tooltip title={t('delete', currentLanguage)}>
          <IconButton
            size="small"
            onClick={onDelete}
            sx={{
              color: negativeColorFinal,
              cursor: 'pointer',
              width: '40px',
              height: '40px',
              padding: 0,
              border: theme.palette.mode === 'light' ? `1px solid ${theme.palette.divider}` : 'none',
              backgroundColor: theme.palette.mode === 'light' ? theme.palette.background.paper : 'transparent',
              '&:hover': {
                color: negativeColorFinal,
                backgroundColor: theme.palette.mode === 'dark' 
                  ? `${negativeColorFinal}22` 
                  : `${negativeColorFinal}11`,
                borderColor: theme.palette.mode === 'light' ? negativeColorFinal : undefined,
              },
            }}
          >
            <Delete />
          </IconButton>
        </Tooltip>
      )}
      
      {/* Help button rendered last to appear on top */}
      {showHelp && user && onHelp && (
        <Tooltip title={t('ask_question', currentLanguage)}>
          <IconButton
            size="small"
            onClick={onHelp}
            sx={{
              color: theme.palette.text.secondary,
              width: '40px',
              height: '40px',
              padding: 0,
              border: theme.palette.mode === 'light' ? `1px solid ${theme.palette.divider}` : 'none',
              backgroundColor: theme.palette.mode === 'light' ? theme.palette.background.paper : 'transparent',
              position: 'relative',
              zIndex: 30,
              '&:hover': {
                color: theme.palette.primary.main,
                backgroundColor: theme.palette.mode === 'dark' 
                  ? `${theme.palette.primary.main}22` 
                  : `${theme.palette.primary.main}11`,
                borderColor: theme.palette.mode === 'light' ? theme.palette.primary.main : undefined,
              },
            }}
          >
            <HelpOutline />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
};

export default ActionButtons;
