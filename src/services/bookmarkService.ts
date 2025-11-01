import api from './api';
import type { AddBookmarkRequest, BookmarkResponse, BookmarkTargetType } from '../types/bookmark';

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
    updates: Partial<Pick<AddBookmarkRequest, 'tags' | 'notes' | 'isPublic'>>,
  ): Promise<BookmarkResponse> {
    const { data } = await api.put<BookmarkResponse>(`/bookmarks/${id}`, updates);
    return data;
  },

  async getUserBookmarks(): Promise<BookmarkResponse[]> {
    const { data } = await api.get<BookmarkResponse[]>(`/bookmarks/user`);
    return data;
  },

  async checkBookmark(targetType: BookmarkTargetType, targetId: string): Promise<boolean> {
    const { data } = await api.get<{ exists: boolean }>(
      `/bookmarks/check/${targetType}/${targetId}`,
    );
    return data.exists;
  },
};
