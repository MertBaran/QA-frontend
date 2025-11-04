import React from 'react';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import {
  ThumbUp,
  ThumbUpOutlined,
  ThumbDown,
  ThumbDownOutlined,
  Delete,
  HelpOutline,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import BookmarkButton from './BookmarkButton';
import { t } from '../../utils/translations';
import { useAppSelector } from '../../store/hooks';
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
}) => {
  const { currentLanguage } = useAppSelector(state => state.language);
  const { user } = useAppSelector(state => state.auth);
  
  return (
    <Box sx={(theme) => {
      const baseStyles = {
        display: 'flex',
        gap: 0.5,
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
          zIndex: 10,
        };
      }
      
      return baseStyles;
    }}>
      {showHelp && user && onHelp && (
        <AskButtonWrapperStyled
          ref={(el: HTMLDivElement | null) => {
            if (el) {
              const textEl = el.querySelector('.hover-text') as HTMLElement;
              if (textEl) {
                const width = textEl.offsetWidth;
                el.style.setProperty('--text-width', `${width}px`);
              }
            }
          }}
          onClick={onHelp}
        >
          <Box className="hover-icon-box">
            <IconButton
              size="small"
              sx={{
                color: 'rgba(255,255,255,0.7)',
                width: '40px',
                height: '40px',
                padding: 0,
              }}
            >
              <HelpOutline />
            </IconButton>
          </Box>
          <Typography 
            className="hover-text"
            variant="caption"
            sx={{ 
              color: 'rgba(255,255,255,0.8)',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              fontSize: '0.75rem',
              visibility: 'hidden',
              position: 'absolute',
              left: '48px',
            }}
          >
            {t('ask_question', currentLanguage)}
          </Typography>
          <Typography 
            className="hover-text"
            variant="caption"
            sx={{ 
              color: 'rgba(255,255,255,0.8)',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              fontSize: '0.75rem',
            }}
          >
            {t('ask_question', currentLanguage)}
          </Typography>
        </AskButtonWrapperStyled>
      )}
      
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
      
      {showLike && onLike && onUnlike && (
        <Tooltip title={isLiked ? t('unlike', currentLanguage) : t('like', currentLanguage)}>
          <IconButton
            size="small"
            onClick={isLiked ? onUnlike : onLike}
            sx={{
              color: isLiked ? '#FFB800' : 'rgba(255,255,255,0.7)',
              width: '40px',
              height: '40px',
              padding: 0,
              '&:hover': {
                color: isLiked ? '#FF8F00' : '#FFB800',
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
              color: isDisliked ? '#FF6B6B' : 'rgba(255,255,255,0.7)',
              width: '40px',
              height: '40px',
              padding: 0,
              '&:hover': {
                color: isDisliked ? '#FF5252' : '#FF6B6B',
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
              color: 'rgba(255,80,80,0.8)',
              cursor: 'pointer',
              width: '40px',
              height: '40px',
              padding: 0,
              '&:hover': {
                color: 'rgba(255,80,80,1)',
              },
            }}
          >
            <Delete />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
};

export default ActionButtons;
