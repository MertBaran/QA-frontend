import React, { useMemo } from 'react';
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  IconButton,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { Add, DeleteOutline } from '@mui/icons-material';
import type {
  FlatClauseRow,
  QueryFieldDef,
  QueryOp,
  QueryRowEntity,
} from '../../types/query';
import QueryValueInput from './QueryValueInput';
import QueryFieldPicker from './QueryFieldPicker';
import { createEmptyRow } from './queryFlatTree';
import { t } from '../../utils/translations';

interface Props {
  rows: FlatClauseRow[];
  questionFields: QueryFieldDef[];
  answerFields: QueryFieldDef[];
  onChange: (rows: FlatClauseRow[]) => void;
  onGroup: () => void;
  onUngroup: () => void;
  onRun: () => void;
  running?: boolean;
  currentLanguage: string;
}

const QueryClauseTable: React.FC<Props> = ({
  rows,
  questionFields,
  answerFields,
  onChange,
  onGroup,
  onUngroup,
  onRun,
  running,
  currentLanguage,
}) => {
  const questionByKey = useMemo(
    () => new Map(questionFields.map(f => [f.key, f])),
    [questionFields]
  );
  const answerByKey = useMemo(
    () => new Map(answerFields.map(f => [f.key, f])),
    [answerFields]
  );

  const fieldsFor = (entity: QueryRowEntity) =>
    entity === 'question' ? questionFields : answerFields;
  const mapFor = (entity: QueryRowEntity) =>
    entity === 'question' ? questionByKey : answerByKey;

  const updateRow = (id: string, patch: Partial<FlatClauseRow>) => {
    onChange(rows.map(r => (r.id === id ? { ...r, ...patch } : r)));
  };

  const removeRow = (id: string) => {
    if (rows.length <= 1) {
      onChange([createEmptyRow()]);
      return;
    }
    onChange(rows.filter(r => r.id !== id));
  };

  const addRow = (afterId: string) => {
    const after = rows.find(r => r.id === afterId) || rows[rows.length - 1];
    const next = createEmptyRow(
      after?.combinator || 'AND',
      after?.entity || 'question'
    );
    const idx = rows.findIndex(r => r.id === afterId);
    const copy = [...rows];
    copy.splice(idx + 1, 0, next);
    onChange(copy);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter' || e.nativeEvent.isComposing || running) return;
    const target = e.target as HTMLElement;
    if (target.tagName === 'TEXTAREA') return;
    if (target.closest('[role="listbox"]') || target.getAttribute('role') === 'option') {
      return;
    }
    e.preventDefault();
    onRun();
  };

  return (
    <Box sx={{ width: '100%' }} onKeyDown={handleKeyDown}>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1.5,
          alignItems: 'center',
          mb: 1.5,
          px: 0.5,
        }}
      >
        <Button variant="outlined" size="small" onClick={onGroup}>
          {t('query_group', currentLanguage)}
        </Button>
        <Button variant="outlined" size="small" onClick={onUngroup}>
          {t('query_ungroup', currentLanguage)}
        </Button>
        <Button
          variant="contained"
          size="small"
          onClick={onRun}
          disabled={running}
          startIcon={running ? <CircularProgress size={14} color="inherit" /> : undefined}
        >
          {t('query_run', currentLanguage)}
        </Button>
      </Box>

      <Box sx={{ width: '100%', overflowX: 'auto' }}>
        <Table size="small" sx={{ minWidth: 1040 }}>
          <TableHead>
            <TableRow>
              <TableCell width={72} />
              <TableCell width={40} />
              <TableCell width={100}>{t('query_and_or', currentLanguage)}</TableCell>
              <TableCell width={130}>{t('query_type', currentLanguage)}</TableCell>
              <TableCell width={240}>{t('query_field', currentLanguage)}</TableCell>
              <TableCell width={160}>{t('query_operator', currentLanguage)}</TableCell>
              <TableCell>{t('query_value', currentLanguage)}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, index) => {
              const fieldMap = mapFor(row.entity);
              const field = fieldMap.get(row.field);
              const ops = field?.ops || ['contains'];
              return (
                <TableRow key={row.id} hover selected={row.selected}>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.25 }}>
                      <IconButton size="small" onClick={() => addRow(row.id)} aria-label="add">
                        <Add fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => removeRow(row.id)}
                        aria-label="remove"
                      >
                        <DeleteOutline fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Checkbox
                      size="small"
                      checked={row.selected}
                      onChange={e => updateRow(row.id, { selected: e.target.checked })}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ pl: row.indent * 2 }}>
                      {index === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                          —
                        </Typography>
                      ) : (
                        <Select
                          size="small"
                          value={row.combinator}
                          onChange={e =>
                            updateRow(row.id, {
                              combinator: e.target.value as 'AND' | 'OR',
                            })
                          }
                        >
                          <MenuItem value="AND">{t('query_and', currentLanguage)}</MenuItem>
                          <MenuItem value="OR">{t('query_or', currentLanguage)}</MenuItem>
                        </Select>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Select
                      size="small"
                      fullWidth
                      value={row.entity}
                      onChange={e => {
                        const entity = e.target.value as QueryRowEntity;
                        const nextMap = mapFor(entity);
                        const keepField = row.field && nextMap.has(row.field);
                        updateRow(row.id, {
                          entity,
                          ...(keepField
                            ? {}
                            : { field: '', op: 'contains' as QueryOp, value: '' }),
                        });
                      }}
                    >
                      <MenuItem value="question">
                        {t('query_content_question', currentLanguage)}
                      </MenuItem>
                      <MenuItem value="answer">
                        {t('query_content_answer', currentLanguage)}
                      </MenuItem>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ pl: row.indent * 2 }}>
                      <QueryFieldPicker
                        fields={fieldsFor(row.entity)}
                        value={row.field}
                        currentLanguage={currentLanguage}
                        onChange={key => {
                          const nextField = fieldMap.get(key);
                          const nextOp = (nextField?.ops[0] || 'contains') as QueryOp;
                          updateRow(row.id, {
                            field: key,
                            op: nextOp,
                            value: '',
                          });
                        }}
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Select
                      size="small"
                      fullWidth
                      value={ops.includes(row.op) ? row.op : ops[0]}
                      onChange={e =>
                        updateRow(row.id, { op: e.target.value as QueryOp, value: '' })
                      }
                      disabled={!row.field}
                    >
                      {ops.map(op => (
                        <MenuItem key={op} value={op}>
                          {t(`query_op_${op}`, currentLanguage) || op}
                        </MenuItem>
                      ))}
                    </Select>
                  </TableCell>
                  <TableCell>
                    <QueryValueInput
                      field={field}
                      op={row.op}
                      value={row.value}
                      onChange={v => updateRow(row.id, { value: v })}
                      currentLanguage={currentLanguage}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Box>
    </Box>
  );
};

export default QueryClauseTable;
