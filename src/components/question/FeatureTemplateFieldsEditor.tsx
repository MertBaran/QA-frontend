import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  IconButton,
  InputAdornment,
  Popover,
  useTheme,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import { Clear, Event, Check, Add, Delete } from '@mui/icons-material';
import { t } from '../../utils/translations';
import type { QuestionFeatureFieldDef, TableColumnDef, FeatureTableRow } from '../../types/questionFeatureTemplate';
import type { FeatureFieldFormValue } from '../../utils/featureTemplateUtils';
import {
  formatFeatureFieldSummary,
  formatFeatureTemplateDate,
  parseFeatureTemplateDateInput,
  toDatetimeLocalValue,
  parseDatetimeLocalValue,
  emptyTableRow,
} from '../../utils/featureTemplateUtils';
import { MAX_TABLE_ROWS, MAX_TABLE_TEXT_CELL_LENGTH } from '../../constants/questionFeatureTemplateLimits';
import FeatureTemplateDateInput from './FeatureTemplateDateInput';
import { useAppSelector } from '../../store/hooks';
import { getNegativeActionColor } from '../../utils/themeNegativeColor';

export interface FeatureTemplateFieldsEditorProps {
  fields: QuestionFeatureFieldDef[];
  values: Record<string, FeatureFieldFormValue>;
  onChange: (fieldId: string, value: FeatureFieldFormValue) => void;
  currentLanguage: string;
  disabled?: boolean;
}

function getColumnKey(c: TableColumnDef, i: number): string {
  return c.columnId;
}

export const featureTemplateTableGridSx = {
  tableLayout: 'fixed' as const,
  width: '100%',
  borderCollapse: 'collapse' as const,
  borderRadius: 0,
};

export const featureTemplateTableCellSx = {
  border: 1,
  borderColor: 'divider',
  verticalAlign: 'top' as const,
  py: 1,
  px: 1,
  whiteSpace: 'normal' as const,
  wordBreak: 'break-word' as const,
  overflowWrap: 'break-word' as const,
};

export const featureTemplateTableHeadCellSx = {
  ...featureTemplateTableCellSx,
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

function TableRowsForm({
  columns,
  rows,
  onChange,
  disabled,
  currentLanguage,
}: {
  columns: TableColumnDef[];
  rows: FeatureTableRow[];
  onChange: (r: FeatureTableRow[]) => void;
  disabled: boolean;
  currentLanguage: string;
}) {
  const theme = useTheme();
  const { name: themeName } = useAppSelector((s) => s.theme);
  const deleteIconColor = getNegativeActionColor(themeName, theme.palette.mode);
  const deleteRowIconSx = {
    color: deleteIconColor,
    '&:hover': {
      backgroundColor: theme.palette.mode === 'dark' ? `${deleteIconColor}22` : `${deleteIconColor}11`,
    },
    '&.Mui-disabled': {
      color: deleteIconColor,
      opacity: 0.38,
    },
  } as const;

  const updateRow = (ri: number, colId: string, val: unknown) => {
    const next = rows.map((row, i) => (i === ri ? { ...row, [colId]: val as never } : { ...row }));
    onChange(next);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Table size="small" sx={featureTemplateTableGridSx}>
        <TableHead>
          <TableRow>
            {columns.map((c) => (
                  <TableCell key={c.columnId} sx={{ ...featureTemplateTableHeadCellSx, minWidth: 140 }}>
                {c.title}
              </TableCell>
            ))}
            <TableCell align="center" sx={{ ...featureTemplateTableHeadCellSx, width: 56, verticalAlign: 'middle' }} />
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, ri) => (
            <TableRow key={ri}>
              {columns.map((c, ci) => {
                const id = getColumnKey(c, ci);
                const v = row[id];
                if (c.type === 'number') {
                  return (
                    <TableCell key={id} sx={featureTemplateTableCellSx}>
                      <TextField
                        size="small"
                        type="number"
                        disabled={disabled}
                        value={v === null || v === undefined ? '' : v}
                        onChange={(e) => {
                          const raw = e.target.value;
                          updateRow(ri, id, raw === '' ? null : Number(raw));
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
                    <TableCell key={id} sx={featureTemplateTableCellSx}>
                      <FormControl size="small" fullWidth disabled={disabled} sx={tableSelectValueSx}>
                        <InputLabel shrink>{c.title}</InputLabel>
                        <Select
                          multiple
                          label={c.title}
                          displayEmpty
                          notched
                          value={arr}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateRow(ri, id, typeof val === 'string' ? val.split(',') : [...(val as string[])]);
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
                    <TableCell key={id} sx={featureTemplateTableCellSx}>
                      <FormControl size="small" fullWidth disabled={disabled} sx={tableSelectValueSx}>
                        <InputLabel shrink>{c.title}</InputLabel>
                        <Select
                          label={c.title}
                          displayEmpty
                          notched
                          value={typeof v === 'string' ? v : ''}
                          onChange={(e) => updateRow(ri, id, e.target.value)}
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
                    <TableCell key={id} sx={featureTemplateTableCellSx}>
                      <FeatureTemplateDateInput
                        label={c.title}
                        value={v === null || v === undefined ? '' : String(v)}
                        onChange={(s) => updateRow(ri, id, s || null)}
                        disabled={disabled}
                        currentLanguage={currentLanguage}
                      />
                    </TableCell>
                  );
                }
                return (
                  <TableCell key={id} sx={featureTemplateTableCellSx}>
                    <TextField
                      size="small"
                      disabled={disabled}
                      value={v === null || v === undefined ? '' : String(v)}
                      onChange={(e) => {
                        const s = e.target.value.slice(0, MAX_TABLE_TEXT_CELL_LENGTH);
                        updateRow(ri, id, s);
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
              <TableCell align="center" sx={{ ...featureTemplateTableCellSx, verticalAlign: 'middle' }}>
                <IconButton
                  size="small"
                  disabled={disabled}
                  onClick={() => onChange(rows.filter((_, i) => i !== ri))}
                  sx={deleteRowIconSx}
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
        disabled={disabled || rows.length >= MAX_TABLE_ROWS}
        onClick={() => onChange([...rows, emptyTableRow(columns)])}
      >
        {t('feature_templates_add_row', currentLanguage)}
      </Button>
    </Box>
  );
}

interface ModalBodyProps {
  f: QuestionFeatureFieldDef;
  value: FeatureFieldFormValue;
  onChange: (fieldId: string, value: FeatureFieldFormValue) => void;
  currentLanguage: string;
  disabled: boolean;
}

const FieldModalBody: React.FC<ModalBodyProps> = ({ f, value, onChange, currentLanguage, disabled }) => {
  const v = value ?? (f.type === 'list' && f.listAllowMultiple ? [] : '');
  const label = `${f.title}${f.required ? ' *' : ''}`;

  if (f.type === 'table') {
    if (!f.columns?.length) {
      return (
        <Typography variant="body2" color="text.secondary">
          {t('feature_templates_table_columns_invalid', currentLanguage)}
        </Typography>
      );
    }
    const cols = f.columns;
    const rows = Array.isArray(v) && v.length > 0 && typeof v[0] === 'object' ? (v as FeatureTableRow[]) : [];
    return (
      <TableRowsForm
        columns={cols}
        rows={rows}
        disabled={disabled}
        currentLanguage={currentLanguage}
        onChange={(r) => onChange(f.fieldId, r)}
      />
    );
  }

  if (f.type === 'list' && f.options?.length) {
    if (f.listAllowMultiple) {
      const arr = Array.isArray(v) ? v.map(String) : v ? [String(v)] : [];
      return (
        <FormControl key={f.fieldId} fullWidth size="small" disabled={disabled}>
          <InputLabel>{label}</InputLabel>
          <Select
            multiple
            label={label}
            value={arr}
            onChange={(e) => {
              const val = e.target.value;
              onChange(f.fieldId, typeof val === 'string' ? val.split(',') : [...(val as string[])]);
            }}
            renderValue={(selected) => (selected as string[]).join(', ')}
            MenuProps={{ PaperProps: { sx: { zIndex: 1600 } } }}
          >
            {f.options.map((opt) => (
              <MenuItem key={opt} value={opt}>
                {opt}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      );
    }
    return (
      <FormControl key={f.fieldId} fullWidth size="small" disabled={disabled}>
        <InputLabel>{label}</InputLabel>
        <Select
          label={label}
          value={typeof v === 'string' ? v : ''}
          onChange={(e) => onChange(f.fieldId, e.target.value)}
          MenuProps={{ PaperProps: { sx: { zIndex: 1600 } } }}
        >
          <MenuItem value="">
            <em>—</em>
          </MenuItem>
          {f.options.map((opt) => (
            <MenuItem key={opt} value={opt}>
              {opt}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    );
  }

  if (f.type === 'number') {
    const sv = typeof v === 'string' ? v : '';
    return (
      <TextField
        fullWidth
        size="small"
        type="number"
        label={label}
        value={sv}
        disabled={disabled}
        onChange={(e) => onChange(f.fieldId, e.target.value)}
      />
    );
  }

  if (f.type === 'date') {
    return (
      <ModalDateField fieldId={f.fieldId} label={label} value={v} required={f.required} disabled={disabled} currentLanguage={currentLanguage} onChange={onChange} />
    );
  }

  return (
    <TextField
      fullWidth
      size="small"
      label={label}
      value={typeof v === 'string' ? v : ''}
      disabled={disabled}
      onChange={(e) => onChange(f.fieldId, e.target.value)}
      multiline={f.title.length > 40}
      minRows={f.title.length > 40 ? 2 : 1}
    />
  );
};

interface ModalDateFieldProps {
  fieldId: string;
  label: string;
  value: FeatureFieldFormValue;
  required: boolean;
  disabled: boolean;
  currentLanguage: string;
  onChange: (fieldId: string, value: FeatureFieldFormValue) => void;
}

const ModalDateField: React.FC<ModalDateFieldProps> = ({
  fieldId,
  label,
  value,
  required,
  disabled,
  currentLanguage,
  onChange,
}) => {
  const theme = useTheme();
  const fieldRootRef = useRef<HTMLDivElement | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [draftLocal, setDraftLocal] = useState('');

  const displayValue = typeof value === 'string' ? value : '';
  const parsed = parseFeatureTemplateDateInput(displayValue);
  const popoverOpen = Boolean(anchorEl);

  const openPopover = () => {
    if (disabled || !fieldRootRef.current) return;
    setDraftLocal(parsed ? toDatetimeLocalValue(parsed) : '');
    setAnchorEl(fieldRootRef.current);
  };

  const closePopover = () => setAnchorEl(null);

  const applyFromPopover = () => {
    const d = parseDatetimeLocalValue(draftLocal);
    if (required && !d) return;
    onChange(fieldId, d ? formatFeatureTemplateDate(d) : '');
    setAnchorEl(null);
  };

  const draftValid = draftLocal.trim() !== '' && parseDatetimeLocalValue(draftLocal) != null;
  const tickDisabled = required ? !draftValid : false;

  return (
    <>
      <Box ref={fieldRootRef} sx={{ width: '100%', minWidth: 0 }}>
        <TextField
          fullWidth
          size="small"
          label={label}
          value={displayValue}
          disabled={disabled}
          InputProps={{
            readOnly: true,
            endAdornment: (
              <InputAdornment position="end">
                <Box sx={{ display: 'flex' }}>
                  {!required && displayValue && !disabled ? (
                    <IconButton size="small" onClick={() => onChange(fieldId, '')} edge="end">
                      <Clear fontSize="small" />
                    </IconButton>
                  ) : null}
                  <IconButton size="small" onClick={openPopover} disabled={disabled} edge="end">
                    <Event fontSize="small" />
                  </IconButton>
                </Box>
              </InputAdornment>
            ),
          }}
        />
      </Box>
      <Popover
        open={popoverOpen}
        anchorEl={anchorEl}
        onClose={closePopover}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        marginThreshold={0}
        PaperProps={{ sx: { p: 1, zIndex: theme.zIndex.modal + 10 } }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <TextField
            type="datetime-local"
            size="small"
            value={draftLocal}
            onChange={(e) => setDraftLocal(e.target.value)}
            inputProps={{ step: 60 }}
            label={t('feature_template_pick_date', currentLanguage)}
            InputLabelProps={{ shrink: true }}
          />
          <IconButton size="small" color="primary" onClick={applyFromPopover} disabled={tickDisabled}>
            <Check />
          </IconButton>
        </Box>
      </Popover>
    </>
  );
};

const FeatureTemplateFieldsEditor: React.FC<FeatureTemplateFieldsEditorProps> = ({
  fields,
  values,
  onChange,
  currentLanguage,
  disabled = false,
}) => {
  const [openFieldId, setOpenFieldId] = useState<string | null>(null);
  const active = openFieldId ? fields.find((x) => x.fieldId === openFieldId) : undefined;
  const activeVal = active ? values[active.fieldId] : undefined;

  if (fields.length === 0) return null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {fields.map((f) => {
        const v =
          values[f.fieldId] ??
          (f.type === 'list' && f.listAllowMultiple ? [] : f.type === 'table' ? [] : '');

        if (f.type === 'table') {
          const summary = formatFeatureFieldSummary(f, summaryRaw(f, v));
          return (
            <Button
              key={f.fieldId}
              fullWidth
              variant="outlined"
              disabled={disabled}
              onClick={() => setOpenFieldId(f.fieldId)}
              sx={{ justifyContent: 'flex-start', textTransform: 'none', py: 1 }}
            >
              <Box sx={{ textAlign: 'left', width: '100%', minWidth: 0 }}>
                <Typography variant="caption" color="text.secondary" display="block">
                  {f.title}
                  {f.required ? ' *' : ''}
                </Typography>
                <Typography variant="body2" noWrap>
                  {summary}
                </Typography>
              </Box>
            </Button>
          );
        }

        return (
          <Box key={f.fieldId}>
            <FieldModalBody
              f={f}
              value={v}
              onChange={(id, val) => onChange(id, val)}
              currentLanguage={currentLanguage}
              disabled={disabled}
            />
          </Box>
        );
      })}

      <Dialog
        open={Boolean(active && active.type === 'table')}
        onClose={() => setOpenFieldId(null)}
        maxWidth="md"
        fullWidth
      >
        {active && active.type === 'table' ? (
          <>
            <DialogTitle>{active.title}</DialogTitle>
            <DialogContent>
              <FieldModalBody
                f={active}
                value={activeVal ?? []}
                onChange={(id, val) => onChange(id, val)}
                currentLanguage={currentLanguage}
                disabled={disabled}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenFieldId(null)}>{t('feature_templates_modal_done', currentLanguage)}</Button>
            </DialogActions>
          </>
        ) : null}
      </Dialog>
    </Box>
  );
};

function summaryRaw(f: QuestionFeatureFieldDef, v: FeatureFieldFormValue): unknown {
  if (f.type === 'table' && Array.isArray(v)) return v;
  if (f.type === 'list' && f.listAllowMultiple && Array.isArray(v)) return v;
  return v;
}

export default FeatureTemplateFieldsEditor;
