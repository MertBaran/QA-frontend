import { createAsyncThunk } from '@reduxjs/toolkit';
import { bookmarkService, type BookmarkCollection } from '../../services/bookmarkService';
import type { BookmarkResponse } from '../../types/bookmark';

export const fetchCollections = createAsyncThunk<
  BookmarkCollection[],
  void,
  { rejectValue: string }
>('bookmarkCollections/fetchCollections', async (_, { rejectWithValue }) => {
  try {
    return await bookmarkService.getCollections();
  } catch (e: any) {
    return rejectWithValue(e?.response?.data?.error || 'Failed to load collections');
  }
});

export const createCollectionThunk = createAsyncThunk<
  BookmarkCollection,
  { name: string; parent_id?: string | null; description?: string; color?: string },
  { rejectValue: string }
>('bookmarkCollections/createCollection', async (payload, { rejectWithValue }) => {
  try {
    return await bookmarkService.createCollection(payload);
  } catch (e: any) {
    return rejectWithValue(e?.response?.data?.error || 'Failed to create collection');
  }
});

export const fetchCollectionItems = createAsyncThunk<
  { collectionId: string; items: BookmarkResponse[] },
  string,
  { rejectValue: string }
>('bookmarkCollections/fetchCollectionItems', async (collectionId, { rejectWithValue }) => {
  try {
    const items = await bookmarkService.getCollectionItems(collectionId);
    return { collectionId, items };
  } catch (e: any) {
    return rejectWithValue(e?.response?.data?.error || 'Failed to load collection items');
  }
});

export const addToCollectionThunk = createAsyncThunk<
  boolean,
  { collectionId: string; bookmarkId: string },
  { rejectValue: string }
>('bookmarkCollections/addToCollection', async ({ collectionId, bookmarkId }, { rejectWithValue }) => {
  try {
    return await bookmarkService.addToCollection(collectionId, bookmarkId);
  } catch (e: any) {
    return rejectWithValue(e?.response?.data?.error || 'Failed to add to collection');
  }
});

export const removeFromCollectionThunk = createAsyncThunk<
  boolean,
  { collectionId: string; bookmarkId: string },
  { rejectValue: string }
>('bookmarkCollections/removeFromCollection', async ({ collectionId, bookmarkId }, { rejectWithValue }) => {
  try {
    return await bookmarkService.removeFromCollection(collectionId, bookmarkId);
  } catch (e: any) {
    return rejectWithValue(e?.response?.data?.error || 'Failed to remove from collection');
  }
});

export const reorderCollectionItemsThunk = createAsyncThunk<
  { collectionId: string; bookmarkIds: string[] },
  { collectionId: string; bookmarkIds: string[] },
  { rejectValue: string }
>('bookmarkCollections/reorderCollectionItems', async ({ collectionId, bookmarkIds }, { rejectWithValue }) => {
  try {
    await bookmarkService.reorderCollectionItems(collectionId, bookmarkIds);
    return { collectionId, bookmarkIds };
  } catch (e: any) {
    return rejectWithValue(e?.response?.data?.error || 'Failed to reorder');
  }
});

export const updateCollectionThunk = createAsyncThunk<
  BookmarkCollection,
  { collectionId: string; payload: { name?: string; parent_id?: string | null; description?: string; color?: string; coverPhotoKey?: string | null; isPublic?: boolean } },
  { rejectValue: string }
>('bookmarkCollections/updateCollection', async ({ collectionId, payload }, { rejectWithValue }) => {
  try {
    return await bookmarkService.updateCollection(collectionId, payload);
  } catch (e: any) {
    return rejectWithValue(e?.response?.data?.error || 'Failed to update collection');
  }
});
