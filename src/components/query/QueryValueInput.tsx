import React, { useMemo, useState } from 'react';
import {
  Autocomplete,
  Box,
  Chip,
  CircularProgress,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import type { QueryFieldDef, QueryOp } from '../../types/query';
import { searchService } from '../../services/searchService';
import { t } from '../../utils/translations';

type TreeValue = {
  id: string;
  contentType: 'question' | 'answer';
  depth?: number;
  label?: string;
};

interface Props {
  field?: QueryFieldDef;
  op: QueryOp;
  value: unknown;
  onChange: (value: unknown) => void;
  currentLanguage: string;
}

function optionLabel(
  option: string,
  field: QueryFieldDef,
  currentLanguage: string
): string {
  if (field.optionLabels?.[option]) {
    const raw = field.optionLabels[option]!;
    const fromKey = t(raw, currentLanguage);
    return fromKey && fromKey !== raw ? fromKey : raw;
  }
  const translated = t(option, currentLanguage);
  if (translated && translated !== option) return translated;
  return option;
}

const MULTI_OPS: QueryOp[] = ['contains', 'notContains', 'in', 'notIn'];

const QueryValueInput: React.FC<Props> = ({
  field,
  op,
  value,
  onChange,
  currentLanguage,
}) => {
  const [userOptions, setUserOptions] = useState<{ id: string; name: string }[]>([]);
  const [userLoading, setUserLoading] = useState(false);
  const [contentOptions, setContentOptions] = useState<
    { id: string; label: string; contentType: 'question' | 'answer' }[]
  >([]);
  const [contentLoading, setContentLoading] = useState(false);

  const selectableOptions = useMemo(() => {
    if (!field) return [] as string[];
    if (field.options && field.options.length > 0) return field.options;
    return [] as string[];
  }, [field]);

  const noValue = op === 'isEmpty' || op === 'isNotEmpty';
  if (noValue || !field) {
    return (
      <Typography variant="body2" color="text.secondary">
        —
      </Typography>
    );
  }

  const treeOps = [
    'directChildOf',
    'childAtDepth',
    'descendantOf',
    'directParentOf',
    'parentAtDepth',
    'ancestorOf',
  ];
  const needsDepth = op === 'childAtDepth' || op === 'parentAtDepth';

  if (field.type === 'tree' || treeOps.includes(op)) {
    const tv = (value && typeof value === 'object' ? value : {}) as TreeValue;
    return (
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
        <Select
          size="small"
          value={tv.contentType || 'question'}
          onChange={e =>
            onChange({
              ...tv,
              contentType: e.target.value as 'question' | 'answer',
            })
          }
          sx={{ minWidth: 110 }}
        >
          <MenuItem value="question">{t('query_content_question', currentLanguage)}</MenuItem>
          <MenuItem value="answer">{t('query_content_answer', currentLanguage)}</MenuItem>
        </Select>
        <Autocomplete
          size="small"
          sx={{ minWidth: 220, flex: 1 }}
          options={contentOptions}
          loading={contentLoading}
          filterOptions={x => x}
          getOptionLabel={o => o.label}
          value={
            tv.id
              ? contentOptions.find(o => o.id === tv.id) || {
                  id: tv.id,
                  label: tv.label || tv.id,
                  contentType: tv.contentType || 'question',
                }
              : null
          }
          onInputChange={async (_e, term, reason) => {
            if (reason === 'reset') return;
            if (term.length < 3) {
              setContentOptions([]);
              return;
            }
            setContentLoading(true);
            try {
              if ((tv.contentType || 'question') === 'answer') {
                const { answers } = await searchService.searchAnswers(
                  term,
                  1,
                  12,
                  'any_word'
                );
                setContentOptions(
                  answers.map(a => ({
                    id: a.id || (a as { _id?: string })._id || '',
                    label: (a.content || '').slice(0, 80),
                    contentType: 'answer' as const,
                  }))
                );
              } else {
                const { questions } = await searchService.searchQuestions(
                  term,
                  1,
                  12,
                  'any_word'
                );
                setContentOptions(
                  questions.map(q => ({
                    id: q.id || (q as { _id?: string })._id || '',
                    label: q.summary,
                    contentType: 'question' as const,
                  }))
                );
              }
            } catch {
              setContentOptions([]);
            } finally {
              setContentLoading(false);
            }
          }}
          onChange={(_e, v) =>
            onChange({
              id: v?.id || '',
              contentType: v?.contentType || tv.contentType || 'question',
              depth: tv.depth,
              label: v?.label,
            })
          }
          renderInput={params => (
            <TextField
              {...params}
              placeholder={t('query_pick_content', currentLanguage)}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {contentLoading ? <CircularProgress size={14} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />
        {needsDepth && (
          <TextField
            size="small"
            type="number"
            label={t('query_depth', currentLanguage)}
            value={tv.depth ?? 1}
            onChange={e =>
              onChange({ ...tv, depth: Math.max(1, Number(e.target.value) || 1) })
            }
            sx={{ width: 90 }}
            inputProps={{ min: 1, max: 20 }}
          />
        )}
      </Box>
    );
  }

  if (field.type === 'user' || field.valueSource === 'users') {
    const selectedId = typeof value === 'string' ? value : '';
    return (
      <Autocomplete
        size="small"
        sx={{ minWidth: 220 }}
        options={userOptions}
        loading={userLoading}
        getOptionLabel={o => o.name}
        value={userOptions.find(o => o.id === selectedId) || null}
        onInputChange={async (_e, term) => {
          if (term.length < 3) {
            setUserOptions([]);
            return;
          }
          setUserLoading(true);
          try {
            const { users } = await searchService.searchUsers(term, 1, 12);
            setUserOptions(users.map(u => ({ id: u.id, name: u.name })));
          } catch {
            setUserOptions([]);
          } finally {
            setUserLoading(false);
          }
        }}
        onChange={(_e, v) => onChange(v?.id || '')}
        renderInput={params => (
          <TextField
            {...params}
            placeholder={t('query_pick_user', currentLanguage)}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {userLoading ? <CircularProgress size={14} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
      />
    );
  }

  if (field.type === 'boolean') {
    return (
      <Select
        size="small"
        value={String(value ?? 'true')}
        onChange={e => onChange(e.target.value === 'true')}
        sx={{ minWidth: 120 }}
      >
        <MenuItem value="true">{t('query_true', currentLanguage)}</MenuItem>
        <MenuItem value="false">{t('query_false', currentLanguage)}</MenuItem>
      </Select>
    );
  }

  if (field.type === 'date' || field.featureType === 'date') {
    return (
      <TextField
        size="small"
        type="date"
        value={String(value || '').slice(0, 10)}
        onChange={e => onChange(e.target.value)}
        InputLabelProps={{ shrink: true }}
      />
    );
  }

  if (field.type === 'number' || field.featureType === 'number') {
    return (
      <TextField
        size="small"
        type="number"
        value={value === undefined || value === null ? '' : String(value)}
        onChange={e =>
          onChange(e.target.value === '' ? '' : Number(e.target.value))
        }
      />
    );
  }

  // Known option lists: selectable for = / != / contains / in / etc.
  if (selectableOptions.length > 0) {
    const useMulti =
      MULTI_OPS.includes(op) ||
      field.type === 'string[]' ||
      field.featureType === 'list';

    if (useMulti) {
      const arr = Array.isArray(value)
        ? value.map(String)
        : value
          ? [String(value)]
          : [];
      return (
        <Autocomplete
          multiple
          disableCloseOnSelect
          size="small"
          options={selectableOptions}
          value={arr}
          onChange={(_e, v) => onChange(v)}
          getOptionLabel={o => optionLabel(o, field, currentLanguage)}
          renderOption={(props, option, { selected }) => (
            <li {...props} key={option}>
              <Box
                component="span"
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  mr: 1,
                  bgcolor: selected ? 'primary.main' : 'transparent',
                  border: '1px solid',
                  borderColor: selected ? 'primary.main' : 'divider',
                }}
              />
              {optionLabel(option, field, currentLanguage)}
            </li>
          )}
          renderTags={(tagValue, getTagProps) =>
            tagValue.map((option, index) => (
              <Chip
                size="small"
                label={optionLabel(option, field, currentLanguage)}
                {...getTagProps({ index })}
                key={option}
              />
            ))
          }
          renderInput={params => (
            <TextField
              {...params}
              placeholder={t('query_select_items', currentLanguage)}
            />
          )}
          sx={{ minWidth: 220 }}
        />
      );
    }

    return (
      <Select
        size="small"
        value={String(value ?? '')}
        onChange={e => onChange(e.target.value)}
        displayEmpty
        sx={{ minWidth: 180 }}
      >
        <MenuItem value="">
          <em>—</em>
        </MenuItem>
        {selectableOptions.map(o => (
          <MenuItem key={o} value={o}>
            {optionLabel(o, field, currentLanguage)}
          </MenuItem>
        ))}
      </Select>
    );
  }

  // Free-form multi (e.g. tags without catalog options)
  if (field.type === 'string[]' || op === 'in' || op === 'notIn') {
    const arr = Array.isArray(value)
      ? value.map(String)
      : String(value || '')
          .split(',')
          .map(s => s.trim())
          .filter(Boolean);

    return (
      <Autocomplete
        multiple
        freeSolo
        size="small"
        options={[]}
        value={arr}
        onChange={(_e, v) => onChange(v.map(String))}
        renderTags={(tagValue, getTagProps) =>
          tagValue.map((option, index) => (
            <Chip size="small" label={option} {...getTagProps({ index })} key={option} />
          ))
        }
        renderInput={params => (
          <TextField
            {...params}
            placeholder={t('query_comma_values', currentLanguage)}
          />
        )}
        sx={{ minWidth: 200 }}
      />
    );
  }

  return (
    <TextField
      size="small"
      value={value === undefined || value === null ? '' : String(value)}
      onChange={e => onChange(e.target.value)}
      sx={{ minWidth: 180 }}
    />
  );
};

export default QueryValueInput;
