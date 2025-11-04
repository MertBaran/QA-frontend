import { useState } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { Bookmark as BookmarkIcon, BookmarkBorder } from '@mui/icons-material';
import type { AddBookmarkRequest, BookmarkResponse } from '../../types/bookmark';
import { showErrorToast } from '../../utils/notificationUtils';
import { t } from '../../utils/translations';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { addBookmarkThunk, removeBookmarkThunk } from '../../store/bookmarks/bookmarkThunks';

interface Props {
  targetType: AddBookmarkRequest['targetType'];
  targetId: string;
  targetData: AddBookmarkRequest['targetData'];
  onChange?: (bookmark?: BookmarkResponse) => void;
  // Optional: if provided, skip the initial check
  isBookmarked?: boolean;
  bookmarkId?: string | null;
}

export default function BookmarkButton({ targetType, targetId, targetData, onChange, isBookmarked: initialBookmarked, bookmarkId: initialBookmarkId }: Props) {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector(state => state.auth);
  const { currentLanguage } = useAppSelector(state => state.language);
  const { items: bookmarks } = useAppSelector(state => state.bookmarks);
  const [loading, setLoading] = useState(false);

  // Determine bookmark state: prefer prop, fallback to Redux
  const bookmark = bookmarks.find(
    b => b.target_type === targetType && b.target_id === targetId
  );
  const bookmarked = initialBookmarked !== undefined ? initialBookmarked : !!bookmark;
  const bookmarkIdValue = initialBookmarkId !== undefined ? initialBookmarkId : (bookmark?._id || null);

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

        const result = await dispatch(addBookmarkThunk({
          targetType,
          targetId,
          targetData: sanitized,
        }));
        
        if (addBookmarkThunk.fulfilled.match(result)) {
          onChange?.(result.payload);
        }
      } else if (bookmarkIdValue) {
        const result = await dispatch(removeBookmarkThunk(bookmarkIdValue));
        
        if (removeBookmarkThunk.fulfilled.match(result) && result.payload) {
          onChange?.();
        }
      } else {
        // Bookmark id bilinmiyorsa, Redux'tan bul
        const found = bookmarks.find(b => b.target_id === targetId && b.target_type === targetType);
        if (found) {
          const result = await dispatch(removeBookmarkThunk(found._id));
          
          if (removeBookmarkThunk.fulfilled.match(result) && result.payload) {
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
        <IconButton 
          size="small" 
          onClick={handleToggle} 
          disabled={!isAuthenticated || loading}
          sx={{
            width: '40px',
            height: '40px',
            padding: 0,
            minWidth: '40px',
            minHeight: '40px',
          }}
        >
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


