import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { DeleteOutline, SaveAsOutlined, SaveOutlined } from '@mui/icons-material';
import { bookmarkService } from '../../services/bookmarkService';
import { showErrorToast, showSuccessToast } from '../../utils/notificationUtils';
import { t } from '../../utils/translations';
import type { BookmarkResponse, QueryBookmarkPayload } from '../../types/bookmark';
import type { FlatClauseRow } from '../../types/query';
import type { DateSortOrder } from '../home/ItemsPerPageSelector';

const MAX_SAVED = 20;

function buildPayload(
  rows: FlatClauseRow[],
  dateSort: DateSortOrder
): QueryBookmarkPayload {
  return {
    version: 1,
    rows: rows.map(r => ({
      id: r.id,
      entity: r.entity,
      combinator: r.combinator,
      indent: r.indent,
      field: r.field,
      op: r.op,
      value: r.value,
      selected: false,
    })),
    dateSort,
  };
}

function summarizeRows(rows: FlatClauseRow[]): string {
  const parts = rows
    .filter(r => r.field && r.op)
    .map(r => `${r.entity}:${r.field} ${r.op}`);
  const text = parts.join('; ') || 'query';
  return text.length > 500 ? `${text.slice(0, 497)}...` : text;
}

interface Props {
  rows: FlatClauseRow[];
  dateSort: DateSortOrder;
  currentLanguage: string;
  activeBookmarkId: string | null;
  onActiveBookmarkChange: (id: string | null) => void;
  onLoad: (rows: FlatClauseRow[], dateSort: DateSortOrder) => void;
}

const QuerySavedBar: React.FC<Props> = ({
  rows,
  dateSort,
  currentLanguage,
  activeBookmarkId,
  onActiveBookmarkChange,
  onLoad,
}) => {
  const [saved, setSaved] = useState<BookmarkResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveMode, setSaveMode] = useState<'create' | 'update'>('create');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const active = saved.find(b => b._id === activeBookmarkId) || null;

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const list = await bookmarkService.getQueryBookmarks();
      setSaved(list);
    } catch (e) {
      showErrorToast(e instanceof Error ? e.message : 'Failed to load saved queries');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const openCreate = () => {
    setSaveMode('create');
    setTitle('');
    setDescription('');
    setSaveOpen(true);
  };

  const openUpdate = () => {
    if (!active) return;
    setSaveMode('update');
    setTitle(active.target_data.title || '');
    setDescription(active.notes || '');
    setSaveOpen(true);
  };

  const hasValidClauses = rows.some(r => r.field && r.op);

  const handleSave = async () => {
    const trimmed = title.trim();
    if (!trimmed) {
      showErrorToast(t('query_save_title_required', currentLanguage));
      return;
    }
    if (!hasValidClauses) {
      showErrorToast(t('query_no_valid_clauses', currentLanguage));
      return;
    }
    if (saveMode === 'create' && saved.length >= MAX_SAVED) {
      showErrorToast(t('query_save_limit', currentLanguage));
      return;
    }

    setSaving(true);
    try {
      const payload = buildPayload(rows, dateSort);
      const content = summarizeRows(rows);
      if (saveMode === 'update' && activeBookmarkId) {
        const updated = await bookmarkService.updateBookmark(activeBookmarkId, {
          notes: description.trim() || undefined,
          targetData: { title: trimmed, content },
          payload,
        });
        setSaved(prev => prev.map(b => (b._id === updated._id ? updated : b)));
        showSuccessToast(t('query_updated_success', currentLanguage));
      } else {
        const created = await bookmarkService.addBookmark({
          targetType: 'query',
          targetData: {
            title: trimmed,
            content,
            created_at: new Date().toISOString(),
          },
          notes: description.trim() || undefined,
          payload,
        });
        setSaved(prev => [created, ...prev]);
        onActiveBookmarkChange(created._id);
        showSuccessToast(t('query_saved_success', currentLanguage));
      }
      setSaveOpen(false);
    } catch (e) {
      showErrorToast(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleSelect = (id: string) => {
    if (!id) {
      onActiveBookmarkChange(null);
      return;
    }
    const item = saved.find(b => b._id === id);
    if (!item?.payload?.rows?.length) {
      showErrorToast(t('query_no_valid_clauses', currentLanguage));
      return;
    }
    const nextRows: FlatClauseRow[] = item.payload.rows.map(r => ({
      id: r.id,
      entity: r.entity,
      combinator: r.combinator,
      indent: r.indent,
      field: r.field,
      op: r.op as FlatClauseRow['op'],
      value: r.value,
      selected: false,
    }));
    onActiveBookmarkChange(item._id);
    onLoad(nextRows, item.payload.dateSort);
  };

  const handleDelete = async () => {
    if (!activeBookmarkId) return;
    if (!window.confirm(t('query_confirm_delete_saved', currentLanguage))) return;
    try {
      await bookmarkService.removeBookmark(activeBookmarkId);
      setSaved(prev => prev.filter(b => b._id !== activeBookmarkId));
      onActiveBookmarkChange(null);
      showSuccessToast(t('query_deleted_success', currentLanguage));
    } catch (e) {
      showErrorToast(e instanceof Error ? e.message : 'Delete failed');
    }
  };

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 1,
          mb: 1.5,
        }}
      >
        <FormControl size="small" sx={{ minWidth: 220, flex: '1 1 200px' }}>
          <InputLabel id="saved-query-label">
            {t('query_saved_queries', currentLanguage)}
          </InputLabel>
          <Select
            labelId="saved-query-label"
            label={t('query_saved_queries', currentLanguage)}
            value={activeBookmarkId || ''}
            disabled={loading}
            onChange={e => handleSelect(String(e.target.value))}
          >
            <MenuItem value="">
              <em>{t('query_select_saved', currentLanguage)}</em>
            </MenuItem>
            {saved.map(b => (
              <MenuItem key={b._id} value={b._id}>
                {b.target_data.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Typography variant="caption" color="text.secondary" sx={{ mx: 0.5 }}>
          {saved.length}/{MAX_SAVED}
        </Typography>

        <Tooltip title={t('query_save_as', currentLanguage)}>
          <span>
            <Button
              size="small"
              variant="outlined"
              startIcon={<SaveAsOutlined />}
              onClick={openCreate}
              disabled={!hasValidClauses || saved.length >= MAX_SAVED}
            >
              {t('query_save', currentLanguage)}
            </Button>
          </span>
        </Tooltip>

        {active && (
          <>
            <Button
              size="small"
              variant="outlined"
              startIcon={<SaveOutlined />}
              onClick={openUpdate}
              disabled={!hasValidClauses}
            >
              {t('query_update_saved', currentLanguage)}
            </Button>
            <Tooltip title={t('query_delete_saved', currentLanguage)}>
              <IconButton size="small" color="error" onClick={() => void handleDelete()}>
                <DeleteOutline fontSize="small" />
              </IconButton>
            </Tooltip>
          </>
        )}
      </Box>

      {active?.notes && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          {active.notes}
        </Typography>
      )}

      <Dialog open={saveOpen} onClose={() => setSaveOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>
          {saveMode === 'update'
            ? t('query_update_saved', currentLanguage)
            : t('query_save', currentLanguage)}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            autoFocus
            label={t('query_save_title', currentLanguage)}
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            inputProps={{ maxLength: 120 }}
            fullWidth
          />
          <TextField
            label={t('query_save_description', currentLanguage)}
            value={description}
            onChange={e => setDescription(e.target.value)}
            multiline
            minRows={2}
            inputProps={{ maxLength: 1000 }}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveOpen(false)} disabled={saving}>
            {t('cancel', currentLanguage)}
          </Button>
          <Button variant="contained" onClick={() => void handleSave()} disabled={saving}>
            {t('bookmark_save', currentLanguage)}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default QuerySavedBar;
