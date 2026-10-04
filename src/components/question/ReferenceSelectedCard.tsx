import React from 'react';
import { Box, Typography } from '@mui/material';
import ProfileAvatar from '../ui/ProfileAvatar';
import { stripRefLinksForDisplay } from '../../utils/refLinkDisplay';
import type { Question } from '../../types/question';
import type { Answer } from '../../types/answer';
import type { CommentItem } from '../../types/comment';

const PREVIEW_LENGTH = 80;

interface ReferenceSelectedCardProps {
  question?: Question | null;
  answer?: Answer | null;
  comment?: CommentItem | null;
  currentLanguage: string;
  /** Modal'da seçim için - verilirse tıklama sadece onSelect çağrılır, link açılmaz */
  onSelect?: () => void;
}

const ReferenceSelectedCard: React.FC<ReferenceSelectedCardProps> = ({
  question,
  answer,
  comment,
  currentLanguage,
  onSelect,
}) => {
  if (answer) {
    const questionId = answer.questionId;
    const handleClick = () => {
      if (onSelect) onSelect();
      else if (questionId) {
        window.open(`${window.location.origin}/questions/${questionId}#answer-${answer.id}`, '_blank', 'noopener,noreferrer');
      }
    };
    const avatarSrc = answer.userInfo?.profile_image || answer.author?.avatar || undefined;
    const ownerId = answer.userInfo?._id ?? answer.author?.id ?? undefined;
    const authorName = answer.author?.name ?? answer.userInfo?.name ?? '—';
    const contentDisplay = stripRefLinksForDisplay(answer.content);
    const handleAuthorClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (ownerId) window.open(`${window.location.origin}/profile/${ownerId}`, '_blank', 'noopener,noreferrer');
    };
    return (
      <Box
        component="button"
        type="button"
        onClick={handleClick}
        sx={(theme) => ({
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          p: 1.5,
          borderRadius: 1,
          border: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.default,
          cursor: 'pointer',
          textAlign: 'left',
          width: '100%',
          transition: 'border-color 0.2s, background-color 0.2s',
          '&:hover': {
            borderColor: theme.palette.primary.main,
            backgroundColor: theme.palette.mode === 'dark' ? `${theme.palette.primary.main}15` : `${theme.palette.primary.main}0a`,
          },
        })}
      >
        <Box
          component="button"
          type="button"
          onClick={handleAuthorClick}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            border: 'none',
            background: 'none',
            padding: 0,
            cursor: ownerId ? 'pointer' : 'default',
            flexShrink: 0,
            '&:hover': ownerId ? { opacity: 0.85 } : {},
          }}
        >
          <ProfileAvatar
            src={avatarSrc}
            ownerId={ownerId}
            fallbackName={authorName}
            sx={{ width: 32, height: 32, flexShrink: 0 }}
          />
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
            {authorName}
          </Typography>
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {answer.questionSummary && (
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', mb: 0.25 }}>
              {answer.questionSummary}
            </Typography>
          )}
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {contentDisplay?.slice(0, PREVIEW_LENGTH)}
            {contentDisplay && contentDisplay.length > PREVIEW_LENGTH ? '...' : ''}
          </Typography>
        </Box>
      </Box>
    );
  }

  if (question) {
    const handleClick = () => {
      if (onSelect) onSelect();
      else window.open(`${window.location.origin}/questions/${question.id}`, '_blank', 'noopener,noreferrer');
    };
    const avatarSrc = question.userInfo?.profile_image || question.author?.avatar || undefined;
    const ownerId = question.userInfo?._id ?? question.author?.id ?? undefined;
    const authorName = question.author?.name ?? question.userInfo?.name ?? '—';
    const detailDisplay = stripRefLinksForDisplay(question.detail);
    const handleAuthorClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (ownerId) window.open(`${window.location.origin}/profile/${ownerId}`, '_blank', 'noopener,noreferrer');
    };
    return (
      <Box
        component="button"
        type="button"
        onClick={handleClick}
        sx={(theme) => ({
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          p: 1.5,
          borderRadius: 1,
          border: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.default,
          cursor: 'pointer',
          textAlign: 'left',
          width: '100%',
          transition: 'border-color 0.2s, background-color 0.2s',
          '&:hover': {
            borderColor: theme.palette.primary.main,
            backgroundColor: theme.palette.mode === 'dark' ? `${theme.palette.primary.main}15` : `${theme.palette.primary.main}0a`,
          },
        })}
      >
        <Box
          component="button"
          type="button"
          onClick={handleAuthorClick}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            border: 'none',
            background: 'none',
            padding: 0,
            cursor: ownerId ? 'pointer' : 'default',
            flexShrink: 0,
            '&:hover': ownerId ? { opacity: 0.85 } : {},
          }}
        >
          <ProfileAvatar
            src={avatarSrc}
            ownerId={ownerId}
            fallbackName={authorName}
            sx={{ width: 32, height: 32, flexShrink: 0 }}
          />
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
            {authorName}
          </Typography>
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', mb: 0.25 }}>
            {question.summary}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {detailDisplay?.slice(0, PREVIEW_LENGTH)}
            {detailDisplay && detailDisplay.length > PREVIEW_LENGTH ? '...' : ''}
          </Typography>
        </Box>
      </Box>
    );
  }

  if (comment) {
    const handleClick = () => {
      if (onSelect) onSelect();
      else if (comment.questionId) {
        window.open(
          `${window.location.origin}/questions/${comment.questionId}#comment-${comment.id}`,
          '_blank',
          'noopener,noreferrer'
        );
      }
    };
    const bodyDisplay = stripRefLinksForDisplay(comment.body);
    const handleAuthorClick = (event: React.MouseEvent) => {
      event.stopPropagation();
      if (comment.userId) {
        window.open(`${window.location.origin}/profile/${comment.userId}`, '_blank', 'noopener,noreferrer');
      }
    };
    return (
      <Box
        component="button"
        type="button"
        onClick={handleClick}
        sx={theme => ({
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          p: 1.5,
          borderRadius: 1,
          border: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.default,
          cursor: 'pointer',
          textAlign: 'left',
          width: '100%',
          transition: 'border-color 0.2s, background-color 0.2s',
          '&:hover': {
            borderColor: theme.palette.primary.main,
            backgroundColor: theme.palette.mode === 'dark' ? `${theme.palette.primary.main}15` : `${theme.palette.primary.main}0a`,
          },
        })}
      >
        <Box
          component="button"
          type="button"
          onClick={handleAuthorClick}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            border: 'none',
            background: 'none',
            padding: 0,
            cursor: comment.userId ? 'pointer' : 'default',
            flexShrink: 0,
            '&:hover': comment.userId ? { opacity: 0.85 } : {},
          }}
        >
          <ProfileAvatar
            src={comment.authorAvatar}
            ownerId={comment.userId}
            fallbackName={comment.authorName}
            sx={{ width: 32, height: 32, flexShrink: 0 }}
          />
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
            {comment.authorName}
          </Typography>
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {bodyDisplay?.slice(0, PREVIEW_LENGTH)}
            {bodyDisplay && bodyDisplay.length > PREVIEW_LENGTH ? '...' : ''}
          </Typography>
        </Box>
      </Box>
    );
  }

  return null;
};

export default ReferenceSelectedCard;
