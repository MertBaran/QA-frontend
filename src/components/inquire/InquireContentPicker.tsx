import React, { useState } from 'react';
import {
  Autocomplete,
  Box,
  CircularProgress,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { searchService } from '../../services/searchService';
import { t } from '../../utils/translations';
import type { InquireContentRef, InquireContentType } from '../../types/inquire';

interface Props {
  label: string;
  value: InquireContentRef | null;
  onChange: (v: InquireContentRef | null) => void;
  currentLanguage: string;
}

const InquireContentPicker: React.FC<Props> = ({
  label,
  value,
  onChange,
  currentLanguage,
}) => {
  const [contentType, setContentType] = useState<InquireContentType>(
    value?.contentType || 'question'
  );
  const [options, setOptions] = useState<InquireContentRef[]>([]);
  const [loading, setLoading] = useState(false);

  return (
    <Box component="div" display="flex" flexDirection="column" gap={1}>
      <Typography variant="subtitle2">{label}</Typography>
      <Box component="div" display="flex" gap={1}>
        <Select
          size="small"
          value={contentType}
          onChange={e => {
            const next = e.target.value as InquireContentType;
            setContentType(next);
            setOptions([]);
            onChange(null);
          }}
          style={{ minWidth: 110 }}
        >
          <MenuItem value="question">
            {t('inquire_type_question', currentLanguage)}
          </MenuItem>
          <MenuItem value="answer">
            {t('inquire_type_answer', currentLanguage)}
          </MenuItem>
        </Select>
        <Autocomplete
          size="small"
          style={{ flex: 1, minWidth: 0 }}
          options={options}
          loading={loading}
          // Sunucu zaten filtreledi; MUI'nin label substring filtresi ES sonuçlarını gizlemesin
          filterOptions={x => x}
          getOptionLabel={o => o.label || o.id}
          isOptionEqualToValue={(a, b) => a.id === b.id}
          value={value}
          onInputChange={async (_e, term, reason) => {
            if (reason === 'reset') return;
            if (term.length < 2) {
              setOptions([]);
              return;
            }
            setLoading(true);
            try {
              if (contentType === 'answer') {
                const { answers } = await searchService.searchAnswers(
                  term,
                  1,
                  12,
                  'any_word'
                );
                setOptions(
                  answers.map(a => ({
                    id: a.id || (a as { _id?: string })._id || '',
                    contentType: 'answer' as const,
                    label: (a.content || '').replace(/\s+/g, ' ').slice(0, 80),
                  }))
                );
              } else {
                const { questions } = await searchService.searchQuestions(
                  term,
                  1,
                  12,
                  'any_word'
                );
                setOptions(
                  questions.map(q => ({
                    id: q.id || (q as { _id?: string })._id || '',
                    contentType: 'question' as const,
                    label: q.summary,
                  }))
                );
              }
            } catch {
              setOptions([]);
            } finally {
              setLoading(false);
            }
          }}
          onChange={(_e, v) => onChange(v)}
          renderInput={params => (
            <TextField
              {...params}
              placeholder={t('inquire_pick_content', currentLanguage)}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loading ? <CircularProgress size={14} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />
      </Box>
    </Box>
  );
};

export default InquireContentPicker;
