import React from 'react';
import { Box, Chip, Tooltip, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import type { QueryMatchExplanation } from '../../types/query';
import { t } from '../../utils/translations';

interface Props {
  matches: QueryMatchExplanation[];
  currentLanguage: string;
  /** When true, renders as the top strip of a parent result shell */
  embedded?: boolean;
}

function formatValue(value: unknown, currentLanguage: string): string {
  if (value === undefined || value === null || value === '') return '';
  if (Array.isArray(value)) {
    return value.map(v => formatValue(v, currentLanguage)).filter(Boolean).join(', ');
  }
  if (typeof value === 'object') {
    const v = value as Record<string, unknown>;
    if (typeof v['label'] === 'string' && v['label']) return v['label'];
    if (typeof v['id'] === 'string') {
      const depth =
        typeof v['depth'] === 'number'
          ? ` · ${t('query_depth', currentLanguage)} ${v['depth']}`
          : '';
      return `${v['id']}${depth}`;
    }
    return JSON.stringify(value);
  }
  const raw = String(value);
  const translated = t(raw, currentLanguage);
  return translated && translated !== raw ? translated : raw;
}

function fieldTitle(m: QueryMatchExplanation, currentLanguage: string): string {
  const base = m.label || t(m.labelKey, currentLanguage) || m.field;
  return m.group ? `${m.group} › ${base}` : base;
}

const QueryMatchBadges: React.FC<Props> = ({
  matches,
  currentLanguage,
  embedded = false,
}) => {
  const theme = useTheme();
  if (!matches.length) return null;

  return (
    <Box
      sx={{
        px: 1.25,
        py: 0.75,
        borderBottom: embedded
          ? `1px solid ${alpha(theme.palette.divider, 0.35)}`
          : undefined,
        borderRadius: embedded ? 0 : 1,
        border: embedded ? 'none' : `1px solid ${alpha(theme.palette.divider, 0.35)}`,
        backgroundColor: alpha(
          theme.palette.primary.main,
          theme.palette.mode === 'dark' ? 0.06 : 0.03
        ),
      }}
    >
      <Typography
        variant="caption"
        sx={{
          display: 'block',
          mb: 0.75,
          color: 'text.secondary',
          fontWeight: 600,
          letterSpacing: 0.2,
        }}
      >
        {t('query_matched_conditions', currentLanguage)}
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
        {matches.map((m, i) => {
          const opLabel = t(`query_op_${m.op}`, currentLanguage) || m.op;
          const valueLabel = formatValue(m.value, currentLanguage);
          const title = fieldTitle(m, currentLanguage);
          const text = valueLabel
            ? `${title} ${opLabel} ${valueLabel}`
            : `${title} ${opLabel}`;
          return (
            <Tooltip key={`${m.field}-${m.op}-${i}`} title={text} arrow>
              <Chip
                size="small"
                label={text}
                sx={{
                  maxWidth: '100%',
                  height: 'auto',
                  py: 0.5,
                  '& .MuiChip-label': {
                    whiteSpace: 'normal',
                    display: 'block',
                    lineHeight: 1.35,
                    fontSize: '0.75rem',
                  },
                  bgcolor: alpha(
                    theme.palette.primary.main,
                    theme.palette.mode === 'dark' ? 0.18 : 0.1
                  ),
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.28)}`,
                }}
              />
            </Tooltip>
          );
        })}
      </Box>
    </Box>
  );
};

export default QueryMatchBadges;
