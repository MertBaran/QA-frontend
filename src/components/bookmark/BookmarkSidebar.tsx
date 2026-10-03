import React, { useEffect, useState } from 'react';
import {
  Box,
  IconButton,
  Collapse,
  Typography,
  List,
  ListItemButton,
  ListItemText,
  useTheme,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  ListItemIcon,
  TextField,
  Button,
  DialogActions,
  Tooltip,
} from '@mui/material';
import { Bookmark as BookmarkIcon, ExpandMore, ExpandLess, Folder, FolderOpen, CreateNewFolder, OpenInNew, Settings } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { t } from '../../utils/translations';
import { useSettingsModal } from '../../contexts/SettingsModalContext';
import { showErrorToast, showSuccessToast } from '../../utils/notificationUtils';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { fetchCollections, fetchCollectionItems, createCollectionThunk } from '../../store/bookmarks/bookmarkCollectionThunks';
import type { BookmarkResponse } from '../../types/bookmark';

interface BookmarkSidebarProps {
  currentLanguage: string;
}

const BookmarkSidebar: React.FC<BookmarkSidebarProps> = ({ currentLanguage }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const openSettingsModal = useSettingsModal()?.openSettingsModal;
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const { collections, itemsByCollection, loading } = useAppSelector((s) => s.bookmarkCollections);

  const [open, setOpen] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [detailCollectionId, setDetailCollectionId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createParentId, setCreateParentId] = useState<string | null>(null);
  const [folderName, setFolderName] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && open) {
      dispatch(fetchCollections());
    }
  }, [isAuthenticated, open, dispatch]);

  const toggleFolder = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        dispatch(fetchCollectionItems(id));
        const folder = collections.find((c) => c._id === id);
        if (folder?.parent_id) next.add(folder.parent_id);
      }
      return next;
    });
  };

  const getBookmarkLabel = (b: BookmarkResponse) => {
    const title = b.target_data?.title ?? '';
    const prefix =
      b.target_type === 'question'
        ? t('bookmark_type_question', currentLanguage)
        : b.target_type === 'query'
          ? t('bookmark_type_query', currentLanguage)
          : t('bookmark_type_answer', currentLanguage);
    return `${prefix} • ${title}`.trim();
  };

  const handleItemClick = (b: BookmarkResponse) => {
    if (b.target_type === 'query') {
      navigate(`/query?bookmarkId=${b._id}`);
    } else if (b.target_type === 'question') {
      navigate(`/questions/${b.target_id}`);
    } else if (b.target_type === 'answer') {
      const url = (b.target_data as any)?.url ?? '';
      const qId = url.match(/\/questions\/([^/#]+)/)?.[1];
      if (qId) {
        navigate(`/questions/${qId}#answer-${b.target_id}`);
      } else {
        navigate(`/questions`);
      }
    }
    setDetailCollectionId(null);
  };

  const openFolderDetail = (id: string) => {
    dispatch(fetchCollectionItems(id));
    setDetailCollectionId(id);
  };

  const handleCreateFolder = async (parentIdOverride?: string | null) => {
    const name = folderName.trim();
    if (!name) return;
    setCreateLoading(true);
    const parentId = parentIdOverride !== undefined ? parentIdOverride : createParentId;
    try {
      await dispatch(createCollectionThunk({ name, parent_id: parentId || undefined })).unwrap();
      showSuccessToast(t('bookmark_folder_created', currentLanguage));
      setCreateOpen(false);
      setCreateParentId(null);
      setFolderName('');
      if (parentId) {
        setExpandedIds((prev) => new Set([...prev, parentId]));
      }
    } catch (err: any) {
      showErrorToast(typeof err === 'string' ? err : t('bookmark_folder_create_failed', currentLanguage));
    } finally {
      setCreateLoading(false);
    }
  };

  const openCreateDialog = (parentId?: string | null) => {
    setCreateParentId(parentId ?? null);
    setFolderName('');
    setCreateOpen(true);
  };

  const buildTree = () => {
    const roots = collections.filter((c) => !c.parent_id || c.parent_id === '');
    const getChildren = (parentId: string) =>
      collections.filter((c) => c.parent_id === parentId);
    return { roots, getChildren };
  };

  if (!isAuthenticated) return null;

  const collection = detailCollectionId ? collections.find((c) => c._id === detailCollectionId) : null;
  const detailItems = detailCollectionId ? itemsByCollection[detailCollectionId] ?? [] : [];

  return (
    <>
      <Box
        sx={{
          position: 'fixed',
          left: 16,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: 0.5,
        }}
      >
        <Tooltip title={t('settings', currentLanguage)}>
          <IconButton
            size="large"
            onClick={() => openSettingsModal?.()}
            sx={{
              width: 60,
              height: 60,
              flexShrink: 0,
              backgroundColor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              color: theme.palette.text.secondary,
              boxShadow: theme.shadows[4],
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
                color: theme.palette.primary.main,
                transform: 'scale(1.05)',
              },
              transition: 'all 0.2s',
            }}
          >
            <Settings />
          </IconButton>
        </Tooltip>
        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: 0 }}>
        <IconButton
          size="large"
          onClick={() => setOpen((o) => !o)}
          sx={{
            width: 60,
            height: 60,
            flexShrink: 0,
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            color: theme.palette.primary.main,
            boxShadow: theme.shadows[4],
            '&:hover': {
              backgroundColor: theme.palette.action.hover,
              transform: 'scale(1.05)',
            },
            transition: 'all 0.2s',
          }}
        >
          <BookmarkIcon />
        </IconButton>

        <Collapse in={open} orientation="horizontal" sx={{ ml: 1 }}>
          <Box
            sx={{
              backgroundColor: theme.palette.background.paper,
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: theme.shadows[8],
              minWidth: 220,
              maxWidth: 280,
              maxHeight: 400,
              overflow: 'auto',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.text.secondary }}>
                {t('bookmark_folders', currentLanguage)}
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Tooltip title={t('bookmark_detail_page', currentLanguage)}>
                  <IconButton
                    size="small"
                    onClick={() => navigate('/bookmarks')}
                    sx={{ color: theme.palette.primary.main }}
                  >
                    <OpenInNew fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
            {loading && collections.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress size={24} />
              </Box>
            ) : collections.length === 0 ? (
              <Typography variant="body2" sx={{ px: 2, py: 2, color: theme.palette.text.secondary }}>
                {t('no_bookmarks', currentLanguage)}
              </Typography>
            ) : (
              <List dense disablePadding sx={{ pb: 1 }}>
                {(() => {
                  const { roots, getChildren } = buildTree();
                  const renderFolder = (c: typeof collections[0], depth = 0) => {
                    const isExpanded = expandedIds.has(c._id);
                    const items = itemsByCollection[c._id] ?? [];
                    const children = getChildren(c._id);
                    const pl = 2 + depth * 2;
                    return (
                      <React.Fragment key={c._id}>
                        <ListItemButton
                          onClick={() => navigate(`/bookmarks?folder=${c._id}`)}
                          sx={{ py: 0.5, borderRadius: 1, mx: 0.5, pl }}
                        >
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            {isExpanded ? (
                              <FolderOpen sx={{ fontSize: 20, color: c.color || theme.palette.primary.main }} />
                            ) : (
                              <Folder sx={{ fontSize: 20, color: c.color || theme.palette.primary.main }} />
                            )}
                          </ListItemIcon>
                          <ListItemText primary={c.name} primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }} />
                          <Tooltip title={t('bookmark_create_subfolder', currentLanguage)}>
                            <IconButton
                              size="small"
                              onClick={(e) => { e.stopPropagation(); openCreateDialog(c._id); }}
                              sx={{ mr: 0.5, color: theme.palette.primary.main }}
                            >
                              <CreateNewFolder sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                          <IconButton
                            size="small"
                            onClick={(e) => { e.stopPropagation(); toggleFolder(c._id); }}
                            sx={{ p: 0.25 }}
                          >
                            {isExpanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                          </IconButton>
                        </ListItemButton>
                        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                          <List component="div" disablePadding>
                            {children.map((child) => renderFolder(child, depth + 1))}
                            {items.length === 0 && children.length === 0 ? (
                              <ListItemButton disabled sx={{ pl: pl + 4 }}>
                                <ListItemText
                                  primary={t('bookmark_empty_folder', currentLanguage)}
                                  primaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                                />
                              </ListItemButton>
                            ) : null}
                            {items.slice(0, 5).map((b) => (
                              <ListItemButton
                                key={b._id}
                                sx={{ pl: pl + 4, py: 0.25 }}
                                onClick={() => handleItemClick(b)}
                              >
                                <ListItemText
                                  primary={getBookmarkLabel(b).slice(0, 50) + (getBookmarkLabel(b).length > 50 ? '...' : '')}
                                  primaryTypographyProps={{ variant: 'caption' }}
                                />
                              </ListItemButton>
                            ))}
                            {items.length > 5 && (
                              <ListItemButton
                                sx={{ pl: pl + 4, py: 0.25 }}
                                onClick={() => openFolderDetail(c._id)}
                              >
                                <ListItemText
                                  primary={`${t('bookmark_see_all', currentLanguage)} (${items.length})`}
                                  primaryTypographyProps={{ variant: 'caption', color: 'primary' }}
                                />
                              </ListItemButton>
                            )}
                          </List>
                        </Collapse>
                      </React.Fragment>
                    );
                  };
                  return roots.map((c) => renderFolder(c));
                })()}
              </List>
            )}
            <Box sx={{ px: 2, py: 1.5, borderTop: (t) => `1px solid ${t.palette.divider}` }}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Tooltip title={t('bookmark_create_new_folder', currentLanguage)}>
                  <span>
                    <IconButton
                      size="small"
                      onClick={() => handleCreateFolder(null)}
                      disabled={!folderName.trim() || createLoading}
                      sx={{
                        flexShrink: 0,
                        border: (t) => `1px solid ${t.palette.divider}`,
                        borderRadius: 1,
                        color: theme.palette.primary.main,
                      }}
                    >
                      {createLoading ? (
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
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder(null)}
                  disabled={createLoading}
                  fullWidth
                  sx={{ flex: 1 }}
                />
              </Box>
            </Box>
          </Box>
        </Collapse>
        </Box>
      </Box>

      <Dialog open={!!detailCollectionId} onClose={() => setDetailCollectionId(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{collection?.name ?? ''}</DialogTitle>
        <DialogContent>
          {detailItems.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              {t('bookmark_empty_folder', currentLanguage)}
            </Typography>
          ) : (
            <List>
              {detailItems.map((b) => (
                <ListItemButton key={b._id} onClick={() => handleItemClick(b)}>
                  <ListItemText
                    primary={getBookmarkLabel(b)}
                    secondary={
                      b.target_type === 'query'
                        ? b.notes || t('bookmark_type_query', currentLanguage)
                        : b.target_type === 'question'
                          ? t('questions', currentLanguage)
                          : t('answers', currentLanguage)
                    }
                  />
                </ListItemButton>
              ))}
            </List>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onClose={() => !createLoading && setCreateOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{t('bookmark_create_new_folder', currentLanguage)}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label={t('bookmark_folder_name', currentLanguage)}
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
            disabled={createLoading}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCreateOpen(false)} disabled={createLoading}>
            {t('cancel', currentLanguage)}
          </Button>
          <Button variant="contained" onClick={() => handleCreateFolder()} disabled={!folderName.trim() || createLoading}>
            {createLoading ? <CircularProgress size={20} sx={{ color: 'inherit' }} /> : t('create', currentLanguage)}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default BookmarkSidebar;
