import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { t } from '../../utils/translations';
import { showErrorToast } from '../../utils/notificationUtils';
import FeatureTemplateDateInput from './FeatureTemplateDateInput';
import { parseFeatureTemplateDateInput } from '../../utils/featureTemplateUtils';
import { useAppSelector } from '../../store/hooks';
import { getNegativeActionColor } from '../../utils/themeNegativeColor';
import type {
  FeatureFieldInputPayload,
  TableColumnInputPayload,
  TableColumnType,
  FeatureTableRow,
} from '../../types/questionFeatureTemplate';
import {
  MAX_FIELD_TITLE_LENGTH,
  MAX_LIST_OPTION_LENGTH,
  MAX_LIST_OPTIONS,
  MAX_TABLE_COLUMNS,
  MAX_TABLE_ROWS,
  MAX_TABLE_TEXT_CELL_LENGTH,
} from '../../constants/questionFeatureTemplateLimits';

const tableGridSx = {
  tableLayout: 'fixed' as const,
  width: '100%',
  borderCollapse: 'collapse' as const,
  borderRadius: 0,
};

const tableCellSx = {
  border: 1,
  borderColor: 'divider',
  verticalAlign: 'top' as const,
  py: 1,
  px: 1,
  whiteSpace: 'normal' as const,
  wordBreak: 'break-word' as const,
  overflowWrap: 'break-word' as const,
};

const tableHeadCellSx = {
  ...tableCellSx,
  fontWeight: 600,
  bgcolor: 'action.hover',
};

const tableFieldInputSx = {
  '& .MuiOutlinedInput-root': { borderRadius: 0 },
  '& .MuiInputBase-input': {
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
};

const tableSelectValueSx = {
  '& .MuiSelect-select': {
    whiteSpace: 'normal',
    lineHeight: 1.35,
    minHeight: '1.5em',
    display: 'flex',
    alignItems: 'center',
  },
};

const COL_TYPES: TableColumnType[] = ['text', 'number', 'date', 'list'];

const COL_TYPE_I18N: Record<TableColumnType, string> = {
  text: 'feature_templates_type_text',
  number: 'feature_templates_type_number',
  date: 'feature_templates_type_date',
  list: 'feature_templates_type_list',
};

function colLabel(ty: TableColumnType, lang: string): string {
  return t(COL_TYPE_I18N[ty], lang);
}

function emptyColumn(): TableColumnInputPayload {
  return { title: '', type: 'text', listAllowMultiple: false, options: [''] };
}

function normalizeListOptions(raw: string[] | undefined): string[] {
  return (raw ?? []).map((s) => s.trim()).filter(Boolean);
}

function finalizeTableFieldDraft(d: FeatureFieldInputPayload): FeatureFieldInputPayload {
  if (d.type !== 'table' || !d.columns?.length) return d;
  const cols = d.columns.map((c) => ({
    ...c,
    columnId: c.columnId || crypto.randomUUID(),
  }));
  const oldKeys = d.columns.map((c, i) => c.columnId ?? `__tmp_${i}`);
  const newKeys = cols.map((c) => c.columnId!);
  const rows = Array.isArray(d.defaultValue) ? [...(d.defaultValue as FeatureTableRow[])] : [];
  const remapped = rows.map((row) => {
    const o: FeatureTableRow = {};
    oldKeys.forEach((ok, i) => {
      const nk = newKeys[i];
      if (ok in row) o[nk] = row[ok];
    });
    return o;
  });
  return {
    ...d,
    columns: cols,
    ...(remapped.length ? { defaultValue: remapped } : { defaultValue: undefined }),
  };
}

function getColumnDraftKey(c: TableColumnInputPayload, i: number): string {
  return c.columnId ?? `__tmp_${i}`;
}

function validateDetailBeforeApply(d: FeatureFieldInputPayload, lang: string): string | null {
  const cols = d.columns ?? [];
  const nonEmptyTitles = cols.map((c) => c.title.trim()).filter(Boolean);
  if (nonEmptyTitles.length < 1) {
    return t('feature_templates_table_need_column_dialog', lang);
  }
  const titleKeys = nonEmptyTitles.map((x) => x.toLowerCase());
  if (new Set(titleKeys).size !== titleKeys.length) {
    return t('feature_templates_duplicate_column_title_dialog', lang);
  }
  for (const c of cols) {
    if (c.type !== 'list') continue;
    const opts = normalizeListOptions(c.options);
    if (opts.length < 1) {
      return t('feature_templates_list_options', lang);
    }
    const optKeys = opts.map((o) => o.toLowerCase());
    if (new Set(optKeys).size !== optKeys.length) {
      return t('feature_templates_duplicate_column_list_option_dialog', lang);
    }
  }
  const rows = Array.isArray(d.defaultValue) ? (d.defaultValue as FeatureTableRow[]) : [];
  for (let ri = 0; ri < rows.length; ri++) {
    const row = rows[ri];
    for (let ci = 0; ci < cols.length; ci++) {
      const col = cols[ci];
      if (col.type !== 'date') continue;
      const id = getColumnDraftKey(col, ci);
      const raw = row[id];
      if (raw == null || raw === '') continue;
      const s = String(raw).trim();
      if (s && !parseFeatureTemplateDateInput(s)) {
        return t('feature_templates_invalid_date_cell', lang);
      }
    }
  }
  return null;
}

function deepCloneField(f: FeatureFieldInputPayload): FeatureFieldInputPayload {
  const base: FeatureFieldInputPayload = { ...f };
  if (f.columns) {
    base.columns = f.columns.map((c) => ({
      ...c,
      ...(c.options ? { options: [...c.options] } : {}),
    }));
  }
  if (
    f.type === 'table' &&
    Array.isArray(f.defaultValue) &&
    f.defaultValue.length > 0 &&
    typeof f.defaultValue[0] === 'object' &&
    f.defaultValue[0] !== null
  ) {
    base.defaultValue = (f.defaultValue as FeatureTableRow[]).map((row) => ({ ...row }));
  } else if (Array.isArray(f.defaultValue)) {
    base.defaultValue = [...f.defaultValue] as FeatureFieldInputPayload['defaultValue'];
  } else if (f.defaultValue !== undefined) {
    base.defaultValue = f.defaultValue;
  }
  return base;
}

export interface TemplateFieldDetailDialogProps {
  open: boolean;
  field: FeatureFieldInputPayload;
  onClose: () => void;
  onApply: (next: FeatureFieldInputPayload) => void;
  currentLanguage: string;
}

const TemplateFieldDetailDialog: React.FC<TemplateFieldDetailDialogProps> = ({
  open,
  field,
  onClose,
  onApply,
  currentLanguage,
}) => {
  const [draft, setDraft] = useState<FeatureFieldInputPayload>(() => deepCloneField(field));

  useEffect(() => {
    if (open) setDraft(deepCloneField(field));
  }, [open, field]);

  const theme = useTheme();
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

  if (!open) return null;

  if (field.type !== 'table') return null;

  const columnsNorm = draft.columns?.length
    ? draft.columns.map((c) => ({
        ...c,
        title: c.title.trim(),
        options: normalizeListOptions(c.options),
      }))
    : [];

  const tableDefaults: FeatureTableRow[] =
    Array.isArray(draft.defaultValue) &&
    draft.defaultValue.length > 0 &&
    typeof draft.defaultValue[0] === 'object'
      ? (draft.defaultValue as FeatureTableRow[]).map((r) => ({ ...r }))
      : [];

  const ensureTableDefaultsShape = (rows: FeatureTableRow[]): FeatureTableRow[] => {
    return rows.map((row) => {
      const o: FeatureTableRow = { ...row };
      columnsNorm.forEach((c, i) => {
        const id = getColumnDraftKey(c, i);
        if (!(id in o)) {
          o[id] = c.type === 'list' && c.listAllowMultiple ? [] : '';
        }
      });
      return o;
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{t('feature_templates_table_detail_title', currentLanguage)}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
        <Typography variant="subtitle2">{t('feature_templates_table_columns', currentLanguage)}</Typography>
            {(draft.columns ?? []).map((c, idx) => (
              <Box
                key={idx}
                sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center', p: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}
              >
                <TextField
                  size="small"
                  label={t('feature_templates_column_title', currentLanguage)}
                  value={c.title}
                  onChange={(e) => {
                    const next = [...(draft.columns ?? [])];
                    next[idx] = { ...c, title: e.target.value };
                    setDraft({ ...draft, columns: next });
                  }}
                  sx={{ flex: 1, minWidth: 120 }}
                  inputProps={{ maxLength: MAX_FIELD_TITLE_LENGTH }}
                />
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>{t('feature_templates_field_type', currentLanguage)}</InputLabel>
                  <Select
                    label={t('feature_templates_field_type', currentLanguage)}
                    value={c.type}
                    onChange={(e) => {
                      const next = [...(draft.columns ?? [])];
                      const typ = e.target.value as TableColumnType;
                      next[idx] = {
                        ...c,
                        type: typ,
                        ...(typ !== 'list' ? { options: undefined, listAllowMultiple: false } : { options: c.options?.length ? c.options : [''] }),
                      };
                      setDraft({ ...draft, columns: next });
                    }}
                  >
                    {COL_TYPES.map((x) => (
                      <MenuItem key={x} value={x}>
                        {colLabel(x, currentLanguage)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {c.type === 'list' && (
                  <>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={c.listAllowMultiple ?? false}
                          onChange={(e) => {
                            const next = [...(draft.columns ?? [])];
                            next[idx] = { ...c, listAllowMultiple: e.target.checked };
                            setDraft({ ...draft, columns: next });
                          }}
                        />
                      }
                      label={t('feature_templates_list_multi', currentLanguage)}
                    />
                    {(c.options ?? ['']).map((opt, oi) => (
                      <Box key={oi} sx={{ display: 'flex', gap: 0.5, width: '100%' }}>
                        <TextField
                          size="small"
                          fullWidth
                          label={`${t('feature_templates_option_row', currentLanguage)} ${oi + 1}`}
                          value={opt}
                          inputProps={{ maxLength: MAX_LIST_OPTION_LENGTH }}
                          onChange={(e) => {
                            const next = [...(draft.columns ?? [])];
                            const opts = [...(next[idx].options ?? [''])];
                            opts[oi] = e.target.value;
                            next[idx] = { ...c, options: opts };
                            setDraft({ ...draft, columns: next });
                          }}
                        />
                        <IconButton
                          size="small"
                          disabled={(c.options ?? ['']).length <= 1}
                          onClick={() => {
                            const next = [...(draft.columns ?? [])];
                            const opts = (next[idx].options ?? ['']).filter((_, j) => j !== oi);
                            next[idx] = { ...c, options: opts.length ? opts : [''] };
                            setDraft({ ...draft, columns: next });
                          }}
                          sx={deleteIconButtonSx}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                    <Button
                      size="small"
                      startIcon={<Add />}
                      disabled={(c.options ?? []).length >= MAX_LIST_OPTIONS}
                      onClick={() => {
                        const next = [...(draft.columns ?? [])];
                        next[idx] = { ...c, options: [...(c.options ?? []), ''] };
                        setDraft({ ...draft, columns: next });
                      }}
                    >
                      {t('feature_templates_option_add', currentLanguage)}
                    </Button>
                  </>
                )}
                <IconButton
                  size="small"
                  disabled={(draft.columns ?? []).length <= 1}
                  onClick={() => {
                    const next = (draft.columns ?? []).filter((_, i) => i !== idx);
                    setDraft({ ...draft, columns: next });
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
              disabled={(draft.columns ?? []).length >= MAX_TABLE_COLUMNS}
              onClick={() => setDraft({ ...draft, columns: [...(draft.columns ?? []), emptyColumn()] })}
            >
              {t('feature_templates_add_column', currentLanguage)}
            </Button>

            <Typography variant="subtitle2" sx={{ mt: 1 }}>
              {t('feature_templates_default_rows', currentLanguage)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t('feature_templates_default_rows_hint', currentLanguage)}
            </Typography>
            <Table size="small" sx={tableGridSx}>
              <TableHead>
                <TableRow>
                  {columnsNorm.map((c, ci) => (
                    <TableCell key={getColumnDraftKey(c, ci)} sx={{ ...tableHeadCellSx, minWidth: 120 }}>
                      {c.title}
                    </TableCell>
                  ))}
                  <TableCell align="center" sx={{ ...tableHeadCellSx, width: 48, verticalAlign: 'middle' }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {ensureTableDefaultsShape(tableDefaults).map((row, ri) => (
                  <TableRow key={ri}>
                    {columnsNorm.map((c, ci) => {
                      const id = getColumnDraftKey(c, ci);
                      const v = row[id];
                      if (c.type === 'number') {
                        return (
                          <TableCell key={id} sx={tableCellSx}>
                            <TextField
                              size="small"
                              type="number"
                              label={c.title}
                              value={v === null || v === undefined ? '' : v}
                              onChange={(e) => {
                                const rows = [...ensureTableDefaultsShape(tableDefaults)];
                                const raw = e.target.value;
                                rows[ri] = { ...rows[ri], [id]: raw === '' ? null : Number(raw) };
                                setDraft({ ...draft, defaultValue: rows });
                              }}
                              fullWidth
                              sx={tableFieldInputSx}
                            />
                          </TableCell>
                        );
                      }
                      if (c.type === 'list' && c.listAllowMultiple) {
                        const arr = Array.isArray(v) ? v.map(String) : [];
                        return (
                          <TableCell key={id} sx={tableCellSx}>
                            <FormControl size="small" fullWidth sx={tableSelectValueSx}>
                              <InputLabel shrink>{c.title}</InputLabel>
                              <Select
                                multiple
                                label={c.title}
                                displayEmpty
                                notched
                                value={arr}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const rows = [...ensureTableDefaultsShape(tableDefaults)];
                                  rows[ri] = {
                                    ...rows[ri],
                                    [id]: typeof val === 'string' ? val.split(',') : [...(val as string[])],
                                  };
                                  setDraft({ ...draft, defaultValue: rows });
                                }}
                                renderValue={(s) => (s as string[]).join(', ') || '—'}
                              >
                                {(c.options ?? []).map((o) => (
                                  <MenuItem key={o} value={o}>
                                    {o}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </TableCell>
                        );
                      }
                      if (c.type === 'list') {
                        return (
                          <TableCell key={id} sx={tableCellSx}>
                            <FormControl size="small" fullWidth sx={tableSelectValueSx}>
                              <InputLabel shrink>{c.title}</InputLabel>
                              <Select
                                label={c.title}
                                displayEmpty
                                notched
                                value={typeof v === 'string' ? v : ''}
                                onChange={(e) => {
                                  const rows = [...ensureTableDefaultsShape(tableDefaults)];
                                  rows[ri] = { ...rows[ri], [id]: e.target.value };
                                  setDraft({ ...draft, defaultValue: rows });
                                }}
                              >
                                <MenuItem value="">
                                  <em>—</em>
                                </MenuItem>
                                {(c.options ?? []).map((o) => (
                                  <MenuItem key={o} value={o}>
                                    {o}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </TableCell>
                        );
                      }
                      if (c.type === 'date') {
                        return (
                          <TableCell key={id} sx={tableCellSx}>
                            <FeatureTemplateDateInput
                              label={c.title}
                              value={v === null || v === undefined ? '' : String(v)}
                              onChange={(s) => {
                                const rows = [...ensureTableDefaultsShape(tableDefaults)];
                                rows[ri] = { ...rows[ri], [id]: s || null };
                                setDraft({ ...draft, defaultValue: rows });
                              }}
                              currentLanguage={currentLanguage}
                            />
                          </TableCell>
                        );
                      }
                      return (
                        <TableCell key={id} sx={tableCellSx}>
                          <TextField
                            size="small"
                            label={c.title}
                            value={v === null || v === undefined ? '' : String(v)}
                            onChange={(e) => {
                              const rows = [...ensureTableDefaultsShape(tableDefaults)];
                              const s = e.target.value.slice(0, MAX_TABLE_TEXT_CELL_LENGTH);
                              rows[ri] = { ...rows[ri], [id]: s };
                              setDraft({ ...draft, defaultValue: rows });
                            }}
                            fullWidth
                            multiline
                            minRows={1}
                            maxRows={12}
                            inputProps={{ maxLength: MAX_TABLE_TEXT_CELL_LENGTH }}
                            sx={tableFieldInputSx}
                          />
                        </TableCell>
                      );
                    })}
                    <TableCell align="center" sx={{ ...tableCellSx, verticalAlign: 'middle' }}>
                      <IconButton
                        size="small"
                        onClick={() => {
                          const rows = ensureTableDefaultsShape(tableDefaults).filter((_, i) => i !== ri);
                          setDraft({
                            ...draft,
                            defaultValue: rows.length ? rows : undefined,
                          });
                        }}
                        sx={deleteIconButtonSx}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Button
              size="small"
              variant="outlined"
              startIcon={<Add />}
              disabled={
                columnsNorm.length < 1 ||
                ensureTableDefaultsShape(tableDefaults).length >= MAX_TABLE_ROWS
              }
              onClick={() => {
                const newRow: FeatureTableRow = {};
                columnsNorm.forEach((c, i) => {
                  const id = getColumnDraftKey(c, i);
                  newRow[id] = c.type === 'list' && c.listAllowMultiple ? [] : '';
                });
                const rows = [...ensureTableDefaultsShape(tableDefaults), newRow];
                setDraft({ ...draft, defaultValue: rows });
              }}
            >
              {t('feature_templates_add_default_row', currentLanguage)}
            </Button>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('cancel', currentLanguage)}</Button>
        <Button
          variant="contained"
          onClick={() => {
            const err = validateDetailBeforeApply(draft, currentLanguage);
            if (err) {
              showErrorToast(err);
              return;
            }
            onApply(finalizeTableFieldDraft(draft));
            onClose();
          }}
        >
          {t('feature_templates_apply_detail', currentLanguage)}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TemplateFieldDetailDialog;
