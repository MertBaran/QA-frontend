import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { alpha, useTheme } from '@mui/material/styles';
import { Box, Button, IconButton, Pagination, TextField, Typography } from '@mui/material';
import { ChatBubbleOutline, Delete, Edit, ExpandLess, ExpandMore, ThumbDown, ThumbUp } from '@mui/icons-material';
import ProfileAvatar from '../ui/ProfileAvatar';
import { matchesAny, OwnerRoleLabel, QuestionOwnerReaction } from '../ui/OwnerMarks';
import { t } from '../../utils/translations';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { requestMessageCompose } from '../../store/messaging/messagingSlice';
import ItemsPerPageSelector, { type DateSortOrder } from '../home/ItemsPerPageSelector';
import ReportContentButton from '../ui/ReportContentButton';
import ContentTime from '../ui/ContentTime';
import type { CommentItem } from '../../types/comment';

interface CommentThreadProps {
  comments: CommentItem[];
  currentUserId?: string;
  currentLanguage: string;
  onCreate: (body: string, parentId?: string) => Promise<void>;
  onUpdate: (id: string, body: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onReact?: (id: string, type: 'like' | 'dislike') => Promise<void>;
  questionOwnerId?: string;
  answerOwnerId?: string;
  collapsible?: boolean;
  showHeading?: boolean;
  composeMode?: 'button' | 'line';
  questionId?: string;
  showReport?: boolean;
  /** Cevap yorumları sayfa ve sıralama göstermez; en yeni üstte, kalanı daha fazla göster. */
  listMode?: 'paged' | 'feed';
  /** Hash ile açılan yorumu gömülü panelde dış sayfayı kaydırmadan ortaya alır. */
  onReveal?: (element: HTMLElement) => void;
}

function wasEdited(comment: CommentItem): boolean {
  if (comment.deleted || !comment.editedAt) return false;
  const edited = new Date(comment.editedAt).getTime();
  return !Number.isNaN(edited);
}

/** Üst çizgiyle aynı pikselde duran çeyrek kavis. Düz çizgi bunun içinden geçmez. */
function ThreadElbow({
  top,
  height,
  label,
  onClick,
}: {
  top: number;
  height: number;
  label: string;
  onClick: (event: React.MouseEvent) => void;
}) {
  return (
    <Box
      component="button"
      type="button"
      aria-label={label}
      onClick={onClick}
      sx={{
        position: 'absolute',
        left: -22,
        top,
        width: 18,
        height,
        p: 0,
        border: 0,
        bgcolor: 'transparent',
        color: 'divider',
        cursor: 'pointer',
        lineHeight: 0,
        zIndex: 1,
      }}
    >
      <svg width="18" height={height} viewBox={`0 0 18 ${height}`} aria-hidden="true">
        <path
          d={`M 0.5 0 Q 0.5 ${height} 18 ${height}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        />
      </svg>
    </Box>
  );
}

const CommentThread: React.FC<CommentThreadProps> = ({
  comments,
  currentUserId,
  currentLanguage,
  onCreate,
  onUpdate,
  onDelete,
  onReact,
  questionOwnerId,
  answerOwnerId,
  collapsible = false,
  showHeading = true,
  composeMode = 'button',
  listMode = 'paged',
  questionId,
  showReport = false,
  onReveal,
}) => {
  const dispatch = useAppDispatch();
  const muiTheme = useTheme();
  const themeName = useAppSelector(state => (state as { theme?: { name?: string } }).theme?.name);
  const hoverColor = themeName === 'magnefite'
    ? (muiTheme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280')
    : muiTheme.palette.primary.main;
  const onRevealRef = useRef(onReveal);
  onRevealRef.current = onReveal;
  const rootPreview = 10;
  const replyPreview = 2;
  const [draft, setDraft] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState('');
  const [composing, setComposing] = useState(false);
  const [lineActive, setLineActive] = useState(false);
  const [expanded, setExpanded] = useState(!collapsible);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [dateSort, setDateSort] = useState<DateSortOrder>('newest');
  const [collapsedIds, setCollapsedIds] = useState<Record<string, boolean>>({});
  const [shownRoots, setShownRoots] = useState(rootPreview);
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const openProfile = (event: React.MouseEvent, userId: string) => {
    event.stopPropagation();
    if (event.ctrlKey || event.metaKey || event.button === 1) {
      event.preventDefault();
      window.open(`/profile/${userId}`, '_blank');
      return;
    }
    navigate(`/profile/${userId}`);
  };

  const sortOrder: DateSortOrder = listMode === 'feed' ? 'newest' : dateSort;
  const byDate = (left: CommentItem, right: CommentItem) => {
    const diff = new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
    return sortOrder === 'oldest' ? diff : -diff;
  };
  const repliesOf = (id: string) => comments.filter(comment => comment.parentId === id).sort(byDate);
  const countDescendants = (id: string): number =>
    repliesOf(id).reduce((sum, child) => sum + 1 + countDescendants(child.id), 0);
  const roots = comments
    .filter(comment => !comment.parentId || !comments.some(item => item.id === comment.parentId))
    .sort(byDate);
  const pageCount = Math.max(1, Math.ceil(roots.length / limit));
  const currentPage = Math.min(page, pageCount);
  const visibleRoots = listMode === 'feed'
    ? roots.slice(0, roots.length <= rootPreview ? roots.length : shownRoots)
    : roots.slice((currentPage - 1) * limit, currentPage * limit);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  useEffect(() => {
    const reveal = () => {
      const hash = window.location.hash;
      if (!hash.startsWith('#comment-')) return;
      const commentId = hash.slice('#comment-'.length);
      const byId = new Map(comments.map(comment => [comment.id, comment]));
      if (!byId.has(commentId)) return;

      setExpanded(true);
      const opened: Record<string, boolean> = {};
      let cursor = byId.get(commentId);
      while (cursor?.parentId) {
        opened[cursor.parentId] = true;
        cursor = byId.get(cursor.parentId);
      }
      if (Object.keys(opened).length > 0) {
        setExpandedReplies(previous => ({ ...previous, ...opened }));
        setCollapsedIds(previous => {
          const next = { ...previous };
          Object.keys(opened).forEach(id => {
            next[id] = false;
          });
          return next;
        });
      }

      const sortOrder: DateSortOrder = listMode === 'feed' ? 'newest' : dateSort;
      const rootList = comments
        .filter(comment => !comment.parentId || !comments.some(item => item.id === comment.parentId))
        .sort((left, right) => {
          const diff = new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
          return sortOrder === 'oldest' ? diff : -diff;
        });
      let rootId = commentId;
      let walker = byId.get(commentId);
      while (walker?.parentId && byId.has(walker.parentId)) {
        rootId = walker.parentId;
        walker = byId.get(walker.parentId);
      }
      const rootIndex = rootList.findIndex(item => item.id === rootId);
      if (rootIndex >= 0) {
        if (listMode === 'feed') {
          setShownRoots(shown => Math.max(shown, rootIndex + 1));
        } else {
          setPage(Math.floor(rootIndex / limit) + 1);
        }
      }

      setHighlightedId(commentId);
      window.setTimeout(() => {
        const element = document.getElementById(`comment-${commentId}`);
        if (!element) return;
        if (onRevealRef.current) onRevealRef.current(element);
        else element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const nextUrl = `${window.location.pathname}${window.location.search}`;
        window.history.replaceState(null, '', nextUrl);
        window.setTimeout(() => {
          setHighlightedId(current => (current === commentId ? null : current));
        }, 3000);
      }, 450);
    };

    reveal();
    window.addEventListener('hashchange', reveal);
    return () => window.removeEventListener('hashchange', reveal);
  }, [comments, dateSort, limit, listMode]);

  const submit = async (body: string, parentId?: string) => {
    const trimmed = body.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    try {
      await onCreate(trimmed, parentId);
      if (parentId) {
        setReplyDraft('');
        setReplyTo(null);
        setCollapsedIds(current => ({ ...current, [parentId]: false }));
      } else {
        setDraft('');
        setComposing(false);
        setLineActive(false);
        setPage(dateSort === 'newest' ? 1 : Math.max(1, Math.ceil((roots.length + 1) / limit)));
      }
      setExpanded(true);
    } finally {
      setBusy(false);
    }
  };

  const saveEdit = async (id: string) => {
    const body = editDraft.trim();
    if (!body || busy) return;
    setBusy(true);
    try {
      await onUpdate(id, body);
      setEditingId(null);
      setEditDraft('');
    } finally {
      setBusy(false);
    }
  };

  const renderNode = (comment: CommentItem, parentAuthorId?: string): React.ReactNode => {
    const children = repliesOf(comment.id);
    const repliesOpen = !!expandedReplies[comment.id];
    const visibleChildren = repliesOpen ? children : children.slice(0, replyPreview);
    const hiddenReplies = children.length - visibleChildren.length;
    const branchCollapsed = !!collapsedIds[comment.id];
    const mine = !!currentUserId && comment.userId === currentUserId;
    const editing = editingId === comment.id;
    const liked = !!currentUserId && (comment.likes ?? []).includes(currentUserId);
    const disliked = !!currentUserId && (comment.dislikes ?? []).includes(currentUserId);
    const isQuestionOwner = matchesAny(comment.userId, questionOwnerId);
    const isAnswerOwner = !isQuestionOwner && matchesAny(comment.userId, answerOwnerId);
    const isCommentOwner = !!parentAuthorId && comment.userId === parentAuthorId;
    const ownerTone = isQuestionOwner ? 'primary' : isAnswerOwner ? 'info' : isCommentOwner ? 'warning' : null;
    const highlighted = highlightedId === comment.id;

    const hiddenCount = countDescendants(comment.id);
    const toggleBranch = () =>
      setCollapsedIds(current => ({ ...current, [comment.id]: !current[comment.id] }));

    return (
      <Box key={comment.id} id={`comment-${comment.id}`}>
        <Box sx={{ display: 'flex', alignItems: 'stretch', gap: 1 }}>
        <Box sx={{ width: 28, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
          <Box
            component="button"
            type="button"
            aria-label={comment.authorName}
            onClick={event => openProfile(event, comment.userId)}
            onAuxClick={event => openProfile(event, comment.userId)}
            sx={{
              p: 0,
              border: 0,
              bgcolor: 'transparent',
              cursor: 'pointer',
              lineHeight: 0,
              borderRadius: '50%',
              '& .MuiAvatar-root': {
                border: theme => `2px solid ${theme.palette.primary.main}33`,
                transition: 'border-color 0.2s ease, transform 0.2s ease',
              },
              '&:hover .MuiAvatar-root': {
                borderColor: 'primary.main',
                transform: 'scale(1.05)',
              },
            }}
          >
            <ProfileAvatar
              src={comment.authorAvatar}
              ownerId={comment.userId}
              fallbackName={comment.authorName}
              sx={{ width: 28, height: 28, fontSize: 13 }}
            />
          </Box>
          {children.length > 0 && (
            <Box
              component="button"
              type="button"
              aria-expanded={!branchCollapsed}
              aria-label={branchCollapsed ? `${hiddenCount}` : t('hide_comments', currentLanguage)}
              onClick={toggleBranch}
              sx={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 28,
                bottom: 0,
                p: 0,
                border: 0,
                bgcolor: 'transparent',
                cursor: 'pointer',
              }}
            >
              <Box sx={{ position: 'absolute', left: 14, top: 0, bottom: 0, width: '1px', bgcolor: 'divider' }} />
            </Box>
          )}
        </Box>
        <Box
          data-highlighted={highlighted ? 'true' : undefined}
          sx={{
            position: 'relative',
            flex: 1,
            minWidth: 0,
            pb: showReport ? 3.5 : 0,
            px: highlighted || ownerTone ? 1 : 0,
            py: highlighted || ownerTone ? 0.5 : 0,
            borderRadius: 1,
            bgcolor: ownerTone
              ? theme => alpha(theme.palette[ownerTone].main, theme.palette.mode === 'dark' ? 0.07 : 0.1)
              : 'transparent',
            border: highlighted ? `1px solid ${hoverColor}99` : '1px solid transparent',
            boxShadow: highlighted ? `0 12px 40px ${hoverColor}66` : 'none',
            transform: highlighted ? 'translateY(-4px)' : 'none',
            transition: 'border-color 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
            <Typography
              component="button"
              type="button"
              variant="caption"
              onClick={event => openProfile(event, comment.userId)}
              sx={{
                fontWeight: 600,
                p: 0,
                border: 0,
                bgcolor: 'transparent',
                cursor: 'pointer',
                color: 'text.primary',
                transition: 'color 0.2s ease',
                '&:hover': {
                  color: 'primary.main',
                  textDecoration: 'underline',
                },
              }}
            >
              {comment.authorName}
            </Typography>
            <Typography variant="caption" color="text.secondary" component="span">
              ·{' '}
              <ContentTime
                value={comment.createdAt}
                currentLanguage={currentLanguage}
                variant="caption"
              />
              {wasEdited(comment) ? ` · ${t('comment_edited', currentLanguage)}` : ''}
            </Typography>
            {isQuestionOwner && <OwnerRoleLabel role="question" currentLanguage={currentLanguage} />}
            {isAnswerOwner && <OwnerRoleLabel role="answer" currentLanguage={currentLanguage} />}
            {isCommentOwner && <OwnerRoleLabel role="comment" currentLanguage={currentLanguage} />}
            <QuestionOwnerReaction
              liked={(comment.likes ?? []).some(id => matchesAny(id, questionOwnerId))}
              disliked={(comment.dislikes ?? []).some(id => matchesAny(id, questionOwnerId))}
              currentLanguage={currentLanguage}
            />
          </Box>
          {editing ? (
            <Box>
              <TextField
                value={editDraft}
                onChange={event => setEditDraft(event.target.value.slice(0, 2000))}
                fullWidth
                multiline
                minRows={2}
                size="small"
              />
              <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                <Button size="small" onClick={() => saveEdit(comment.id)} disabled={busy}>
                  {t('save_comment', currentLanguage)}
                </Button>
                <Button
                  size="small"
                  onClick={() => {
                    setEditingId(null);
                    setEditDraft('');
                  }}
                >
                  {t('cancel', currentLanguage)}
                </Button>
              </Box>
            </Box>
          ) : comment.deleted ? (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              {t('comment_deleted', currentLanguage)}
            </Typography>
          ) : (
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {comment.body}
            </Typography>
          )}
          {!comment.deleted && (
          <>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
            {currentUserId && !editing && (
              <Button
                size="small"
                sx={{ minWidth: 0, px: 0.5 }}
                onClick={() => {
                  setReplyTo(comment.id);
                  setReplyDraft('');
                  setComposing(false);
                  setExpanded(true);
                  setCollapsedIds(current => ({ ...current, [comment.id]: false }));
                }}
              >
                {t('make_comment', currentLanguage)}
              </Button>
            )}
            <IconButton
              size="small"
              aria-label={t('comment_like', currentLanguage)}
              onClick={() => onReact?.(comment.id, 'like')}
              sx={{ color: liked ? 'primary.main' : 'text.secondary' }}
            >
              <ThumbUp sx={{ fontSize: 16 }} />
            </IconButton>
            <Typography variant="caption" color="text.secondary">
              {(comment.likes ?? []).length}
            </Typography>
            <IconButton
              size="small"
              aria-label={t('comment_dislike', currentLanguage)}
              onClick={() => onReact?.(comment.id, 'dislike')}
              sx={{ color: disliked ? 'primary.main' : 'text.secondary' }}
            >
              <ThumbDown sx={{ fontSize: 16 }} />
            </IconButton>
            <Typography variant="caption" color="text.secondary">
              {(comment.dislikes ?? []).length}
            </Typography>
            {mine && !editing && (
              <>
                <IconButton
                  size="small"
                  aria-label={t('edit_comment', currentLanguage)}
                  onClick={() => {
                    setEditingId(comment.id);
                    setEditDraft(comment.body);
                  }}
                >
                  <Edit sx={{ fontSize: 16 }} />
                </IconButton>
                <IconButton
                  size="small"
                  aria-label={t('delete_comment', currentLanguage)}
                  onClick={() => onDelete(comment.id)}
                >
                  <Delete sx={{ fontSize: 16 }} />
                </IconButton>
              </>
            )}
            {questionId && currentUserId && comment.userId !== currentUserId && (
              <IconButton
                size="small"
                aria-label={t('send_message', currentLanguage)}
                onClick={() => {
                  dispatch(requestMessageCompose({
                    recipient: {
                      id: comment.userId,
                      name: comment.authorName,
                      profile_image: comment.authorAvatar,
                    },
                    questionId,
                    commentId: comment.id,
                  }));
                }}
              >
                <ChatBubbleOutline sx={{ fontSize: 16 }} />
              </IconButton>
            )}
          </Box>
          {replyTo === comment.id && (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', mt: 0.5, mb: 1 }}>
              <TextField
                value={replyDraft}
                onChange={event => setReplyDraft(event.target.value.slice(0, 2000))}
                placeholder={t('comment_placeholder', currentLanguage)}
                fullWidth
                multiline
                minRows={2}
                size="small"
                inputProps={{ maxLength: 2000 }}
              />
              <Button
                variant="contained"
                size="small"
                onClick={() => submit(replyDraft, comment.id)}
                disabled={busy || !replyDraft.trim()}
              >
                {t('send_comment', currentLanguage)}
              </Button>
            </Box>
          )}
          </>
          )}
          {showReport && <ReportContentButton />}
        </Box>
      </Box>
          {branchCollapsed && children.length > 0 && (
            <Box sx={{ position: 'relative', ml: '36px' }}>
              <ThreadElbow top={0} height={16} label={`${hiddenCount}`} onClick={toggleBranch} />
              <Button
                size="small"
                startIcon={<ChatBubbleOutline sx={{ fontSize: 16 }} />}
                onClick={toggleBranch}
                sx={{ textTransform: 'none', minWidth: 0, ml: 0.5, py: 0 }}
              >
                {hiddenCount}{' '}
                {t(hiddenCount === 1 ? 'comment_noun' : 'comment_noun_plural', currentLanguage)}
              </Button>
            </Box>
          )}
          {!branchCollapsed && children.length > 0 && (
            <Box sx={{ pl: '36px' }}>
              {visibleChildren.map((child, index) => {
                const last = index === visibleChildren.length - 1 && hiddenReplies === 0;
                const nestGap = 16;
                const avatarCenter = 14;
                const toggleChild = (event: React.MouseEvent) => {
                  event.stopPropagation();
                  setCollapsedIds(current => ({ ...current, [child.id]: !current[child.id] }));
                };
                return (
                  <Box key={child.id} sx={{ position: 'relative', pt: `${nestGap}px` }}>
                    <Box
                      onClick={toggleChild}
                      sx={{
                        position: 'absolute',
                        left: -22,
                        top: 0,
                        height: nestGap,
                        width: '1px',
                        bgcolor: 'divider',
                        cursor: 'pointer',
                      }}
                    />
                    <ThreadElbow
                      top={nestGap}
                      height={avatarCenter}
                      label={child.authorName}
                      onClick={toggleChild}
                    />
                    {!last && (
                      <Box
                        onClick={toggleChild}
                        sx={{
                          position: 'absolute',
                          left: -22,
                          top: nestGap + avatarCenter,
                          bottom: 0,
                          width: '1px',
                          bgcolor: 'divider',
                          cursor: 'pointer',
                        }}
                      />
                    )}
                    {renderNode(child, comment.userId)}
                  </Box>
                );
              })}
              {hiddenReplies > 0 && (
                <Button
                  size="small"
                  onClick={() => setExpandedReplies(current => ({ ...current, [comment.id]: true }))}
                  sx={{ textTransform: 'none', mt: 0.5, ml: 0.5 }}
                >
                  {t('show_more_comments', currentLanguage)}
                </Button>
              )}
            </Box>
          )}
      </Box>
    );
  };

  const showComposeButton = !!currentUserId && composeMode === 'button';
  const showHeader = collapsible || showHeading || showComposeButton;

  return (
    <Box sx={{ mt: showHeading ? 2 : 0 }} onClick={event => event.stopPropagation()}>
      {composeMode === 'line' && currentUserId && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <TextField
            value={draft}
            onChange={event => setDraft(event.target.value.slice(0, 2000))}
            onFocus={() => setLineActive(true)}
            onBlur={event => {
              const next = event.relatedTarget;
              if (next instanceof Node && event.currentTarget.parentElement?.contains(next)) return;
              if (!draft.trim()) setLineActive(false);
            }}
            placeholder={t('comment_line_placeholder', currentLanguage)}
            fullWidth
            size="small"
            inputProps={{ maxLength: 2000 }}
            sx={{ '& .MuiInputBase-root': { height: 40 } }}
          />
          {lineActive && (
            <Button
              variant="contained"
              size="small"
              onClick={() => submit(draft)}
              disabled={busy || !draft.trim()}
              sx={{ flexShrink: 0, whiteSpace: 'nowrap' }}
            >
              {t('make_comment', currentLanguage)}
            </Button>
          )}
        </Box>
      )}
      {showHeader && (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {showComposeButton && (
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                setComposing(value => !value);
                setReplyTo(null);
                setExpanded(true);
              }}
            >
              {t('make_comment', currentLanguage)}
            </Button>
          )}
          {collapsible ? (
            <Button
              size="small"
              aria-expanded={expanded}
              onClick={() => setExpanded(value => !value)}
              startIcon={expanded ? <ExpandLess /> : <ExpandMore />}
              sx={{ textTransform: 'none', color: 'text.primary', fontWeight: 600, px: 0.5, minWidth: 0 }}
            >
              {showHeading ? `${t('comments', currentLanguage)} (${comments.filter(item => !item.deleted).length})` : t('comments', currentLanguage)}
            </Button>
          ) : showHeading ? (
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {t('comments', currentLanguage)} ({comments.filter(item => !item.deleted).length})
            </Typography>
          ) : null}
        </Box>
      </Box>
      )}

      {expanded && listMode === 'paged' && (
        <ItemsPerPageSelector
          variant="compact"
          itemsPerPage={limit}
          totalQuestions={roots.length}
          onItemsPerPageChange={event => {
            setLimit(parseInt(event.target.value, 10));
            setPage(1);
          }}
          currentLanguage={currentLanguage}
          dateSort={dateSort}
          onDateSortChange={event => {
            setDateSort(event.target.value as DateSortOrder);
            setPage(1);
          }}
        />
      )}

      {expanded && comments.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {t('no_comments', currentLanguage)}
        </Typography>
      )}

      {expanded && visibleRoots.length > 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 1.5 }}>
          {visibleRoots.map(root => renderNode(root))}
        </Box>
      )}

      {expanded && listMode === 'feed' && roots.length > shownRoots && (
        <Button
          size="small"
          onClick={() => setShownRoots(roots.length)}
          sx={{ textTransform: 'none', mt: 1 }}
        >
          {t('show_more_comments', currentLanguage)}
        </Button>
      )}

      {expanded && listMode === 'paged' && pageCount > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Pagination
            count={pageCount}
            page={currentPage}
            onChange={(_, nextPage) => setPage(nextPage)}
            color="primary"
            size="large"
          />
        </Box>
      )}

      {currentUserId && composeMode === 'button' && composing && (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', mt: 1 }}>
          <TextField
            value={draft}
            onChange={event => setDraft(event.target.value.slice(0, 2000))}
            placeholder={t('comment_placeholder', currentLanguage)}
            fullWidth
            multiline
            minRows={2}
            size="small"
            inputProps={{ maxLength: 2000 }}
          />
          <Button variant="contained" size="small" onClick={() => submit(draft)} disabled={busy || !draft.trim()}>
            {t('send_comment', currentLanguage)}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default CommentThread;
