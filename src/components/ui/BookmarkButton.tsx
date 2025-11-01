import { useEffect, useState } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { Bookmark as BookmarkIcon, BookmarkBorder } from '@mui/icons-material';
import { bookmarkService } from '../../services/bookmarkService';
import type { AddBookmarkRequest, BookmarkResponse } from '../../types/bookmark';
import { showErrorToast } from '../../utils/notificationUtils';
import { t } from '../../utils/translations';
import { useAppSelector } from '../../store/hooks';

interface Props {
  targetType: AddBookmarkRequest['targetType'];
  targetId: string;
  targetData: AddBookmarkRequest['targetData'];
  onChange?: (bookmark?: BookmarkResponse) => void;
}

export default function BookmarkButton({ targetType, targetId, targetData, onChange }: Props) {
  const { isAuthenticated } = useAppSelector(state => state.auth);
  const { currentLanguage } = useAppSelector(state => state.language);
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarkId, setBookmarkId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!isAuthenticated) return;
        const exists = await bookmarkService.checkBookmark(targetType, targetId);
        if (mounted) setBookmarked(exists);
        if (exists) {
          // Opsiyonel: kullanıcının bookmark listesinde bulup id cache'lemek istenirse burada yapılabilir
        }
      } catch {
        // sessiz geç
      }
    })();
    return () => {
      mounted = false;
    };
  }, [isAuthenticated, targetType, targetId]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated || loading) return;
    try {
      setLoading(true);
      const limit = (s: string, max: number) => (s.length > max ? s.slice(0, max) : s);
      const isValidObjectId = (s?: string) => !!s && /^[0-9a-fA-F]{24}$/.test(s);

      if (!bookmarked) {
        const sanitized = {
          ...targetData,
          title: limit(targetData.title, 200),
          content: limit(targetData.content, 2000),
          author: targetData.author ? limit(targetData.author, 100) : undefined,
          authorId: isValidObjectId(targetData.authorId) ? targetData.authorId : undefined,
          url: targetData.url ? limit(targetData.url, 500) : undefined,
        } as AddBookmarkRequest['targetData'];

        const created = await bookmarkService.addBookmark({
          targetType,
          targetId,
          targetData: sanitized,
        });
        setBookmarked(true);
        setBookmarkId(created._id);
        onChange?.(created);
      } else if (bookmarkId) {
        const removed = await bookmarkService.removeBookmark(bookmarkId);
        if (removed) {
          setBookmarked(false);
          setBookmarkId(null);
          onChange?.();
        }
      } else {
        // Bookmark id bilinmiyorsa, kullanıcı bookmarklarını çekip ilgili kaydı bulmak gerekebilir
        const list = await bookmarkService.getUserBookmarks();
        const found = list.find(b => b.target_id === targetId && b.target_type === targetType);
        if (found) {
          setBookmarkId(found._id);
          const removed = await bookmarkService.removeBookmark(found._id);
          if (removed) {
            setBookmarked(false);
            setBookmarkId(null);
            onChange?.();
          }
        }
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'İşlem sırasında bir hata oluştu';
      showErrorToast(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Tooltip title={bookmarked ? t('bookmark_saved', currentLanguage) : t('bookmark_save', currentLanguage)}>
      <span>
        <IconButton size="small" onClick={handleToggle} disabled={!isAuthenticated || loading}>
          {bookmarked ? (
            <BookmarkIcon sx={{ color: '#FFB800' }} />
          ) : (
            <BookmarkBorder sx={{ color: 'rgba(255,255,255,0.7)' }} />
          )}
        </IconButton>
      </span>
    </Tooltip>
  );
}


