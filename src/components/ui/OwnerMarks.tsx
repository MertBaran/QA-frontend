import React from 'react';
import { Box, Tooltip, Typography } from '@mui/material';
import { ThumbDown, ThumbUp } from '@mui/icons-material';
import { t } from '../../utils/translations';

export function isSamePerson(left?: string | null, right?: string | null): boolean {
  return !!left && !!right && left === right;
}

export function matchesAny(
  id?: string | null,
  candidates: Array<string | null | undefined> | string | null = [],
): boolean {
  const list = Array.isArray(candidates) ? candidates : [candidates];
  return list.some(candidate => isSamePerson(id, candidate));
}

const ownerTone = {
  question: 'primary',
  answer: 'info',
  comment: 'warning',
} as const;

export const OwnerRoleLabel: React.FC<{
  role: 'question' | 'answer' | 'comment';
  currentLanguage: string;
}> = ({ role, currentLanguage }) => {
  const tone = ownerTone[role];
  const labelKey = role === 'question' ? 'question_owner' : role === 'answer' ? 'answer_owner' : 'comment_owner';
  return (
    <Typography
      component="span"
      variant="caption"
      sx={{
        px: 0.75,
        py: 0.1,
        borderRadius: 1,
        fontWeight: 700,
        lineHeight: 1.6,
        letterSpacing: 0.2,
        color: `${tone}.contrastText`,
        bgcolor: `${tone}.main`,
      }}
    >
      {t(labelKey, currentLanguage)}
    </Typography>
  );
};

export const QuestionOwnerReaction: React.FC<{
  liked: boolean;
  disliked: boolean;
  currentLanguage: string;
}> = ({ liked, disliked, currentLanguage }) => {
  if (!liked && !disliked) return null;
  const positive = liked && !disliked;
  return (
    <Tooltip title={t(positive ? 'question_owner_liked' : 'question_owner_disliked', currentLanguage)}>
      <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', color: 'text.secondary' }}>
        {positive ? <ThumbUp sx={{ fontSize: 14 }} /> : <ThumbDown sx={{ fontSize: 14 }} />}
      </Box>
    </Tooltip>
  );
};
