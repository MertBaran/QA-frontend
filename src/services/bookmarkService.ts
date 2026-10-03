import api from './api';
import type {
  AddBookmarkRequest,
  BookmarkResponse,
  BookmarkTargetType,
  UpdateBookmarkRequest,
} from '../types/bookmark';

export interface BookmarkCollection {
  _id: string;
  user_id: string;
  parent_id?: string | null;
  name: string;
  description?: string;
  color?: string;
  cover_photo_key?: string | null;
  is_public: boolean;
  createdAt: string;
  updatedAt: string;
}

export const bookmarkService = {
  async addBookmark(payload: AddBookmarkRequest): Promise<BookmarkResponse> {
    const { data } = await api.post<BookmarkResponse>('/bookmarks/add', payload);
    return data;
  },

  async removeBookmark(id: string): Promise<boolean> {
    const { data } = await api.delete<{ success: boolean; data?: { deleted: boolean } }>(
      `/bookmarks/remove/${id}`,
    );
    return data?.data?.deleted ?? data?.success ?? false;
  },

  async updateBookmark(
    id: string,
    updates: UpdateBookmarkRequest,
  ): Promise<BookmarkResponse> {
    const { data } = await api.put<BookmarkResponse>(`/bookmarks/${id}`, updates);
    return data;
  },

  async getUserBookmarks(): Promise<BookmarkResponse[]> {
    const { data } = await api.get<BookmarkResponse[]>(`/bookmarks/user`);
    return data;
  },

  async getBookmark(id: string): Promise<BookmarkResponse> {
    const { data } = await api.get<BookmarkResponse>(`/bookmarks/item/${id}`);
    return data;
  },

  async getQueryBookmarks(): Promise<BookmarkResponse[]> {
    const all = await this.getUserBookmarks();
    return all.filter(b => b.target_type === 'query');
  },

  async checkBookmark(targetType: BookmarkTargetType, targetId: string): Promise<boolean> {
    const { data } = await api.get<{ exists: boolean }>(
      `/bookmarks/check/${targetType}/${targetId}`,
    );
    return data.exists;
  },

  async getCollections(): Promise<BookmarkCollection[]> {
    const { data } = await api.get<BookmarkCollection[]>('/bookmarks/collections');
    return data;
  },

  async createCollection(payload: { name: string; parent_id?: string | null; description?: string; color?: string }): Promise<BookmarkCollection> {
    const { data } = await api.post<BookmarkCollection>('/bookmarks/collections', payload);
    return data;
  },

  async getCollectionItems(
    collectionId: string,
  ): Promise<(BookmarkResponse & { addedAt?: string })[]> {
    const { data } = await api.get<(BookmarkResponse & { addedAt?: string })[]>(
      `/bookmarks/collections/${collectionId}/items`,
    );
    return data;
  },

  async getPublicCollection(
    collectionId: string,
  ): Promise<{ collection: BookmarkCollection; items: (BookmarkResponse & { addedAt?: string })[] } | null> {
    try {
      const { data } = await api.get<{ collection: BookmarkCollection; items: (BookmarkResponse & { addedAt?: string })[] }>(
        `/bookmarks/collections/${collectionId}/shared`,
      );
      return data;
    } catch {
      return null;
    }
  },

  async getPublicCollectionByToken(
    token: string,
  ): Promise<{ collection: BookmarkCollection; items: (BookmarkResponse & { addedAt?: string })[] } | null> {
    try {
      const { data } = await api.get<{ collection: BookmarkCollection; items: (BookmarkResponse & { addedAt?: string })[] }>(
        `/bookmarks/collections/s/shared/t/${encodeURIComponent(token)}`,
      );
      return data;
    } catch {
      return null;
    }
  },

  async createShare(
    collectionId: string,
    description: string,
  ): Promise<{ id: string; token: string; description: string; createdAt: string }> {
    const { data } = await api.post<{ id: string; token: string; description: string; createdAt: string }>(
      `/bookmarks/collections/${collectionId}/shares`,
      { description },
    );
    return data;
  },

  async getShares(
    collectionId: string,
  ): Promise<Array<{ id: string; token: string; description: string; createdAt: string; revokedAt: string | null }>> {
    const { data } = await api.get<Array<{ id: string; token: string; description: string; createdAt: string; revokedAt: string | null }>>(
      `/bookmarks/collections/${collectionId}/shares`,
    );
    return data;
  },

  async revokeShare(collectionId: string, shareId: string): Promise<boolean> {
    const { data } = await api.delete<{ success: boolean; data?: { revoked: boolean } }>(
      `/bookmarks/collections/${collectionId}/shares/${shareId}`,
    );
    return data?.data?.revoked ?? data?.success ?? false;
  },

  async addToCollection(collectionId: string, bookmarkId: string): Promise<boolean> {
    const { data } = await api.post<{ success: boolean; data?: { added: boolean } }>(
      `/bookmarks/collections/${collectionId}/items/${bookmarkId}`,
    );
    return data?.data?.added ?? data?.success ?? false;
  },

  async removeFromCollection(collectionId: string, bookmarkId: string): Promise<boolean> {
    const { data } = await api.delete<{ success: boolean; data?: { removed: boolean } }>(
      `/bookmarks/collections/${collectionId}/items/${bookmarkId}`,
    );
    return data?.data?.removed ?? data?.success ?? false;
  },

  async reorderCollectionItems(collectionId: string, bookmarkIds: string[]): Promise<void> {
    await api.put(`/bookmarks/collections/${collectionId}/items/reorder`, { bookmarkIds });
  },

  async updateCollection(
    collectionId: string,
    payload: { name?: string; parent_id?: string | null; description?: string; color?: string; coverPhotoKey?: string | null; isPublic?: boolean },
  ): Promise<BookmarkCollection> {
    const { data } = await api.put<BookmarkCollection>(`/bookmarks/collections/${collectionId}`, payload);
    return data;
  },
};
