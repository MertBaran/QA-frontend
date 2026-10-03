import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Switch,
  TextField,
  Typography,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Add, Close, Delete, Edit } from '@mui/icons-material';
import { useAppSelector } from '../../store/hooks';
import { t } from '../../utils/translations';
import { getNegativeActionColor } from '../../utils/themeNegativeColor';
import { questionFeatureTemplateService } from '../../services/questionFeatureTemplateService';
import type {
  FeatureFieldInputPayload,
  FeatureFieldType,
  QuestionFeatureTemplate,
} from '../../types/questionFeatureTemplate';
import { parseFeatureFieldDefs, parseFeatureTemplateDateInput } from '../../utils/featureTemplateUtils';
import FeatureTemplateDateInput from './FeatureTemplateDateInput';
import { showErrorToast, showSuccessToast } from '../../utils/notificationUtils';
import TemplateFieldDetailDialog from './TemplateFieldDetailDialog';
import {
  MAX_FIELDS_PER_TEMPLATE,
  MAX_FIELD_TITLE_LENGTH,
  MAX_LIST_OPTION_LENGTH,
  MAX_LIST_OPTIONS,
  MAX_TABLE_COLUMNS,
  MAX_TABLE_ROWS,
  MAX_TEMPLATE_DESCRIPTION_LENGTH,
  MAX_TEMPLATE_NAME_LENGTH,
  MAX_TEMPLATES_PER_USER,
} from '../../constants/questionFeatureTemplateLimits';

const FIELD_TYPES: FeatureFieldType[] = ['text', 'number', 'date', 'list', 'table'];

const FIELD_TYPE_I18N: Record<FeatureFieldType, string> = {
  text: 'feature_templates_type_text',
  number: 'feature_templates_type_number',
  date: 'feature_templates_type_date',
  list: 'feature_templates_type_list',
  table: 'feature_templates_type_table',
};

function fieldTypeLabel(type: FeatureFieldType, language: string): string {
  return t(FIELD_TYPE_I18N[type], language);
}

function emptyFieldRow(): FeatureFieldInputPayload {
  return { title: '', type: 'text', required: false, listAllowMultiple: false };
}

function normalizeListOptions(raw: string[] | undefined): string[] {
  return (raw ?? []).map((s) => s.trim()).filter(Boolean);
}

function DefaultClearIcon({
  currentLanguage,
  disabled,
  onClear,
}: {
  currentLanguage: string;
  disabled: boolean;
  onClear: () => void;
}) {
  return (
    <IconButton
      size="small"
      onClick={onClear}
      disabled={disabled}
      aria-label={t('feature_templates_clear_default', currentLanguage)}
      sx={{ flexShrink: 0 }}
    >
      <Close fontSize="small" />
    </IconButton>
  );
}

function TemplateScalarDefaultEditor({
  f,
  idx,
  setFields,
  currentLanguage,
}: {
  f: FeatureFieldInputPayload;
  idx: number;
  setFields: React.Dispatch<React.SetStateAction<FeatureFieldInputPayload[]>>;
  currentLanguage: string;
}) {
  const setDefaultValue = (v: FeatureFieldInputPayload['defaultValue'] | undefined) => {
    setFields((prev) => {
      const next = [...prev];
      const row = { ...next[idx] };
      if (v === undefined || v === null || v === '') {
        delete row.defaultValue;
      } else {
        row.defaultValue = v as FeatureFieldInputPayload['defaultValue'];
      }
      next[idx] = row;
      return next;
    });
  };

  const lbl = t('feature_templates_default_value', currentLanguage);

  if (f.type === 'number') {
    const n = typeof f.defaultValue === 'number' ? f.defaultValue : '';
    const has = typeof f.defaultValue === 'number' && !Number.isNaN(f.defaultValue);
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, pl: 0.5 }}>
        <TextField
          size="small"
          type="number"
          label={lbl}
          value={n === '' ? '' : n}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === '') setDefaultValue(undefined);
            else setDefaultValue(Number(raw));
          }}
          sx={{ flex: 1, minWidth: 0 }}
        />
        <DefaultClearIcon
          currentLanguage={currentLanguage}
          disabled={!has}
          onClear={() => setDefaultValue(undefined)}
        />
      </Box>
    );
  }
  if (f.type === 'text') {
    const has = typeof f.defaultValue === 'string' && f.defaultValue.length > 0;
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, pl: 0.5 }}>
        <TextField
          size="small"
          label={lbl}
          value={typeof f.defaultValue === 'string' ? f.defaultValue : ''}
          onChange={(e) => setDefaultValue(e.target.value || undefined)}
          sx={{ flex: 1, minWidth: 0 }}
        />
        <DefaultClearIcon
          currentLanguage={currentLanguage}
          disabled={!has}
          onClear={() => setDefaultValue(undefined)}
        />
      </Box>
    );
  }
  if (f.type === 'date') {
    const has = typeof f.defaultValue === 'string' && f.defaultValue.trim().length > 0;
    return (
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, pl: 0.5 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <FeatureTemplateDateInput
            label={lbl}
            value={typeof f.defaultValue === 'string' ? f.defaultValue : ''}
            onChange={(s) => setDefaultValue(s || undefined)}
            currentLanguage={currentLanguage}
            hideClearButton
          />
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
            {t('feature_templates_default_date_hint', currentLanguage)}
          </Typography>
        </Box>
        <Box sx={{ pt: 0.5 }}>
          <DefaultClearIcon
            currentLanguage={currentLanguage}
            disabled={!has}
            onClear={() => setDefaultValue(undefined)}
          />
        </Box>
      </Box>
    );
  }
  if (f.type === 'list') {
    const optsNorm = normalizeListOptions(f.options);
    if (!optsNorm.length) {
      return (
        <Typography variant="body2" color="text.secondary" sx={{ pl: 0.5 }}>
          {t('feature_templates_default_need_options', currentLanguage)}
        </Typography>
      );
    }
    if (f.listAllowMultiple) {
      const arr = Array.isArray(f.defaultValue) ? (f.defaultValue as string[]).map(String) : [];
      const has = arr.length > 0;
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, pl: 0.5 }}>
          <FormControl fullWidth size="small" sx={{ flex: 1, minWidth: 0 }}>
            <InputLabel>{lbl}</InputLabel>
            <Select
              multiple
              label={lbl}
              value={arr}
              onChange={(e) => {
                const val = e.target.value;
                setDefaultValue(typeof val === 'string' ? val.split(',') : [...(val as string[])]);
              }}
              renderValue={(selected) => (selected as string[]).join(', ')}
            >
              {optsNorm.map((o) => (
                <MenuItem key={o} value={o}>
                  {o}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <DefaultClearIcon
            currentLanguage={currentLanguage}
            disabled={!has}
            onClear={() => setDefaultValue(undefined)}
          />
        </Box>
      );
    }
    const has = typeof f.defaultValue === 'string' && f.defaultValue.length > 0;
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, pl: 0.5 }}>
        <FormControl fullWidth size="small" sx={{ flex: 1, minWidth: 0 }}>
          <InputLabel>{lbl}</InputLabel>
          <Select
            label={lbl}
            value={typeof f.defaultValue === 'string' ? f.defaultValue : ''}
            onChange={(e) => setDefaultValue(e.target.value || undefined)}
          >
            <MenuItem value="">
              <em>—</em>
            </MenuItem>
            {optsNorm.map((o) => (
              <MenuItem key={o} value={o}>
                {o}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <DefaultClearIcon
          currentLanguage={currentLanguage}
          disabled={!has}
          onClear={() => setDefaultValue(undefined)}
        />
      </Box>
    );
  }
  return null;
}

export interface QuestionFeatureTemplatesPanelProps {
  /** Ayarlar modalı gibi dar alanda başlığı sadeleştirir */
  embedded?: boolean;
}

const QuestionFeatureTemplatesPanel: React.FC<QuestionFeatureTemplatesPanelProps> = ({ embedded = false }) => {
  const theme = useTheme();
  const { currentLanguage } = useAppSelector((s) => s.language);
  const { name: themeName } = useAppSelector((s) => s.theme);
  const deleteIconColor = getNegativeActionColor(themeName, theme.palette.mode);
  const deleteIconButtonSx = {
    color: deleteIconColor,
    '&:hover': {
      backgroundColor: theme.palette.mode === 'dark' ? `${deleteIconColor}22` : `${deleteIconColor}11`,
    },
    '&.Mui-disabled': {
      color: deleteIconColor,
      opacity: 0.38,
    },
  } as const;
  const [list, setList] = useState<QuestionFeatureTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState<FeatureFieldInputPayload[]>([emptyFieldRow()]);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [fieldDetailIdx, setFieldDetailIdx] = useState<number | null>(null);

  const limitsCaption = useMemo(() => {
    const template = t('feature_templates_dialog_limits', currentLanguage);
    return template.replace('{fields}', String(MAX_FIELDS_PER_TEMPLATE));
  }, [currentLanguage]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await questionFeatureTemplateService.list();
      setList(data);
    } catch {
      showErrorToast(t('feature_templates_error', currentLanguage));
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [currentLanguage]);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setFields([emptyFieldRow()]);
    setDialogOpen(true);
  };

  const openEdit = async (id: string) => {
    const tpl = await questionFeatureTemplateService.getById(id);
    if (!tpl) {
      showErrorToast(t('feature_templates_error', currentLanguage));
      return;
    }
    setEditingId(id);
    setName(tpl.name);
    setDescription(tpl.description ?? '');
    const defs = parseFeatureFieldDefs(tpl.currentVersion?.fields);
    if (defs.length === 0) {
      setFields([emptyFieldRow()]);
    } else {
      setFields(
        defs.map((d) => ({
          fieldId: d.fieldId,
          title: d.title,
          type: d.type,
          required: d.required,
          ...(d.listAllowMultiple ? { listAllowMultiple: true } : {}),
          ...(d.options?.length ? { options: d.options } : {}),
          ...(d.type === 'table' && d.columns?.length
            ? {
                columns: d.columns.map((c) => ({
                  columnId: c.columnId,
                  title: c.title,
                  type: c.type,
                  ...(c.listAllowMultiple ? { listAllowMultiple: true } : {}),
                  ...(c.options?.length ? { options: [...c.options] } : {}),
                })),
              }
            : {}),
          ...(d.defaultValue !== undefined ? { defaultValue: d.defaultValue } : {}),
        })),
      );
    }
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (saving) return;
    setDialogOpen(false);
  };

  const validateFields = (): boolean => {
    const nonEmpty = fields.filter((f) => f.title.trim());
    if (nonEmpty.length === 0) {
      showErrorToast(t('feature_templates_no_fields', currentLanguage));
      return false;
    }
    if (nonEmpty.length > MAX_FIELDS_PER_TEMPLATE) {
      showErrorToast(t('feature_templates_max_fields', currentLanguage));
      return false;
    }
    const titles = nonEmpty.map((f) => f.title.trim().toLowerCase());
    if (new Set(titles).size !== titles.length) {
      showErrorToast(t('feature_templates_duplicate_field_title', currentLanguage));
      return false;
    }
    for (const f of nonEmpty) {
      if (f.type === 'table') {
        const cols = f.columns ?? [];
        if (cols.length < 1 || cols.length > MAX_TABLE_COLUMNS) {
          showErrorToast(t('feature_templates_table_columns_invalid', currentLanguage));
          return false;
        }
        const ctitles = cols.map((c) => c.title.trim().toLowerCase());
        if (ctitles.some((x) => !x) || new Set(ctitles).size !== ctitles.length) {
          showErrorToast(t('feature_templates_table_column_titles', currentLanguage));
          return false;
        }
        for (const c of cols) {
          if (c.type !== 'list') continue;
          const opts = normalizeListOptions(c.options);
          if (opts.length < 1) {
            showErrorToast(t('feature_templates_list_options', currentLanguage));
            return false;
          }
          if (opts.length > MAX_LIST_OPTIONS) {
            showErrorToast(t('feature_templates_list_too_many_options', currentLanguage));
            return false;
          }
          for (const o of opts) {
            if (o.length > MAX_LIST_OPTION_LENGTH) {
              showErrorToast(t('feature_templates_list_option_too_long', currentLanguage));
              return false;
            }
          }
          const lowered = opts.map((o) => o.toLowerCase());
          if (new Set(lowered).size !== lowered.length) {
            showErrorToast(t('feature_templates_duplicate_list_option', currentLanguage));
            return false;
          }
        }
        const defRows = Array.isArray(f.defaultValue) ? f.defaultValue : [];
        if (defRows.length > MAX_TABLE_ROWS) {
          showErrorToast(t('feature_templates_table_too_many_default_rows', currentLanguage));
          return false;
        }
        continue;
      }
      if (f.type === 'list') {
        const opts = normalizeListOptions(f.options);
        if (opts.length < 1) {
          showErrorToast(t('feature_templates_list_options', currentLanguage));
          return false;
        }
        if (opts.length > MAX_LIST_OPTIONS) {
          showErrorToast(t('feature_templates_list_too_many_options', currentLanguage));
          return false;
        }
        for (const o of opts) {
          if (o.length > MAX_LIST_OPTION_LENGTH) {
            showErrorToast(t('feature_templates_list_option_too_long', currentLanguage));
            return false;
          }
        }
        const lowered = opts.map((o) => o.toLowerCase());
        if (new Set(lowered).size !== lowered.length) {
          showErrorToast(t('feature_templates_duplicate_list_option', currentLanguage));
          return false;
        }
      }
      if (f.type === 'date' && f.defaultValue != null && f.defaultValue !== '') {
        const s = String(f.defaultValue).trim();
        if (s && !parseFeatureTemplateDateInput(s)) {
          showErrorToast(t('feature_templates_invalid_date_default', currentLanguage));
          return false;
        }
      }
    }
    return true;
  };

  const handleSave = async () => {
    if (!name.trim() || !validateFields()) return;

    const nameLc = name.trim().toLowerCase();
    if (list.some((tpl) => tpl.id !== editingId && tpl.name.trim().toLowerCase() === nameLc)) {
      showErrorToast(t('feature_templates_duplicate_name', currentLanguage));
      return;
    }

    const normalized: FeatureFieldInputPayload[] = fields
      .filter((f) => f.title.trim())
      .map((f) => ({
        ...(f.fieldId ? { fieldId: f.fieldId } : {}),
        title: f.title.trim(),
        type: f.type,
        required: f.required ?? false,
        ...(f.type === 'table'
          ? {
              columns: (f.columns ?? []).map((c) => ({
                ...(c.columnId ? { columnId: c.columnId } : {}),
                title: c.title.trim(),
                type: c.type,
                ...(c.type === 'list'
                  ? {
                      options: normalizeListOptions(c.options),
                      ...(c.listAllowMultiple ? { listAllowMultiple: true } : {}),
                    }
                  : {}),
              })),
              ...(f.defaultValue !== undefined ? { defaultValue: f.defaultValue } : {}),
            }
          : f.type === 'list'
            ? {
                options: normalizeListOptions(f.options),
                ...(f.listAllowMultiple ? { listAllowMultiple: true } : {}),
                ...(f.defaultValue !== undefined ? { defaultValue: f.defaultValue } : {}),
              }
            : f.defaultValue !== undefined
              ? { defaultValue: f.defaultValue }
              : {}),
      }));

    setSaving(true);
    try {
      if (editingId) {
        await questionFeatureTemplateService.update(editingId, {
          name: name.trim(),
          description: description.trim() || null,
          fields: normalized,
        });
      } else {
        await questionFeatureTemplateService.create({
          name: name.trim(),
          description: description.trim() || undefined,
          fields: normalized,
        });
      }
      showSuccessToast(t('feature_templates_saved', currentLanguage));
      setDialogOpen(false);
      await load();
    } catch {
      showErrorToast(t('feature_templates_error', currentLanguage));
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      await questionFeatureTemplateService.remove(deleteId);
      showSuccessToast(t('feature_templates_deleted', currentLanguage));
      setDeleteId(null);
      await load();
    } catch {
      showErrorToast(t('feature_templates_error', currentLanguage));
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: embedded ? 320 : undefined }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: embedded ? 2 : 3,
          gap: 2,
          flexWrap: 'wrap',
        }}
      >
        {!embedded && (
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {t('feature_templates_page_title', currentLanguage)}
          </Typography>
        )}
        {embedded && (
          <Typography variant="body2" color="text.secondary" sx={{ flex: 1, minWidth: 200 }}>
            {t('feature_templates_empty_hint', currentLanguage)}
          </Typography>
        )}
        <Button variant="contained" startIcon={<Add />} onClick={openCreate} size={embedded ? 'small' : 'medium'}>
          {t('feature_templates_new', currentLanguage)}
        </Button>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: embedded ? 2 : 3 }}>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.4 }}>
          {t('feature_templates_max_templates_create_hint', currentLanguage).replace(
            '{max}',
            String(MAX_TEMPLATES_PER_USER),
          )}
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : list.length === 0 ? (
        <Typography color="text.secondary">{t('feature_templates_empty', currentLanguage)}</Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {list.map((tpl) => (
            <Card key={tpl.id} variant="outlined">
              <CardContent
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 2,
                  '&:last-child': { pb: 2 },
                }}
              >
                <Box>
                  <Typography variant="h6">{tpl.name}</Typography>
                  {tpl.description ? (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {tpl.description}
                    </Typography>
                  ) : null}
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    v{tpl.currentVersion?.version ?? '?'} · {parseFeatureFieldDefs(tpl.currentVersion?.fields).length}{' '}
                    {t('feature_templates_fields', currentLanguage).toLowerCase()}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <IconButton
                    aria-label="edit"
                    onClick={() => void openEdit(tpl.id)}
                    color="primary"
                    size={embedded ? 'small' : 'medium'}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    aria-label="delete"
                    onClick={() => setDeleteId(tpl.id)}
                    size={embedded ? 'small' : 'medium'}
                    sx={deleteIconButtonSx}
                  >
                    <Delete />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingId ? t('feature_templates_edit', currentLanguage) : t('feature_templates_new', currentLanguage)}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label={t('feature_templates_name', currentLanguage)}
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            required
            margin="dense"
            inputProps={{ maxLength: MAX_TEMPLATE_NAME_LENGTH }}
          />
          <TextField
            label={t('feature_templates_description', currentLanguage)}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            minRows={2}
            margin="dense"
            inputProps={{ maxLength: MAX_TEMPLATE_DESCRIPTION_LENGTH }}
          />
          <Box>
            <Typography variant="subtitle2">{t('feature_templates_fields', currentLanguage)}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, lineHeight: 1.4 }}>
              {limitsCaption}
            </Typography>
          </Box>
          {fields.map((f, idx) => (
            <Box
              key={idx}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                p: 1.5,
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
              }}
            >
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                <TextField
                  size="small"
                  label={t('feature_templates_field_title', currentLanguage)}
                  value={f.title}
                  onChange={(e) => {
                    const next = [...fields];
                    next[idx] = { ...f, title: e.target.value };
                    setFields(next);
                  }}
                  sx={{ flex: 1, minWidth: 140 }}
                  inputProps={{ maxLength: MAX_FIELD_TITLE_LENGTH }}
                />
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>{t('feature_templates_field_type', currentLanguage)}</InputLabel>
                  <Select
                    label={t('feature_templates_field_type', currentLanguage)}
                    value={f.type}
                    onChange={(e) => {
                      const next = [...fields];
                      const typ = e.target.value as FeatureFieldType;
                      if (typ === 'table') {
                        next[idx] = {
                          ...f,
                          type: 'table',
                          options: undefined,
                          listAllowMultiple: false,
                          columns: [
                            { title: '', type: 'text', listAllowMultiple: false, options: [''] },
                          ],
                          defaultValue: undefined,
                        };
                      } else if (typ === 'list') {
                        next[idx] = {
                          ...f,
                          type: 'list',
                          columns: undefined,
                          options: f.options?.length ? f.options : [''],
                          listAllowMultiple: false,
                        };
                      } else {
                        next[idx] = {
                          ...f,
                          type: typ,
                          columns: undefined,
                          options: undefined,
                          listAllowMultiple: false,
                          defaultValue: undefined,
                        };
                      }
                      setFields(next);
                    }}
                  >
                    {FIELD_TYPES.map((x) => (
                      <MenuItem key={x} value={x}>
                        {fieldTypeLabel(x, currentLanguage)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControlLabel
                  control={
                    <Switch
                      checked={f.required ?? false}
                      onChange={(e) => {
                        const next = [...fields];
                        next[idx] = { ...f, required: e.target.checked };
                        setFields(next);
                      }}
                    />
                  }
                  label={t('feature_templates_field_required', currentLanguage)}
                />
                {f.type === 'table' ? (
                  <Button size="small" variant="outlined" onClick={() => setFieldDetailIdx(idx)}>
                    {t('feature_templates_table_open_detail', currentLanguage)}
                  </Button>
                ) : null}
                <IconButton
                  size="small"
                  onClick={() => setFields(fields.filter((_, i) => i !== idx))}
                  disabled={fields.length <= 1}
                  sx={deleteIconButtonSx}
                >
                  <Delete fontSize="small" />
                </IconButton>
              </Box>
              {f.type === 'table' && (
                <Typography variant="caption" color="text.secondary">
                  {t('feature_templates_table_compact_hint', currentLanguage)} · {f.columns?.length ?? 0}{' '}
                  {t('feature_templates_table_columns_word', currentLanguage)}
                </Typography>
              )}
              {f.type === 'list' && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, pl: 0.5 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={f.listAllowMultiple ?? false}
                        onChange={(e) => {
                          const next = [...fields];
                          next[idx] = { ...f, listAllowMultiple: e.target.checked };
                          setFields(next);
                        }}
                      />
                    }
                    label={t('feature_templates_list_multi', currentLanguage)}
                  />
                  {(f.options ?? ['']).map((opt, optIdx) => (
                    <Box key={optIdx} sx={{ display: 'flex', gap: 0.5, alignItems: 'flex-start' }}>
                      <TextField
                        size="small"
                        fullWidth
                        label={`${t('feature_templates_option_row', currentLanguage)} ${optIdx + 1}`}
                        value={opt}
                        inputProps={{ maxLength: MAX_LIST_OPTION_LENGTH }}
                        onChange={(e) => {
                          const next = [...fields];
                          const opts = [...(next[idx].options ?? [''])];
                          opts[optIdx] = e.target.value;
                          next[idx] = { ...f, options: opts };
                          setFields(next);
                        }}
                      />
                      <IconButton
                        size="small"
                        aria-label="remove option"
                        disabled={(f.options ?? ['']).length <= 1}
                        onClick={() => {
                          const next = [...fields];
                          const opts = (next[idx].options ?? ['']).filter((_, i) => i !== optIdx);
                          next[idx] = { ...f, options: opts.length ? opts : [''] };
                          setFields(next);
                        }}
                        sx={deleteIconButtonSx}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Add />}
                    disabled={(f.options ?? []).length >= MAX_LIST_OPTIONS}
                    onClick={() => {
                      const next = [...fields];
                      next[idx] = { ...f, options: [...(f.options ?? []), ''] };
                      setFields(next);
                    }}
                    sx={{ alignSelf: 'flex-start' }}
                  >
                    {t('feature_templates_option_add', currentLanguage)}
                  </Button>
                </Box>
              )}
              {f.type !== 'table' ? (
                <TemplateScalarDefaultEditor f={f} idx={idx} setFields={setFields} currentLanguage={currentLanguage} />
              ) : null}
            </Box>
          ))}
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={() => setFields([...fields, emptyFieldRow()])}
            disabled={fields.length >= MAX_FIELDS_PER_TEMPLATE}
            sx={{ alignSelf: 'flex-start' }}
          >
            {t('feature_templates_add_field', currentLanguage)}
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog} disabled={saving}>
            {t('cancel', currentLanguage)}
          </Button>
          <Button onClick={() => void handleSave()} variant="contained" disabled={saving}>
            {saving ? <CircularProgress size={22} /> : t('feature_templates_save', currentLanguage)}
          </Button>
        </DialogActions>
      </Dialog>

      {fieldDetailIdx !== null && fields[fieldDetailIdx]?.type === 'table' ? (
        <TemplateFieldDetailDialog
          open
          field={fields[fieldDetailIdx]}
          onClose={() => setFieldDetailIdx(null)}
          onApply={(next) => {
            setFields((prev) => {
              const copy = [...prev];
              if (fieldDetailIdx !== null) copy[fieldDetailIdx] = next;
              return copy;
            });
          }}
          currentLanguage={currentLanguage}
        />
      ) : null}

      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogTitle>{t('feature_templates_delete', currentLanguage)}</DialogTitle>
        <DialogContent>
          <Typography>{t('feature_templates_confirm_delete', currentLanguage)}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>{t('cancel', currentLanguage)}</Button>
          <Button color="error" variant="contained" onClick={() => void handleConfirmDelete()}>
            {t('feature_templates_delete', currentLanguage)}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QuestionFeatureTemplatesPanel;
