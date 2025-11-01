import { createSlice } from '@reduxjs/toolkit';
import type { BookmarkResponse } from '../../types/bookmark';
import {
  fetchUserBookmarks,
  addBookmarkThunk,
  removeBookmarkThunk,
} from '../../store/bookmarks/bookmarkThunks';

interface BookmarkState {
  items: BookmarkResponse[];
  loading: boolean;
  error: string | null;
}

const initialState: BookmarkState = {
  items: [],
  loading: false,
  error: null,
};

const bookmarkSlice = createSlice({
  name: 'bookmarks',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserBookmarks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserBookmarks.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchUserBookmarks.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Failed to load bookmarks';
      })
      .addCase(addBookmarkThunk.fulfilled, (state, action) => {
        // Optimistic add already applied by component; ensure no duplicates
        const exists = state.items.some((b) => b._id === action.payload._id);
        if (!exists) state.items.unshift(action.payload);
      })
      .addCase(removeBookmarkThunk.fulfilled, (state, action) => {
        state.items = state.items.filter((b) => b._id !== action.meta.arg);
      });
  },
});

export default bookmarkSlice.reducer;
