import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  TextField,
  Button,
  Box,
  CircularProgress,
  Checkbox,
  DialogActions,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Folder, CreateNewFolder } from '@mui/icons-material';
import { t } from '../../utils/translations';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { fetchCollections, createCollectionThunk } from '../../store/bookmarks/bookmarkCollectionThunks';
import {
  addToCollectionThunk,
  removeFromCollectionThunk,
  fetchCollectionItems,
} from '../../store/bookmarks/bookmarkCollectionThunks';
import { addBookmarkThunk, fetchUserBookmarks } from '../../store/bookmarks/bookmarkThunks';
import type { AddBookmarkRequest } from '../../types/bookmark';
import { showErrorToast, showSuccessToast } from '../../utils/notificationUtils';

interface BookmarkAddModalProps {
  open: boolean;
  onClose: () => void;
  payload: AddBookmarkRequest | null;
  /** Mevcut bookmark ID - düzenleme modunda */
  bookmarkId?: string | null;
  currentLanguage: string;
  onSuccess?: () => void;
}

const BookmarkAddModal: React.FC<BookmarkAddModalProps> = ({
  open,
  onClose,
  payload,
  bookmarkId,
  currentLanguage,
  onSuccess,
}) => {
  const dispatch = useAppDispatch();
  const { collections, itemsByCollection, loading } = useAppSelector((s) => s.bookmarkCollections);
  const { items: bookmarks } = useAppSelector((s) => s.bookmarks);

  const [newFolderName, setNewFolderName] = useState('');
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [initialSelectedIds, setInitialSelectedIds] = useState<Set<string>>(new Set());
  const [loadingCollections, setLoadingCollections] = useState(false);

  useEffect(() => {
    if (open) {
      dispatch(fetchCollections());
      setNewFolderName('');
      if (!bookmarkId) {
        setSelectedIds(new Set());
        setInitialSelectedIds(new Set());
      }
    }
  }, [open, dispatch, bookmarkId]);

  // Düzenleme modunda: hangi klasörlerde bu bookmark var - fetch ile öğren
  useEffect(() => {
    if (!open || !bookmarkId || collections.length === 0) return;
    setLoadingCollections(true);
    Promise.all(collections.map((c) => dispatch(fetchCollectionItems(c._id)).unwrap()))
      .then((results) => {
        const ids = new Set(
          results
            .filter((r) => r.items.some((item: any) => item._id === bookmarkId))
            .map((r) => r.collectionId)
        );
        setSelectedIds(ids);
        setInitialSelectedIds(ids);
      })
      .catch(() => showErrorToast(t('error', currentLanguage)))
      .finally(() => setLoadingCollections(false));
  }, [open, bookmarkId, collections, currentLanguage, dispatch]);

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      setCreating(true);
      const result = await dispatch(createCollectionThunk({ name: newFolderName.trim() }));
      if (createCollectionThunk.fulfilled.match(result)) {
        setSelectedIds((prev) => new Set([...prev, result.payload._id]));
        setNewFolderName('');
        showSuccessToast(t('bookmark_folder_created', currentLanguage));
      }
    } catch (e) {
      showErrorToast(t('error', currentLanguage));
    } finally {
      setCreating(false);
    }
  };

  const handleSave = async () => {
    if (!payload && !bookmarkId) return;

    let bookmarkIdToUse = bookmarkId ?? null;

    try {
      setSaving(true);

      if (!bookmarkIdToUse) {
        const result = await dispatch(addBookmarkThunk(payload!));
        if (addBookmarkThunk.fulfilled.match(result) && result.payload) {
          bookmarkIdToUse = result.payload._id;
        } else if (addBookmarkThunk.rejected.match(result)) {
          const existing = bookmarks.find(
            (b) => b.target_type === payload!.targetType && b.target_id === payload!.targetId
          );
          if (existing) bookmarkIdToUse = existing._id;
        }
        if (!bookmarkIdToUse) {
          showErrorToast(t('error', currentLanguage));
          return;
        }
      }

      const prevIds = bookmarkId ? initialSelectedIds : new Set<string>();
      const toAdd = [...selectedIds].filter((id) => !prevIds.has(id));
      const toRemove = [...prevIds].filter((id) => !selectedIds.has(id));

      for (const collectionId of toAdd) {
        await dispatch(addToCollectionThunk({ collectionId, bookmarkId: bookmarkIdToUse! })).unwrap();
      }
      for (const collectionId of toRemove) {
        await dispatch(removeFromCollectionThunk({ collectionId, bookmarkId: bookmarkIdToUse! })).unwrap();
      }

      dispatch(fetchUserBookmarks());
      collections.forEach((c) => dispatch(fetchCollectionItems(c._id)));
      showSuccessToast(t('bookmark_added', currentLanguage));
      onSuccess?.();
      onClose();
    } catch (e) {
      showErrorToast(typeof e === 'string' ? e : t('error', currentLanguage));
    } finally {
      setSaving(false);
    }
  };

  const isEditMode = !!bookmarkId;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{t('bookmark_select_folder', currentLanguage)}</DialogTitle>
      <DialogContent>
        {loading && collections.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <>
            <List dense sx={{ py: 0 }}>
              {(() => {
                const roots = collections.filter((c) => !c.parent_id || c.parent_id === '');
                const getChildren = (pid: string) => collections.filter((c) => c.parent_id === pid);
                const renderFolder = (c: (typeof collections)[0], depth: number) => (
                  <React.Fragment key={c._id}>
                    <ListItemButton
                      onClick={() => toggleSelection(c._id)}
                      disabled={saving}
                      sx={{ borderRadius: 1, mx: 0, pl: 2 + depth * 2 }}
                    >
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <Checkbox
                          edge="start"
                          checked={selectedIds.has(c._id)}
                          tabIndex={-1}
                          disableRipple
                          size="small"
                        />
                      </ListItemIcon>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <Folder sx={{ color: c.color || 'primary.main', fontSize: 20 }} />
                      </ListItemIcon>
                      <ListItemText primary={c.name} />
                    </ListItemButton>
                    {getChildren(c._id).map((child) => renderFolder(child, depth + 1))}
                  </React.Fragment>
                );
                return roots.map((c) => renderFolder(c, 0));
              })()}
            </List>

            <Box sx={{ mt: 2, pt: 2, borderTop: (t) => `1px solid ${t.palette.divider}`, display: 'flex', gap: 1, alignItems: 'center' }}>
              <Tooltip title={t('bookmark_create_new_folder', currentLanguage)}>
                <span>
                  <IconButton
                    size="small"
                    onClick={handleCreateFolder}
                    disabled={!newFolderName.trim() || creating}
                    sx={{
                      flexShrink: 0,
                      border: (theme) => `1px solid ${theme.palette.divider}`,
                      borderRadius: 1,
                      width: 40,
                      height: 40,
                    }}
                  >
                    {creating ? (
                      <CircularProgress size={20} sx={{ color: 'inherit' }} />
                    ) : (
                      <CreateNewFolder fontSize="small" />
                    )}
                  </IconButton>
                </span>
              </Tooltip>
              <TextField
                size="small"
                placeholder={t('bookmark_folder_name', currentLanguage)}
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                disabled={creating}
                fullWidth
                sx={{ flex: 1 }}
              />
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving}>
          {t('cancel', currentLanguage)}
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving || (loadingCollections && isEditMode)}
          startIcon={saving ? <CircularProgress size={18} sx={{ color: 'inherit' }} /> : null}
        >
          {saving ? '' : t('save', currentLanguage)}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BookmarkAddModal;
