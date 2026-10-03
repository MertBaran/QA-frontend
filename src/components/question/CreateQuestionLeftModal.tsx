import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Autocomplete,
  Chip,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { t } from '../../utils/translations';
import { TAG_MAX_LENGTH, TAG_MAX_COUNT } from '../../constants/questionValidation';
import { questionFeatureTemplateService } from '../../services/questionFeatureTemplateService';
import type { QuestionFeatureTemplate } from '../../types/questionFeatureTemplate';
import {
  FeatureFieldFormValue,
  initialFormValuesFromDefs,
  parseFeatureFieldDefs,
} from '../../utils/featureTemplateUtils';
import FeatureTemplateFieldsEditor from './FeatureTemplateFieldsEditor';

const FORMAT_OPTIONS = [
  'format_ne',
  'format_niye',
  'format_nasil',
  'format_hangisi',
  'format_evet_hayir',
  'format_kim',
  'format_nicelik',
  'format_yer',
  'format_zaman',
  'format_teyit',
  'format_belirsiz',
] as const;

const INTEREST_OPTIONS = ['interest_gundelik', 'interest_akademik', 'interest_ahiretlik', 'interest_belirsiz'] as const;

export interface CreateQuestionLeftState {
  visibility: boolean;
  format: string;
  interest: string;
  focus: string;
  /** Seçili özellik şablonu (uuid) veya boş */
  featureTemplateId: string;
  /** fieldId -> form değeri (liste çoklu ise string[]) */
  featureFieldValues: Record<string, FeatureFieldFormValue>;
}

interface CreateQuestionLeftModalProps {
  open: boolean;
  state: CreateQuestionLeftState;
  onStateChange: (state: CreateQuestionLeftState) => void;
  question: { category: string; tags: string };
  onQuestionChange: (field: string, value: string) => void;
  validationErrors?: { tags?: string };
  currentLanguage: string;
  /** Edit modunda sadece şablon düzenlenebilir */
  readOnly?: boolean;
}

const CreateQuestionLeftModal: React.FC<CreateQuestionLeftModalProps> = ({
  open,
  state,
  onStateChange,
  question,
  onQuestionChange,
  validationErrors,
  currentLanguage,
  readOnly = false,
}) => {
  const { visibility, format, interest, focus, featureTemplateId, featureFieldValues } = state;

  const tagsArray = question.tags
    ? question.tags
        .split(',')
        .map((t) => t.trim().slice(0, TAG_MAX_LENGTH))
        .filter(Boolean)
        .slice(0, TAG_MAX_COUNT)
    : [];
  const [tagInputValue, setTagInputValue] = useState('');

  const handleTagsChange = (_: unknown, newValue: string[]) => {
    const limited = newValue
      .slice(0, TAG_MAX_COUNT)
      .map((t) => t.slice(0, TAG_MAX_LENGTH));
    onQuestionChange('tags', limited.join(', '));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ',' || e.key === 'Enter') {
      e.preventDefault();
      const trimmed = tagInputValue.trim().slice(0, TAG_MAX_LENGTH);
      if (trimmed && tagsArray.length < TAG_MAX_COUNT) {
        const newTags = [...tagsArray, trimmed];
        onQuestionChange('tags', newTags.join(', '));
        setTagInputValue('');
      }
    }
  };

  const handleTagInputChange = (_: unknown, v: string) => {
    if (tagsArray.length >= TAG_MAX_COUNT) {
      setTagInputValue('');
      return;
    }
    if (v.includes(',')) {
      const parts = v.split(',').map((p) => p.trim().slice(0, TAG_MAX_LENGTH)).filter(Boolean);
      const toAdd = parts.slice(0, TAG_MAX_COUNT - tagsArray.length);
      const remainder = parts.slice(toAdd.length).join(', ').slice(0, TAG_MAX_LENGTH);
      if (toAdd.length > 0) {
        const newTags = [...tagsArray, ...toAdd];
        onQuestionChange('tags', newTags.join(', '));
      }
      setTagInputValue(remainder);
    } else {
      setTagInputValue(v.slice(0, TAG_MAX_LENGTH));
    }
  };

  useEffect(() => {
    if (!open) setTagInputValue('');
  }, [open]);

  const [templates, setTemplates] = useState<QuestionFeatureTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setTemplatesLoading(true);
    questionFeatureTemplateService
      .list()
      .then((list) => {
        if (!cancelled) setTemplates(list);
      })
      .catch(() => {
        if (!cancelled) setTemplates([]);
      })
      .finally(() => {
        if (!cancelled) setTemplatesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const selectedDefs =
    (() => {
      const tpl = templates.find((x) => x.id === featureTemplateId);
      if (!tpl?.currentVersion?.fields) return [];
      return parseFeatureFieldDefs(tpl.currentVersion.fields);
    })();

  const setFeatureTemplateId = (id: string) => {
    const tpl = templates.find((x) => x.id === id);
    const defs = tpl?.currentVersion?.fields
      ? parseFeatureFieldDefs(tpl.currentVersion.fields)
      : [];
    const nextValues = id ? initialFormValuesFromDefs(defs) : {};
    onStateChange({ ...state, featureTemplateId: id, featureFieldValues: nextValues });
  };

  const setFeatureFieldValue = (fieldId: string, value: FeatureFieldFormValue) => {
    onStateChange({
      ...state,
      featureFieldValues: { ...featureFieldValues, [fieldId]: value },
    });
  };

  if (!open) return null;

  const setVisibility = (v: boolean) => onStateChange({ ...state, visibility: v });
  const setFormat = (value: string) => onStateChange({ ...state, format: value });
  const setInterest = (value: string) => onStateChange({ ...state, interest: value });
  const setFocus = (v: string) => onStateChange({ ...state, focus: v });

  return (
    <Box
      sx={(theme) => ({
        width: 280,
        minWidth: 280,
        flexShrink: 0,
        minHeight: 0,
        height: '100%',
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        background:
          theme.palette.mode === 'dark'
            ? `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`
            : `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
        boxShadow: theme.shadows[8],
        overflow: 'auto',
      })}
    >
      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Tooltip title={visibility ? t('visibility_visible', currentLanguage) : t('visibility_hidden', currentLanguage)}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              cursor: 'pointer',
              '&:hover': { opacity: 0.9 },
            }}
            onClick={() => setVisibility(!visibility)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setVisibility(!visibility); } }}
          >
            <Typography variant="body1" sx={{ color: (theme) => theme.palette.text.primary, fontWeight: 500, fontSize: '1.125rem', lineHeight: 1.2 }}>
              {t('visibility', currentLanguage)}
            </Typography>
            <IconButton component="span" disableRipple sx={{ p: 0.25, ml: 'auto', pointerEvents: 'none' }}>
              {visibility ? (
                <Visibility sx={{ fontSize: 28, color: (theme) => theme.palette.primary.main }} />
              ) : (
                <VisibilityOff sx={{ fontSize: 28, color: (theme) => theme.palette.text.secondary }} />
              )}
            </IconButton>
          </Box>
        </Tooltip>
        <TextField
          fullWidth
          size="small"
          label={t('search_by_created_at', currentLanguage)}
          value={new Date().toLocaleString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })}
          InputProps={{ readOnly: true }}
          disabled={readOnly}
          sx={{ '& .MuiInputBase-input': { color: (theme) => theme.palette.text.primary } }}
        />
        <FormControl fullWidth size="small" disabled={readOnly}>
          <InputLabel>{t('format', currentLanguage)}</InputLabel>
          <Select
            value={format}
            label={t('format', currentLanguage)}
            onChange={(e) => setFormat(e.target.value)}
            sx={{ '& .MuiSelect-select': { color: (theme) => theme.palette.text.primary } }}
          >
            <MenuItem value="">
              <em>—</em>
            </MenuItem>
            {FORMAT_OPTIONS.map((opt) => (
              <MenuItem key={opt} value={opt}>
                {t(opt, currentLanguage)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth size="small" disabled={readOnly}>
          <InputLabel>{t('interest', currentLanguage)}</InputLabel>
          <Select
            value={interest}
            label={t('interest', currentLanguage)}
            onChange={(e) => setInterest(e.target.value)}
            sx={{ '& .MuiSelect-select': { color: (theme) => theme.palette.text.primary } }}
          >
            <MenuItem value="">
              <em>—</em>
            </MenuItem>
            {INTEREST_OPTIONS.map((opt) => (
              <MenuItem key={opt} value={opt}>
                {t(opt, currentLanguage)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          fullWidth
          size="small"
          label={t('category', currentLanguage)}
          value={question.category}
          onChange={(e) => !readOnly && onQuestionChange('category', e.target.value)}
          placeholder={t('category_placeholder', currentLanguage)}
          InputProps={{ readOnly: readOnly }}
          sx={{ '& .MuiInputBase-input': { color: (theme) => theme.palette.text.primary } }}
        />
        <Autocomplete
          multiple
          freeSolo
          size="small"
          options={[]}
          value={tagsArray}
          onChange={readOnly ? undefined : handleTagsChange}
          disabled={readOnly}
          inputValue={tagInputValue}
          onInputChange={handleTagInputChange}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip
                {...getTagProps({ index })}
                key={option}
                label={option}
                size="small"
                sx={{ '& .MuiChip-label': { color: (theme) => theme.palette.text.primary } }}
              />
            ))
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label={t('tags', currentLanguage)}
              placeholder={tagsArray.length === 0 && tagInputValue === '' ? t('tags_placeholder', currentLanguage) : undefined}
              error={!!validationErrors?.tags}
              helperText={validationErrors?.tags}
              onKeyDown={handleTagInputKeyDown}
              multiline
              minRows={2}
              inputProps={{
                ...params.inputProps,
                maxLength: TAG_MAX_LENGTH,
                readOnly: tagsArray.length >= TAG_MAX_COUNT,
              }}
              sx={{
                '& .MuiInputBase-input': {
                  color: (theme) => theme.palette.text.primary,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                },
                '& .MuiInputBase-root': { minHeight: 56, alignItems: 'flex-start', pt: 1, pb: 0.5 },
              }}
            />
          )}
        />
        <TextField
          fullWidth
          size="small"
          label={t('focus', currentLanguage)}
          type="number"
          value={focus}
          InputProps={{ readOnly: readOnly }}
          onChange={(e) => {
            if (readOnly) return;
            const v = e.target.value;
            if (v === '') setFocus('');
            else {
              const n = parseInt(v, 10);
              if (!isNaN(n) && n >= 1 && n <= 10) setFocus(v);
            }
          }}
          onBlur={(e) => {
            if (readOnly) return;
            const v = (e.target as HTMLInputElement).value;
            if (v !== '') {
              const n = parseInt(v, 10);
              if (isNaN(n) || n < 1) setFocus('');
              else if (n > 10) setFocus('10');
            }
          }}
          inputProps={{ min: 1, max: 10, step: 1 }}
          sx={{ '& .MuiInputBase-input': { color: (theme) => theme.palette.text.primary } }}
        />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {templatesLoading ? (
            <Typography variant="body2" sx={{ color: (theme) => theme.palette.text.secondary }}>
              {t('feature_templates_loading', currentLanguage)}
            </Typography>
          ) : null}
          <FormControl fullWidth size="small">
            <InputLabel>{t('feature_template_select', currentLanguage)}</InputLabel>
            <Select
              value={featureTemplateId}
              label={t('feature_template_select', currentLanguage)}
              onChange={(e) => setFeatureTemplateId(e.target.value)}
              sx={{ '& .MuiSelect-select': { color: (theme) => theme.palette.text.primary } }}
            >
              <MenuItem value="">
                <em>—</em>
              </MenuItem>
              {templates.map((tpl) => (
                <MenuItem key={tpl.id} value={tpl.id}>
                  {tpl.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {featureTemplateId && selectedDefs.length > 0 && (
            <Box
              sx={(theme) => ({
                px: 1.5,
                py: 2,
                borderRadius: 1,
                border: `1px solid ${theme.palette.divider}`,
                backgroundColor:
                  theme.palette.mode === 'dark'
                    ? 'rgba(255,255,255,0.04)'
                    : 'rgba(0,0,0,0.02)',
              })}
            >
              <Typography variant="body2" sx={{ mb: 1.5, fontWeight: 600, color: (theme) => theme.palette.text.primary }}>
                {t('feature_template_fields', currentLanguage)}
              </Typography>
              <FeatureTemplateFieldsEditor
                fields={selectedDefs}
                values={featureFieldValues}
                onChange={setFeatureFieldValue}
                currentLanguage={currentLanguage}
                disabled={false}
              />
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default CreateQuestionLeftModal;
