import React from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import {
  ThumbUp,
  ThumbUpOutlined,
  ThumbDown,
  ThumbDownOutlined,
  Delete,
  ContactSupport,
  Edit,
  ChatBubbleOutline,
} from '@mui/icons-material';
import BookmarkButton from './BookmarkButton';
import { t } from '../../utils/translations';
import { getNegativeActionColor } from '../../utils/themeNegativeColor';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { requestMessageCompose } from '../../store/messaging/messagingSlice';
import { useTheme } from '@mui/material/styles';
import type { AddBookmarkRequest } from '../../types/bookmark';

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
  messageRecipient?: { id: string; name: string; profile_image?: string };
  mention?: { questionId: string; answerId?: string; commentId?: string };
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
  messageRecipient,
  mention,
}) => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { currentLanguage } = useAppSelector(state => state.language);
  const { user } = useAppSelector(state => state.auth);
  const { name: themeName } = useAppSelector(state => state.theme);
  
  // Get positive colors from theme
  const positiveColor = (theme.palette as any).custom?.positive || theme.palette.success.main;
  
  // Theme-specific positive colors for like button
  const getPositiveColor = () => {
    if (themeName === 'magnefite') {
      // Magnefite uses #7A9470 (brighter greenish-gray) for like button
      return '#7A9470';
    }
    return positiveColor;
  };
  
  const negativeColorFinal = getNegativeActionColor(themeName, theme.palette.mode);
  const positiveColorFinal = getPositiveColor();
  const askHoverColor = theme.palette.mode === 'dark' ? '#F0C14B' : '#E6B325';
  
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

      {messageRecipient && mention?.questionId && user?.id && user.id !== messageRecipient.id && (
        <Tooltip title={t('send_message', currentLanguage)}>
          <IconButton
            size="small"
            onClick={event => {
              event.stopPropagation();
              dispatch(requestMessageCompose({
                recipient: {
                  id: messageRecipient.id,
                  name: messageRecipient.name,
                  profile_image: messageRecipient.profile_image,
                },
                questionId: mention.questionId,
                answerId: mention.answerId,
                commentId: mention.commentId,
              }));
            }}
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
            <ChatBubbleOutline />
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
                color: askHoverColor,
                backgroundColor: theme.palette.mode === 'dark'
                  ? `${askHoverColor}22`
                  : `${askHoverColor}22`,
                borderColor: theme.palette.mode === 'light' ? askHoverColor : undefined,
              },
            }}
          >
            <ContactSupport />
          </IconButton>
        </Tooltip>
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
    </Box>
  );
};

export default ActionButtons;
