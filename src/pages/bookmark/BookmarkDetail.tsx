import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemText,
  useTheme,
  CircularProgress,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  FormControl,
  Select,
  Autocomplete,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Folder,
  FolderOpen,
  DeleteOutline,
  DriveFileMove,
  PlaylistAdd,
  AddPhotoAlternate,
  OpenInNew,
  MoreVert,
  DragIndicator,
  CreateNewFolder,
  Public,
  Lock,
  Share,
  LinkOff,
  ContentCopy,
} from '@mui/icons-material';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Layout from '../../components/layout/Layout';
import { t } from '../../utils/translations';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import {
  fetchCollections,
  fetchCollectionItems,
  removeFromCollectionThunk,
  addToCollectionThunk,
  reorderCollectionItemsThunk,
  updateCollectionThunk,
  createCollectionThunk,
} from '../../store/bookmarks/bookmarkCollectionThunks';
import { showErrorToast, showSuccessToast } from '../../utils/notificationUtils';
import { stripRefLinksForDisplay } from '../../utils/refLinkDisplay';
import UserAvatarById from '../../components/ui/UserAvatarById';
import { contentAssetService } from '../../services/contentAssetService';
import { uploadFileToPresignedUrl } from '../../services/contentAssetService';
import { bookmarkService } from '../../services/bookmarkService';
import { questionService } from '../../services/questionService';
import type { Question } from '../../types/question';
import type { BookmarkResponse } from '../../types/bookmark';
import type { BookmarkCollection } from '../../services/bookmarkService';

const MAX_COVER_SIZE = 10 * 1024 * 1024; // 10 MB
const PREVIEW_LENGTH = 250;

type BookmarkItem = BookmarkResponse & { addedAt?: string };

const formatDate = (dateStr: string, lang: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const getMoveTargets = (
  allCollections: BookmarkCollection[],
  collection: BookmarkCollection,
  rootLabel: string
): { id: string | null; name: string }[] => {
  const excludeFolderId = collection._id;
  const currentParentId = collection.parent_id ?? null;
  const descendants = new Set<string>();
  const collectDescendants = (id: string) => {
    allCollections.filter((c) => c.parent_id === id).forEach((c) => {
      descendants.add(c._id);
      collectDescendants(c._id);
    });
  };
  collectDescendants(excludeFolderId);
  const targets: { id: string | null; name: string }[] = [{ id: null, name: rootLabel }];
  allCollections
    .filter(
      (c) =>
        c._id !== excludeFolderId &&
        !descendants.has(c._id) &&
        c._id !== currentParentId
    )
    .forEach((c) => targets.push({ id: c._id, name: c.name }));
  return targets;
};

/** Recursive folder tree */
const FolderTreeItem: React.FC<{
  collection: BookmarkCollection;
  allCollections: BookmarkCollection[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onMoveFolder: (folderId: string, targetParentId: string | null) => void;
  rootLabel: string;
  depth: number;
}> = ({ collection, allCollections, selectedId, onSelect, onMoveFolder, rootLabel, depth }) => {
  const children = allCollections.filter((c) => c.parent_id === collection._id);
  const isSelected = selectedId === collection._id;
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const moveTargets = useMemo(
    () => getMoveTargets(allCollections, collection, rootLabel),
    [allCollections, collection, rootLabel]
  );

  return (
    <>
      <ListItemButton
        selected={isSelected}
        onClick={() => onSelect(collection._id)}
        sx={{ py: 1.25, pl: 2 + depth * 2, pr: 0.5, justifyContent: 'flex-start' }}
      >
        {isSelected ? (
          <FolderOpen sx={{ mr: 1.5, color: 'primary.main' }} fontSize="small" />
        ) : (
          <Folder sx={{ mr: 1.5, color: 'text.secondary' }} fontSize="small" />
        )}
        <ListItemText
          primary={collection.name}
          primaryTypographyProps={{ variant: 'body1', fontSize: '1rem', fontWeight: isSelected ? 600 : 400 }}
        />
        <IconButton
          size="small"
          onClick={(e) => { e.stopPropagation(); setMenuAnchor(e.currentTarget); }}
          sx={{ ml: 0.5 }}
        >
          <MoreVert fontSize="small" />
        </IconButton>
      </ListItemButton>
      <Menu
        anchorEl={menuAnchor}
        open={!!menuAnchor}
        onClose={() => setMenuAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {moveTargets.map((t) => (
          <MenuItem
            key={t.id ?? 'root'}
            onClick={() => {
              onMoveFolder(collection._id, t.id);
              setMenuAnchor(null);
            }}
          >
            <DriveFileMove sx={{ mr: 1 }} fontSize="small" />
            {t.name}
          </MenuItem>
        ))}
      </Menu>
      {children.map((child) => (
        <FolderTreeItem
          key={child._id}
          collection={child}
          allCollections={allCollections}
          selectedId={selectedId}
          onSelect={onSelect}
          onMoveFolder={onMoveFolder}
          rootLabel={rootLabel}
          depth={depth + 1}
        />
      ))}
    </>
  );
};

/** Sortable table row */
const SortableRow: React.FC<{
  item: BookmarkItem;
  authorId: string | undefined;
  authorName: string;
  currentLanguage: string;
  onItemClick: (b: BookmarkResponse) => void;
  onMenuOpen: (e: React.MouseEvent, b: BookmarkResponse) => void;
}> = ({
  item,
  authorId,
  authorName,
  currentLanguage,
  onItemClick,
  onMenuOpen,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const questionSummary = (item.target_data?.title ?? '').slice(0, PREVIEW_LENGTH) + ((item.target_data?.title ?? '').length > PREVIEW_LENGTH ? '...' : '');
  const contentDisplay = stripRefLinksForDisplay(
    item.target_type === 'query' && item.notes
      ? item.notes
      : item.target_data?.content ?? ''
  );
  const detail = contentDisplay.slice(0, PREVIEW_LENGTH) + (contentDisplay.length > PREVIEW_LENGTH ? '...' : '');
  const typeLabel =
    item.target_type === 'question'
      ? t('bookmark_type_question', currentLanguage)
      : item.target_type === 'query'
        ? t('bookmark_type_query', currentLanguage)
        : t('bookmark_type_answer', currentLanguage);
  const addedAt = item.addedAt || item.createdAt;

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      hover
      sx={{
        cursor: 'pointer',
        '&:hover': { bgcolor: (th) => (th.palette.mode === 'dark' ? 'action.hover' : 'grey.50') },
      }}
      onClick={() => onItemClick(item)}
    >
      <TableCell sx={{ py: 1, width: 40, px: 0.5 }} onClick={(e) => e.stopPropagation()} {...attributes} {...listeners}>
        <DragIndicator sx={{ color: 'text.disabled', cursor: 'grab' }} fontSize="small" />
      </TableCell>
      <TableCell sx={{ py: 1.5, width: 200, px: 1.5 }} onClick={(e) => e.stopPropagation()}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <UserAvatarById
            userId={authorId}
            fallbackName={authorName}
            sx={{ width: 40, height: 40, flexShrink: 0 }}
          />
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {authorName}
          </Typography>
        </Box>
      </TableCell>
      <TableCell sx={{ py: 1.5, width: 100, px: 1.5 }}>{typeLabel}</TableCell>
      <TableCell sx={{ py: 1.5, width: 220, px: 1.5 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
          {questionSummary}
        </Typography>
      </TableCell>
      <TableCell sx={{ py: 1.5, width: 220, px: 1.5 }}>
        <Typography variant="caption" color="text.secondary" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
          {detail}
        </Typography>
      </TableCell>
      <TableCell sx={{ py: 1.5, width: 200, px: 1.5 }}>{formatDate(addedAt, currentLanguage)}</TableCell>
      <TableCell sx={{ py: 0.5, width: 48, px: 0.5 }} align="right" onClick={(e) => e.stopPropagation()}>
        <IconButton size="small" onClick={(e) => { e.stopPropagation(); onMenuOpen(e, item); }}>
          <MoreVert fontSize="small" />
        </IconButton>
      </TableCell>
    </TableRow>
  );
};

const FOCUS_LIST_ID = 'focus-10';
const GUNDEM_COVER = `${process.env.PUBLIC_URL}/gundem-cover.jpg`;

type DateFilterOp = 'equals' | 'greater_than' | 'less_than' | 'between';

function matchesListedDate(dateStr: string, op: DateFilterOp, val: string, val2: string): boolean {
  if (!val && !(op === 'between' && val2)) return true;
  const ts = (d: string) => new Date(d).getTime();
  const itemTs = new Date(dateStr).getTime();
  const d1 = val ? ts(`${val}T00:00:00`) : 0;
  const d2 = val2 ? ts(`${val2}T23:59:59`) : 0;
  if (op === 'equals') return val ? itemTs >= d1 && itemTs <= ts(`${val}T23:59:59`) : true;
  if (op === 'greater_than') return d1 ? itemTs > d1 : true;
  if (op === 'less_than') return d1 ? itemTs < d1 : true;
  if (op === 'between') return Boolean(d1 && d2 && itemTs >= d1 && itemTs <= d2);
  return true;
}

const BookmarkDetail = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const folderFromUrl = searchParams.get('folder');
  const dispatch = useAppDispatch();
  const { currentLanguage } = useAppSelector((s) => s.language);
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const { collections, itemsByCollection, bookmarkCollectionIds, loading } = useAppSelector((s) => s.bookmarkCollections);
  const user = useAppSelector((s) => s.auth.user);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [moveAnchor, setMoveAnchor] = useState<{ el: HTMLElement; item: BookmarkResponse } | null>(null);
  const [addAnchor, setAddAnchor] = useState<{ el: HTMLElement; item: BookmarkResponse } | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shares, setShares] = useState<Array<{ id: string; token: string; description: string; createdAt: string; revokedAt: string | null }>>([]);
  const [shareDescription, setShareDescription] = useState('');
  const [shareCreating, setShareCreating] = useState(false);
  const [rowMenuAnchor, setRowMenuAnchor] = useState<{ el: HTMLElement; item: BookmarkResponse } | null>(null);
  const [filterOwner, setFilterOwner] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterQuestionSummary, setFilterQuestionSummary] = useState('');
  const [filterDetail, setFilterDetail] = useState('');
  const [filterDateOp, setFilterDateOp] = useState<'equals' | 'greater_than' | 'less_than' | 'between'>('equals');
  const [filterDateVal, setFilterDateVal] = useState('');
  const [filterDateVal2, setFilterDateVal2] = useState('');
  const [orderedIds, setOrderedIds] = useState<string[]>([]);
  const [focusQuestions, setFocusQuestions] = useState<Question[]>([]);
  const [focusLoading, setFocusLoading] = useState(false);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderParentId, setNewFolderParentId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAuthenticated) dispatch(fetchCollections());
  }, [isAuthenticated, dispatch]);

  useEffect(() => {
    if (folderFromUrl === FOCUS_LIST_ID) {
      setSelectedId(FOCUS_LIST_ID);
      return;
    }
    if (folderFromUrl && collections.some((c) => c._id === folderFromUrl)) {
      setSelectedId(folderFromUrl);
    }
  }, [folderFromUrl, collections]);

  useEffect(() => {
    if (selectedId && selectedId !== FOCUS_LIST_ID) dispatch(fetchCollectionItems(selectedId));
  }, [selectedId, dispatch]);

  useEffect(() => {
    if (selectedId !== FOCUS_LIST_ID || !user?.id) return;
    let cancelled = false;
    setFocusLoading(true);
    questionService
      .getQuestionsByUser(user.id, 1, 100, 'desc', 10)
      .then(result => {
        if (!cancelled) setFocusQuestions(result.data);
      })
      .catch(() => {
        if (!cancelled) setFocusQuestions([]);
      })
      .finally(() => {
        if (!cancelled) setFocusLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId, user?.id]);

  const handleSelectFolder = (id: string) => {
    setSelectedId(id);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('folder', id);
      return next;
    });
  };

  const selected = selectedId ? collections.find((c) => c._id === selectedId) : null;
  const rawItems = useMemo(
    () => (selectedId ? itemsByCollection[selectedId] ?? [] : []) as BookmarkItem[],
    [selectedId, itemsByCollection]
  );
  const ownerOptions = useMemo(() => {
    const seen = new Set<string>();
    return rawItems
      .map((b) => b.target_data?.author ?? '')
      .filter((a) => a && !seen.has(a) && (seen.add(a), true));
  }, [rawItems]);

  // Sync orderedIds when rawItems change
  useEffect(() => {
    if (rawItems.length === 0) {
      setOrderedIds([]);
      return;
    }
    const ids = rawItems.map((b) => b._id);
    setOrderedIds((prev) => {
      const existing = new Set(prev);
      const newIds = ids.filter((id) => !existing.has(id));
      const kept = prev.filter((id) => ids.includes(id));
      return [...kept, ...newIds];
    });
  }, [selectedId, rawItems]);

  // Resolve cover URL
  useEffect(() => {
    if (!selected?.cover_photo_key || !user?.id) {
      setCoverUrl(null);
      return;
    }
    contentAssetService
      .resolveAssetUrl({
        key: selected.cover_photo_key,
        type: 'bookmark-collection-cover',
        ownerId: user.id,
        entityId: selected._id,
        visibility: 'public',
        presignedUrl: false,
      })
      .then(setCoverUrl)
      .catch(() => setCoverUrl(null));
  }, [selected?.cover_photo_key, selected?._id, user?.id]);

  // Apply order and filters
  const items = useMemo(() => {
    let list = rawItems;
    if (orderedIds.length > 0) {
      const idToItem = Object.fromEntries(rawItems.map((b) => [b._id, b]));
      list = orderedIds.map((id) => idToItem[id]).filter(Boolean);
    }
    if (filterOwner.trim()) {
      const q = filterOwner.trim().toLowerCase();
      list = list.filter((b) => (b.target_data?.author ?? '').toLowerCase().includes(q));
    }
    if (filterType) {
      list = list.filter((b) => b.target_type === filterType);
    }
    if (filterQuestionSummary.trim()) {
      const q = filterQuestionSummary.trim().toLowerCase();
      list = list.filter((b) => (b.target_data?.title ?? '').toLowerCase().includes(q));
    }
    if (filterDetail.trim()) {
      const q = filterDetail.trim().toLowerCase();
      list = list.filter((b) => (b.target_data?.content ?? '').toLowerCase().includes(q));
    }
    if (filterDateVal || (filterDateOp === 'between' && filterDateVal2)) {
      list = list.filter((b) => {
        const addedAt = (b as BookmarkItem).addedAt || b.createdAt;
        return matchesListedDate(addedAt, filterDateOp, filterDateVal, filterDateVal2);
      });
    }
    return list;
  }, [rawItems, orderedIds, filterOwner, filterType, filterQuestionSummary, filterDetail, filterDateOp, filterDateVal, filterDateVal2]);

  const focusOwnerOptions = useMemo(() => {
    const seen = new Set<string>();
    return focusQuestions
      .map((question) => question.author?.name ?? '')
      .filter((name) => name && !seen.has(name) && (seen.add(name), true));
  }, [focusQuestions]);

  const visibleFocusQuestions = useMemo(() => {
    let list = focusQuestions;
    if (filterOwner.trim()) {
      const q = filterOwner.trim().toLowerCase();
      list = list.filter((question) => (question.author?.name ?? '').toLowerCase().includes(q));
    }
    if (filterType && filterType !== 'question') list = [];
    if (filterQuestionSummary.trim()) {
      const q = filterQuestionSummary.trim().toLowerCase();
      list = list.filter((question) => question.summary.toLowerCase().includes(q));
    }
    if (filterDetail.trim()) {
      const q = filterDetail.trim().toLowerCase();
      list = list.filter((question) => stripRefLinksForDisplay(question.detail).toLowerCase().includes(q));
    }
    if (filterDateVal || (filterDateOp === 'between' && filterDateVal2)) {
      list = list.filter((question) => matchesListedDate(question.createdAt, filterDateOp, filterDateVal, filterDateVal2));
    }
    return list;
  }, [focusQuestions, filterOwner, filterType, filterQuestionSummary, filterDetail, filterDateOp, filterDateVal, filterDateVal2]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !selectedId) return;
    const ids = orderedIds.length ? orderedIds : rawItems.map((b) => b._id);
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    const newOrder = arrayMove(ids, oldIndex, newIndex);
    setOrderedIds(newOrder);
    dispatch(reorderCollectionItemsThunk({ collectionId: selectedId, bookmarkIds: newOrder }));
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedId || !user?.id) return;
    if (!file.type.startsWith('image/') || file.size > MAX_COVER_SIZE) {
      showErrorToast(t('bookmark_cover_upload_failed', currentLanguage));
      return;
    }
    try {
      setCoverUploading(true);
      const presigned = await contentAssetService.createPresignedUpload({
        type: 'bookmark-collection-cover',
        filename: file.name,
        mimeType: file.type,
        contentLength: file.size,
        ownerId: user.id,
        entityId: selectedId,
        visibility: 'public',
      });
      await uploadFileToPresignedUrl(presigned, file);
      await dispatch(
        updateCollectionThunk({ collectionId: selectedId, payload: { coverPhotoKey: presigned.key } })
      ).unwrap();
      setCoverUrl(
        await contentAssetService.resolveAssetUrl({
          key: presigned.key,
          type: 'bookmark-collection-cover',
          ownerId: user.id,
          entityId: selectedId,
          visibility: 'public',
          presignedUrl: false,
        })
      );
      showSuccessToast(t('bookmark_cover_uploaded', currentLanguage));
    } catch (err: any) {
      showErrorToast(err?.message || t('bookmark_cover_upload_failed', currentLanguage));
    } finally {
      setCoverUploading(false);
      e.target.value = '';
    }
  };

  const handleItemClick = (b: BookmarkResponse) => {
    if (b.target_type === 'query') {
      navigate(`/query?bookmarkId=${b._id}`);
      return;
    }
    if (b.target_type === 'question') navigate(`/questions/${b.target_id}`);
    else {
      const url = (b.target_data as any)?.url ?? '';
      const qId = url.match(/\/questions\/([^/#]+)/)?.[1];
      navigate(qId ? `/questions/${qId}#answer-${b.target_id}` : '/questions');
    }
  };

  const handleRemove = async (bookmarkId: string) => {
    if (!selectedId) return;
    try {
      await dispatch(removeFromCollectionThunk({ collectionId: selectedId, bookmarkId })).unwrap();
      showSuccessToast(t('bookmark_removed_from_list', currentLanguage));
      setRowMenuAnchor(null);
    } catch (err: any) {
      showErrorToast(err?.message || 'Failed');
    }
  };

  const handleMoveTo = async (targetCollectionId: string) => {
    if (!moveAnchor || !selectedId) return;
    const { item } = moveAnchor;
    try {
      await dispatch(addToCollectionThunk({ collectionId: targetCollectionId, bookmarkId: item._id })).unwrap();
      await dispatch(removeFromCollectionThunk({ collectionId: selectedId, bookmarkId: item._id })).unwrap();
      showSuccessToast(t('bookmark_moved_to_folder', currentLanguage));
      setMoveAnchor(null);
      setRowMenuAnchor(null);
    } catch (err: any) {
      showErrorToast(err?.message || 'Failed');
    }
  };

  const handleAddTo = async (targetCollectionId: string) => {
    if (!addAnchor) return;
    const { item } = addAnchor;
    try {
      await dispatch(addToCollectionThunk({ collectionId: targetCollectionId, bookmarkId: item._id })).unwrap();
      showSuccessToast(t('bookmark_added_to_folder', currentLanguage));
      setAddAnchor(null);
      setRowMenuAnchor(null);
    } catch (err: any) {
      showErrorToast(err?.message || 'Failed');
    }
  };

  const handleCreateFolder = async () => {
    const name = newFolderName.trim();
    if (!name) return;
    try {
      await dispatch(createCollectionThunk({ name, parent_id: newFolderParentId })).unwrap();
      showSuccessToast(t('bookmark_folder_created', currentLanguage));
      setCreateFolderOpen(false);
      setNewFolderName('');
      setNewFolderParentId(null);
    } catch (err: any) {
      showErrorToast(err?.message || t('bookmark_folder_create_failed', currentLanguage));
    }
  };

  const handleMoveFolder = async (folderId: string, targetParentId: string | null) => {
    try {
      await dispatch(updateCollectionThunk({ collectionId: folderId, payload: { parent_id: targetParentId } })).unwrap();
      showSuccessToast(t('bookmark_moved_to_folder', currentLanguage));
    } catch (err: any) {
      showErrorToast(err?.message || 'Failed to move folder');
    }
  };

  const handleOpenNew = (b: BookmarkResponse) => {
    if (b.target_type === 'query') {
      window.open(`${window.location.origin}/query?bookmarkId=${b._id}`, '_blank');
      return;
    }
    if (b.target_type === 'question') {
      window.open(`${window.location.origin}/questions/${b.target_id}`, '_blank');
    } else {
      const url = (b.target_data as any)?.url ?? '';
      const qId = url.match(/\/questions\/([^/#]+)/)?.[1];
      window.open(
        qId ? `${window.location.origin}/questions/${qId}#answer-${b.target_id}` : `${window.location.origin}/questions`,
        '_blank'
      );
    }
  };

  if (!isAuthenticated) {
    return (
      <Layout>
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">{t('no_bookmarks', currentLanguage)}</Typography>
        </Box>
      </Layout>
    );
  }

  const roots = collections.filter((c) => !c.parent_id || c.parent_id === '');

  return (
    <Layout fullWidth>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: 'calc(100vh - 64px)',
          bgcolor: 'background.default',
          width: '100%',
          maxWidth: '100%',
        }}
      >
        {/* Kapak - tıklanabilir: kapak varsa fotoğrafa tıkla değiştir, yoksa ekle butonu */}
        <Box
          sx={{
            height: 160,
            bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.100',
            position: 'relative',
            overflow: 'hidden',
            cursor: selectedId && selectedId !== FOCUS_LIST_ID && !coverUploading ? 'pointer' : 'default',
          }}
          onClick={() => selectedId && selectedId !== FOCUS_LIST_ID && !coverUploading && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleCoverUpload}
            disabled={coverUploading || !selectedId || selectedId === FOCUS_LIST_ID}
          />
          {selectedId === FOCUS_LIST_ID ? (
            <Box
              component="img"
              src={GUNDEM_COVER}
              alt=""
              sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : coverUrl ? (
            <Box
              component="img"
              src={coverUrl}
              alt=""
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: coverUploading ? 0.6 : 1,
              }}
            />
          ) : (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {coverUploading ? (
                <CircularProgress size={32} />
              ) : (
                <Tooltip title={t('bookmark_cover_upload', currentLanguage)}>
                  <AddPhotoAlternate sx={{ fontSize: 48, color: 'text.disabled' }} />
                </Tooltip>
              )}
            </Box>
          )}
          {coverUrl && selectedId !== FOCUS_LIST_ID && !coverUploading && (
            <Tooltip title={t('bookmark_cover_change', currentLanguage)}>
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.15)' },
                }}
              />
            </Tooltip>
          )}
        </Box>

        <Box sx={{ display: 'flex', flex: 1, minHeight: 0, width: '100%' }}>
          {/* Sol */}
          <Box
            sx={{
              width: 280,
              flexShrink: 0,
              borderRight: (th) => `1px solid ${th.palette.divider}`,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Box sx={{ p: 2, borderBottom: (th) => `1px solid ${th.palette.divider}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
              <Typography variant="h6" fontWeight={600} sx={{ fontSize: '1.1rem' }}>
                {t('bookmarks_title', currentLanguage)}
              </Typography>
              <Tooltip title={t('bookmark_create_new_folder', currentLanguage)}>
                <IconButton size="small" onClick={() => { setNewFolderParentId(null); setNewFolderName(''); setCreateFolderOpen(true); }} color="primary">
                  <CreateNewFolder />
                </IconButton>
              </Tooltip>
            </Box>
            <List dense disablePadding sx={{ flex: 1 }}>
              <ListItemButton
                selected={selectedId === FOCUS_LIST_ID}
                onClick={() => handleSelectFolder(FOCUS_LIST_ID)}
              >
                <ListItemText primary={t('focus_10_list', currentLanguage)} />
              </ListItemButton>
              {loading && collections.length === 0 ? (
                <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
                  <CircularProgress size={24} />
                </Box>
              ) : collections.length === 0 ? (
                <Box sx={{ p: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    {t('bookmark_empty_folder', currentLanguage)}
                  </Typography>
                </Box>
              ) : (
                roots.map((c) => (
                  <FolderTreeItem
                    key={c._id}
                    collection={c}
                    allCollections={collections}
                    selectedId={selectedId}
                    onSelect={handleSelectFolder}
                    onMoveFolder={handleMoveFolder}
                    rootLabel={t('bookmark_root_folder', currentLanguage)}
                    depth={0}
                  />
                ))
              )}
            </List>
          </Box>

          {/* Sağ */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
            {selectedId === FOCUS_LIST_ID ? (
              <>
                <Box sx={{ px: 3, py: 2, borderBottom: (th) => `1px solid ${th.palette.divider}` }}>
                  <Typography variant="h5" fontWeight={600}>
                    {t('focus_10_list', currentLanguage)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('focus_10_description', currentLanguage)}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                  {focusLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                      <CircularProgress size={32} />
                    </Box>
                  ) : (
                    <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: '100%' }}>
                      <Table stickyHeader size="small" sx={{ tableLayout: 'fixed', width: '100%', minWidth: 900 }}>
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600, width: 200, verticalAlign: 'top', px: 1.5 }}>
                              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                                {t('bookmark_owner', currentLanguage)}
                              </Typography>
                              <Autocomplete
                                size="small"
                                options={focusOwnerOptions}
                                value={filterOwner && focusOwnerOptions.includes(filterOwner) ? filterOwner : null}
                                inputValue={filterOwner}
                                onInputChange={(_, v) => setFilterOwner(v)}
                                onChange={(_, v) => setFilterOwner(v ?? '')}
                                freeSolo
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    placeholder={t('bookmark_filter_owner', currentLanguage)}
                                    sx={{ '& .MuiInputBase-root': { fontSize: '0.8rem' } }}
                                  />
                                )}
                              />
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600, width: 100, verticalAlign: 'top', px: 1.5 }}>
                              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                                {t('bookmark_type', currentLanguage)}
                              </Typography>
                              <FormControl size="small" fullWidth>
                                <Select
                                  value={filterType}
                                  onChange={(e) => setFilterType(e.target.value)}
                                  displayEmpty
                                  sx={{ fontSize: '0.8rem', minHeight: 40 }}
                                >
                                  <MenuItem value="">{t('bookmark_type_all', currentLanguage)}</MenuItem>
                                  <MenuItem value="question">{t('bookmark_type_question', currentLanguage)}</MenuItem>
                                  <MenuItem value="answer">{t('bookmark_type_answer', currentLanguage)}</MenuItem>
                                  <MenuItem value="query">{t('bookmark_type_query', currentLanguage)}</MenuItem>
                                </Select>
                              </FormControl>
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600, width: 220, verticalAlign: 'top', px: 1.5 }}>
                              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                                {t('bookmark_question_summary', currentLanguage)}
                              </Typography>
                              <TextField
                                size="small"
                                placeholder={t('bookmark_filter_question_summary', currentLanguage)}
                                value={filterQuestionSummary}
                                onChange={(e) => setFilterQuestionSummary(e.target.value)}
                                fullWidth
                                sx={{ '& .MuiInputBase-root': { fontSize: '0.8rem' } }}
                              />
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600, width: 220, verticalAlign: 'top', px: 1.5 }}>
                              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                                {t('bookmark_detail', currentLanguage)}
                              </Typography>
                              <TextField
                                size="small"
                                placeholder={t('bookmark_filter_detail', currentLanguage)}
                                value={filterDetail}
                                onChange={(e) => setFilterDetail(e.target.value)}
                                fullWidth
                                sx={{ '& .MuiInputBase-root': { fontSize: '0.8rem' } }}
                              />
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600, width: 200, verticalAlign: 'top', px: 1.5 }}>
                              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                                {t('bookmark_added_at', currentLanguage)}
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                                <FormControl size="small" sx={{ minWidth: 90 }}>
                                  <Select
                                    value={filterDateOp}
                                    onChange={(e) => setFilterDateOp(e.target.value as DateFilterOp)}
                                    sx={{ fontSize: '0.8rem', minHeight: 40 }}
                                  >
                                    <MenuItem value="equals">{t('date_operator_exact', currentLanguage)}</MenuItem>
                                    <MenuItem value="greater_than">{t('date_operator_after', currentLanguage)}</MenuItem>
                                    <MenuItem value="less_than">{t('date_operator_before', currentLanguage)}</MenuItem>
                                    <MenuItem value="between">{t('date_operator_between', currentLanguage)}</MenuItem>
                                  </Select>
                                </FormControl>
                                <TextField
                                  size="small"
                                  type="date"
                                  value={filterDateVal}
                                  onChange={(e) => setFilterDateVal(e.target.value)}
                                  InputLabelProps={{ shrink: true }}
                                  sx={{
                                    flex: 1,
                                    minWidth: 120,
                                    '& .MuiInputBase-root': { fontSize: '0.8rem' },
                                    '& input::-webkit-calendar-picker-indicator': {
                                      filter: theme.palette.mode === 'dark' ? 'invert(1)' : 'none',
                                    },
                                  }}
                                />
                                {filterDateOp === 'between' && (
                                  <TextField
                                    size="small"
                                    type="date"
                                    value={filterDateVal2}
                                    onChange={(e) => setFilterDateVal2(e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                    sx={{
                                      flex: 1,
                                      minWidth: 120,
                                      '& .MuiInputBase-root': { fontSize: '0.8rem' },
                                      '& input::-webkit-calendar-picker-indicator': {
                                        filter: theme.palette.mode === 'dark' ? 'invert(1)' : 'none',
                                      },
                                    }}
                                  />
                                )}
                              </Box>
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {visibleFocusQuestions.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} sx={{ py: 4, textAlign: 'center' }}>
                                <Typography variant="body2" color="text.secondary">
                                  {focusQuestions.length === 0
                                    ? t('focus_10_empty', currentLanguage)
                                    : t('bookmark_no_matching', currentLanguage)}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ) : (
                            visibleFocusQuestions.map((question) => {
                              const detailText = stripRefLinksForDisplay(question.detail);
                              const summary = question.summary.slice(0, PREVIEW_LENGTH) + (question.summary.length > PREVIEW_LENGTH ? '...' : '');
                              const detail = detailText.slice(0, PREVIEW_LENGTH) + (detailText.length > PREVIEW_LENGTH ? '...' : '');
                              return (
                                <TableRow
                                  key={question.id}
                                  hover
                                  sx={{
                                    cursor: 'pointer',
                                    '&:hover': { bgcolor: (th) => (th.palette.mode === 'dark' ? 'action.hover' : 'grey.50') },
                                  }}
                                  onClick={() => navigate(`/questions/${question.id}`)}
                                >
                                  <TableCell sx={{ py: 1.5, width: 200, px: 1.5 }} onClick={(e) => e.stopPropagation()}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                      <UserAvatarById
                                        userId={question.author?.id}
                                        fallbackName={question.author?.name || '—'}
                                        sx={{ width: 40, height: 40, flexShrink: 0 }}
                                      />
                                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                        {question.author?.name || '—'}
                                      </Typography>
                                    </Box>
                                  </TableCell>
                                  <TableCell sx={{ py: 1.5, width: 100, px: 1.5 }}>
                                    {t('bookmark_type_question', currentLanguage)}
                                  </TableCell>
                                  <TableCell sx={{ py: 1.5, width: 220, px: 1.5 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                                      {summary}
                                    </Typography>
                                  </TableCell>
                                  <TableCell sx={{ py: 1.5, width: 220, px: 1.5 }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                                      {detail}
                                    </Typography>
                                  </TableCell>
                                  <TableCell sx={{ py: 1.5, width: 200, px: 1.5 }}>
                                    {formatDate(question.createdAt, currentLanguage)}
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>
              </>
            ) : !selectedId ? (
              <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  {t('bookmark_select_folder', currentLanguage)}
                </Typography>
              </Box>
            ) : (
              <>
                <Box sx={{ px: 3, py: 2, borderBottom: (th) => `1px solid ${th.palette.divider}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
                  <Typography variant="h5" fontWeight={600}>
                    {selected?.name ?? ''}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={selected?.is_public ?? false}
                          onChange={async (e) => {
                            if (!selectedId) return;
                            const nextPublic = e.target.checked;
                            try {
                              await dispatch(updateCollectionThunk({ collectionId: selectedId, payload: { isPublic: nextPublic } })).unwrap();
                              showSuccessToast(nextPublic ? t('bookmark_visibility_public', currentLanguage) : t('bookmark_visibility_private', currentLanguage));
                            } catch (err: any) {
                              showErrorToast(err?.message || 'Failed');
                            }
                          }}
                          color="primary"
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {selected?.is_public ? <Public fontSize="small" /> : <Lock fontSize="small" />}
                          <Typography variant="body2">
                            {selected?.is_public ? t('bookmark_visibility_public', currentLanguage) : t('bookmark_visibility_private', currentLanguage)}
                          </Typography>
                        </Box>
                      }
                    />
                    <Tooltip title={t('bookmark_share', currentLanguage)}>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setShareDialogOpen(true);
                          setShareDescription('');
                          if (selectedId) {
                            bookmarkService.getShares(selectedId).then(setShares).catch(() => setShares([]));
                          }
                        }}
                      >
                        <Share />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                  {loading && rawItems.length === 0 ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                      <CircularProgress size={32} />
                    </Box>
                  ) : (
                    <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: '100%' }}>
                      <Table stickyHeader size="small" sx={{ tableLayout: 'fixed', width: '100%', minWidth: 900 }}>
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ width: 40, p: 0, px: 0.5, verticalAlign: 'top' }} />
                            <TableCell sx={{ fontWeight: 600, width: 200, verticalAlign: 'top', px: 1.5 }}>
                              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                                {t('bookmark_owner', currentLanguage)}
                              </Typography>
                              <Autocomplete
                                size="small"
                                options={ownerOptions}
                                value={filterOwner && ownerOptions.includes(filterOwner) ? filterOwner : null}
                                inputValue={filterOwner}
                                onInputChange={(_, v) => setFilterOwner(v)}
                                onChange={(_, v) => setFilterOwner(v ?? '')}
                                freeSolo
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    placeholder={t('bookmark_filter_owner', currentLanguage)}
                                    sx={{ '& .MuiInputBase-root': { fontSize: '0.8rem' } }}
                                  />
                                )}
                              />
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600, width: 100, verticalAlign: 'top', px: 1.5 }}>
                              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                                {t('bookmark_type', currentLanguage)}
                              </Typography>
                              <FormControl size="small" fullWidth>
                                <Select
                                  value={filterType}
                                  onChange={(e) => setFilterType(e.target.value)}
                                  displayEmpty
                                  sx={{ fontSize: '0.8rem', minHeight: 40 }}
                                >
                                  <MenuItem value="">{t('bookmark_type_all', currentLanguage)}</MenuItem>
                                  <MenuItem value="question">{t('bookmark_type_question', currentLanguage)}</MenuItem>
                                  <MenuItem value="answer">{t('bookmark_type_answer', currentLanguage)}</MenuItem>
                                  <MenuItem value="query">{t('bookmark_type_query', currentLanguage)}</MenuItem>
                                </Select>
                              </FormControl>
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600, width: 220, verticalAlign: 'top', px: 1.5 }}>
                              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                                {t('bookmark_question_summary', currentLanguage)}
                              </Typography>
                              <TextField
                                size="small"
                                placeholder={t('bookmark_filter_question_summary', currentLanguage)}
                                value={filterQuestionSummary}
                                onChange={(e) => setFilterQuestionSummary(e.target.value)}
                                fullWidth
                                sx={{ '& .MuiInputBase-root': { fontSize: '0.8rem' } }}
                              />
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600, width: 220, verticalAlign: 'top', px: 1.5 }}>
                              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                                {t('bookmark_detail', currentLanguage)}
                              </Typography>
                              <TextField
                                size="small"
                                placeholder={t('bookmark_filter_detail', currentLanguage)}
                                value={filterDetail}
                                onChange={(e) => setFilterDetail(e.target.value)}
                                fullWidth
                                sx={{ '& .MuiInputBase-root': { fontSize: '0.8rem' } }}
                              />
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600, width: 200, verticalAlign: 'top', px: 1.5 }}>
                              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                                {t('bookmark_added_at', currentLanguage)}
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                                <FormControl size="small" sx={{ minWidth: 90 }}>
                                  <Select
                                    value={filterDateOp}
                                    onChange={(e) => setFilterDateOp(e.target.value as typeof filterDateOp)}
                                    sx={{ fontSize: '0.8rem', minHeight: 40 }}
                                  >
                                    <MenuItem value="equals">{t('date_operator_exact', currentLanguage)}</MenuItem>
                                    <MenuItem value="greater_than">{t('date_operator_after', currentLanguage)}</MenuItem>
                                    <MenuItem value="less_than">{t('date_operator_before', currentLanguage)}</MenuItem>
                                    <MenuItem value="between">{t('date_operator_between', currentLanguage)}</MenuItem>
                                  </Select>
                                </FormControl>
                                <TextField
                                  size="small"
                                  type="date"
                                  value={filterDateVal}
                                  onChange={(e) => setFilterDateVal(e.target.value)}
                                  InputLabelProps={{ shrink: true }}
                                  sx={{
                                    flex: 1,
                                    minWidth: 120,
                                    '& .MuiInputBase-root': { fontSize: '0.8rem' },
                                    '& input::-webkit-calendar-picker-indicator': {
                                      filter: theme.palette.mode === 'dark' ? 'invert(1)' : 'none',
                                    },
                                  }}
                                />
                                {filterDateOp === 'between' && (
                                  <TextField
                                    size="small"
                                    type="date"
                                    value={filterDateVal2}
                                    onChange={(e) => setFilterDateVal2(e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                    sx={{
                                      flex: 1,
                                      minWidth: 120,
                                      '& .MuiInputBase-root': { fontSize: '0.8rem' },
                                      '& input::-webkit-calendar-picker-indicator': {
                                        filter: theme.palette.mode === 'dark' ? 'invert(1)' : 'none',
                                      },
                                    }}
                                  />
                                )}
                              </Box>
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600, width: 48, verticalAlign: 'top', px: 0.5 }} align="right" />
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {items.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={7} sx={{ py: 4, textAlign: 'center' }}>
                                <Typography variant="body2" color="text.secondary">
                                  {rawItems.length === 0
                                    ? t('bookmark_empty_folder', currentLanguage)
                                    : t('bookmark_no_matching', currentLanguage)}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ) : (
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                              <SortableContext items={items.map((i) => i._id)} strategy={verticalListSortingStrategy}>
                                {items.map((b) => {
                                  const authorName = b.target_data?.author ?? '—';
                                  const authorId = b.target_data?.authorId ?? undefined;

                                  return (
                                    <SortableRow
                                      key={b._id}
                                      item={b}
                                      authorId={authorId}
                                      authorName={authorName}
                                      currentLanguage={currentLanguage}
                                      onItemClick={handleItemClick}
                                      onMenuOpen={(e) => setRowMenuAnchor({ el: e.currentTarget as HTMLElement, item: b })}
                                    />
                                  );
                                })}
                              </SortableContext>
                            </DndContext>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>
              </>
            )}
          </Box>
        </Box>
      </Box>

      {/* Row actions menu (MoreVert) */}
      <Menu
        anchorEl={rowMenuAnchor?.el}
        open={!!rowMenuAnchor}
        onClose={() => setRowMenuAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {rowMenuAnchor && (
          <>
            <MenuItem
              onClick={() => {
                handleOpenNew(rowMenuAnchor.item);
                setRowMenuAnchor(null);
              }}
            >
              <OpenInNew sx={{ mr: 1 }} fontSize="small" />
              {t('open_in_new', currentLanguage)}
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleRemove(rowMenuAnchor.item._id);
              }}
            >
              <DeleteOutline sx={{ mr: 1 }} fontSize="small" color="error" />
              {t('bookmark_remove_from_list', currentLanguage)}
            </MenuItem>
            <MenuItem
              onClick={() => {
                if (rowMenuAnchor) {
                  setMoveAnchor({ el: rowMenuAnchor.el, item: rowMenuAnchor.item });
                  setRowMenuAnchor(null);
                }
              }}
            >
              <DriveFileMove sx={{ mr: 1 }} fontSize="small" />
              {t('bookmark_move_to', currentLanguage)}
            </MenuItem>
            <MenuItem
              onClick={() => {
                if (rowMenuAnchor) {
                  setAddAnchor({ el: rowMenuAnchor.el, item: rowMenuAnchor.item });
                  setRowMenuAnchor(null);
                }
              }}
            >
              <PlaylistAdd sx={{ mr: 1 }} fontSize="small" />
              {t('bookmark_add_to', currentLanguage)}
            </MenuItem>
          </>
        )}
      </Menu>

      {/* Move to folder submenu */}
      <Menu
        anchorEl={moveAnchor?.el}
        open={!!moveAnchor}
        onClose={() => setMoveAnchor(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        {collections
          .filter((c) => c._id !== selectedId)
          .map((c) => (
            <MenuItem key={c._id} onClick={() => handleMoveTo(c._id)}>
              <Folder sx={{ mr: 1 }} fontSize="small" />
              {c.name}
            </MenuItem>
          ))}
        {collections.filter((c) => c._id !== selectedId).length === 0 && (
          <MenuItem disabled>{t('bookmark_select_folder_to_move', currentLanguage)}</MenuItem>
        )}
      </Menu>

      {/* Add to folder submenu */}
      <Menu
        anchorEl={addAnchor?.el}
        open={!!addAnchor}
        onClose={() => setAddAnchor(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        {addAnchor &&
          collections
            .filter(
              (c) =>
                c._id !== selectedId &&
                !(bookmarkCollectionIds[addAnchor.item._id] ?? []).includes(c._id)
            )
            .map((c) => (
              <MenuItem key={c._id} onClick={() => handleAddTo(c._id)}>
                <Folder sx={{ mr: 1 }} fontSize="small" />
                {c.name}
              </MenuItem>
            ))}
        {addAnchor &&
          collections.filter(
            (c) =>
              c._id !== selectedId &&
              !(bookmarkCollectionIds[addAnchor.item._id] ?? []).includes(c._id)
          ).length === 0 && (
            <MenuItem disabled>{t('bookmark_select_folder_to_add', currentLanguage)}</MenuItem>
          )}
      </Menu>

      {/* Share dialog */}
      <Dialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('bookmark_share_dialog_title', currentLanguage)}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label={t('bookmark_share_description', currentLanguage)}
              placeholder={t('bookmark_share_description_placeholder', currentLanguage)}
              value={shareDescription}
              onChange={(e) => setShareDescription(e.target.value)}
              multiline
              rows={2}
              fullWidth
              required
              error={shareCreating && !shareDescription.trim()}
              helperText={shareCreating && !shareDescription.trim() ? t('bookmark_share_description_required', currentLanguage) : undefined}
            />
            <Button
              variant="contained"
              onClick={async () => {
                if (!selectedId || !shareDescription.trim()) return;
                setShareCreating(true);
                try {
                  const share = await bookmarkService.createShare(selectedId, shareDescription.trim());
                  setShares((prev) => [...prev, { ...share, revokedAt: null }]);
                  setShareDescription('');
                  const url = `${window.location.origin}/bookmarks/shared/t/${share.token}`;
                  await navigator.clipboard.writeText(url);
                  showSuccessToast(t('bookmark_link_copied', currentLanguage));
                } catch (err: any) {
                  showErrorToast(err?.response?.data?.error || err?.message || 'Failed');
                } finally {
                  setShareCreating(false);
                }
              }}
              disabled={!shareDescription.trim() || shareCreating}
              startIcon={shareCreating ? <CircularProgress size={20} color="inherit" /> : <Share />}
            >
              {t('bookmark_share_create', currentLanguage)}
            </Button>
            <Typography variant="subtitle2" sx={{ mt: 2, fontWeight: 600 }}>
              {t('bookmark_share_list_title', currentLanguage)}
            </Typography>
            {shares.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                —
              </Typography>
            ) : (
              <List dense disablePadding>
                {shares.map((s) => (
                  <ListItemButton
                    key={s.id}
                    sx={{
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      border: (th) => `1px solid ${th.palette.divider}`,
                      borderRadius: 1,
                      mb: 1,
                      opacity: s.revokedAt ? 0.6 : 1,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <Typography variant="body2" fontWeight={500}>
                        {s.description}
                      </Typography>
                      {!s.revokedAt && (
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title={t('bookmark_link_copied', currentLanguage)}>
                            <IconButton
                              size="small"
                              onClick={async (e) => {
                                e.stopPropagation();
                                const url = `${window.location.origin}/bookmarks/shared/t/${s.token}`;
                                try {
                                  await navigator.clipboard.writeText(url);
                                  showSuccessToast(t('bookmark_link_copied', currentLanguage));
                                } catch {
                                  showErrorToast('Failed to copy');
                                }
                              }}
                            >
                              <ContentCopy fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={t('bookmark_share_revoke', currentLanguage)}>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (!selectedId) return;
                                try {
                                  await bookmarkService.revokeShare(selectedId, s.id);
                                  setShares((prev) =>
                                    prev.map((x) => (x.id === s.id ? { ...x, revokedAt: new Date().toISOString() } : x))
                                  );
                                  showSuccessToast(t('bookmark_share_revoked', currentLanguage));
                                } catch (err: any) {
                                  showErrorToast(err?.response?.data?.error || err?.message || 'Failed');
                                }
                              }}
                            >
                              <LinkOff fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      )}
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(s.createdAt, currentLanguage)}
                      {s.revokedAt ? ` • ${t('bookmark_share_revoked', currentLanguage)}` : ''}
                    </Typography>
                  </ListItemButton>
                ))}
              </List>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setShareDialogOpen(false)}>{t('cancel', currentLanguage)}</Button>
        </DialogActions>
      </Dialog>

      {/* Create folder dialog */}
      <Dialog open={createFolderOpen} onClose={() => setCreateFolderOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{t('bookmark_create_new_folder', currentLanguage)}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label={t('bookmark_folder_name', currentLanguage)}
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
            sx={{ mt: 1 }}
          />
          <FormControl fullWidth sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
              {t('bookmark_select_folder', currentLanguage)}
            </Typography>
            <Select
              value={newFolderParentId ?? ''}
              onChange={(e) => setNewFolderParentId(e.target.value || null)}
              displayEmpty
              size="small"
            >
              <MenuItem value="">{t('bookmark_root_folder', currentLanguage)}</MenuItem>
              {collections.map((c) => (
                <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCreateFolderOpen(false)}>{t('cancel', currentLanguage)}</Button>
          <Button variant="contained" onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
            {t('create', currentLanguage)}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default BookmarkDetail;
