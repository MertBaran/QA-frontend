import { createSlice } from '@reduxjs/toolkit';
import type { BookmarkResponse } from '../../types/bookmark';
import type { BookmarkCollection } from '../../services/bookmarkService';
import {
  fetchCollections,
  createCollectionThunk,
  fetchCollectionItems,
  addToCollectionThunk,
  removeFromCollectionThunk,
  reorderCollectionItemsThunk,
  updateCollectionThunk,
} from './bookmarkCollectionThunks';
import { logoutUser } from '../auth/authThunks';

interface BookmarkCollectionState {
  collections: BookmarkCollection[];
  itemsByCollection: Record<string, (BookmarkResponse & { addedAt?: string })[]>;
  /** bookmarkId -> collectionIds[] - bu bookmark hangi klasörlerde */
  bookmarkCollectionIds: Record<string, string[]>;
  loading: boolean;
  error: string | null;
}

const initialState: BookmarkCollectionState = {
  collections: [],
  itemsByCollection: {},
  bookmarkCollectionIds: {},
  loading: false,
  error: null,
};

const bookmarkCollectionSlice = createSlice({
  name: 'bookmarkCollections',
  initialState,
  reducers: {
    clearCollectionItems: (state, action: { payload: string }) => {
      delete state.itemsByCollection[action.payload];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCollections.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCollections.fulfilled, (state, action) => {
        state.loading = false;
        state.collections = action.payload;
      })
      .addCase(fetchCollections.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Failed to load collections';
      })
      .addCase(createCollectionThunk.fulfilled, (state, action) => {
        state.collections.push(action.payload);
      })
      .addCase(fetchCollectionItems.fulfilled, (state, action) => {
        const { collectionId, items } = action.payload;
        state.itemsByCollection[collectionId] = items;

        // bookmarkCollectionIds güncelle: bu klasördeki bookmark'ları işaretle
        Object.keys(state.bookmarkCollectionIds).forEach((bid) => {
          state.bookmarkCollectionIds[bid] = state.bookmarkCollectionIds[bid].filter((cid) => cid !== collectionId);
          if (state.bookmarkCollectionIds[bid].length === 0) delete state.bookmarkCollectionIds[bid];
        });
        items.forEach((item) => {
          if (!state.bookmarkCollectionIds[item._id]) state.bookmarkCollectionIds[item._id] = [];
          if (!state.bookmarkCollectionIds[item._id].includes(collectionId)) {
            state.bookmarkCollectionIds[item._id].push(collectionId);
          }
        });
      })
      .addCase(addToCollectionThunk.fulfilled, (state, action) => {
        const { collectionId, bookmarkId } = action.meta.arg;
        if (!state.bookmarkCollectionIds[bookmarkId]) state.bookmarkCollectionIds[bookmarkId] = [];
        if (!state.bookmarkCollectionIds[bookmarkId].includes(collectionId)) {
          state.bookmarkCollectionIds[bookmarkId].push(collectionId);
        }
      })
      .addCase(removeFromCollectionThunk.fulfilled, (state, action) => {
        const { collectionId, bookmarkId } = action.meta.arg;
        if (state.bookmarkCollectionIds[bookmarkId]) {
          state.bookmarkCollectionIds[bookmarkId] = state.bookmarkCollectionIds[bookmarkId].filter((cid) => cid !== collectionId);
          if (state.bookmarkCollectionIds[bookmarkId].length === 0) delete state.bookmarkCollectionIds[bookmarkId];
        }
        if (state.itemsByCollection[collectionId]) {
          state.itemsByCollection[collectionId] = state.itemsByCollection[collectionId].filter((b) => b._id !== bookmarkId);
        }
      })
      .addCase(reorderCollectionItemsThunk.fulfilled, (state, action) => {
        const { collectionId, bookmarkIds } = action.payload;
        const items = state.itemsByCollection[collectionId];
        if (!items || bookmarkIds.length === 0) return;
        const idToItem = Object.fromEntries(items.map((b) => [b._id, b]));
        state.itemsByCollection[collectionId] = bookmarkIds.map((id) => idToItem[id]).filter(Boolean);
      })
      .addCase(updateCollectionThunk.fulfilled, (state, action) => {
        const idx = state.collections.findIndex((c) => c._id === action.payload._id);
        if (idx >= 0) state.collections[idx] = action.payload;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.collections = [];
        state.itemsByCollection = {};
        state.bookmarkCollectionIds = {};
        state.loading = false;
        state.error = null;
      });
  },
});

export const { clearCollectionItems } = bookmarkCollectionSlice.actions;
export default bookmarkCollectionSlice.reducer;
