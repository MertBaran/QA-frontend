import { createAsyncThunk } from '@reduxjs/toolkit';
import { bookmarkService } from '../../services/bookmarkService';
import type { AddBookmarkRequest, BookmarkResponse } from '../../types/bookmark';

export const fetchUserBookmarks = createAsyncThunk<
  BookmarkResponse[],
  void,
  { rejectValue: string }
>('bookmarks/fetchUserBookmarks', async (_, { rejectWithValue }) => {
  try {
    return await bookmarkService.getUserBookmarks();
  } catch (e: any) {
    return rejectWithValue(e?.response?.data?.error || 'Failed to load bookmarks');
  }
});

export const addBookmarkThunk = createAsyncThunk<
  BookmarkResponse,
  AddBookmarkRequest,
  { rejectValue: string }
>('bookmarks/addBookmark', async (payload, { rejectWithValue }) => {
  try {
    return await bookmarkService.addBookmark(payload);
  } catch (e: any) {
    return rejectWithValue(e?.response?.data?.error || 'Failed to add bookmark');
  }
});

export const removeBookmarkThunk = createAsyncThunk<boolean, string, { rejectValue: string }>(
  'bookmarks/removeBookmark',
  async (bookmarkId, { rejectWithValue }) => {
    try {
      return await bookmarkService.removeBookmark(bookmarkId);
    } catch (e: any) {
      return rejectWithValue(e?.response?.data?.error || 'Failed to remove bookmark');
    }
  },
);
