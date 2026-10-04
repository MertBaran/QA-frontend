import api from './api';
import type { CommentItem, CommentTargetType } from '../types/comment';

export const commentService = {
  async getById(id: string): Promise<CommentItem | null> {
    try {
      const { data } = await api.get<{ success: boolean; data: CommentItem }>(`/comments/${id}`);
      return data.data ?? null;
    } catch {
      return null;
    }
  },

  async search(term: string, limit = 15): Promise<CommentItem[]> {
    const { data } = await api.get<{ success: boolean; data: CommentItem[] }>('/comments/search', {
      params: { q: term, limit },
    });
    return data.data ?? [];
  },

  async listForQuestion(questionId: string): Promise<CommentItem[]> {
    const { data } = await api.get<{ success: boolean; data: CommentItem[] }>(
      `/comments/question/${questionId}`,
    );
    return data.data ?? [];
  },

  async create(input: {
    body: string;
    targetType: CommentTargetType;
    targetId: string;
    parentId?: string;
  }): Promise<CommentItem> {
    const { data } = await api.post<{ success: boolean; data: CommentItem }>('/comments', input);
    return data.data;
  },

  async update(id: string, body: string): Promise<CommentItem> {
    const { data } = await api.put<{ success: boolean; data: CommentItem }>(`/comments/${id}`, {
      body,
    });
    return data.data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/comments/${id}`);
  },

  async react(id: string, type: 'like' | 'dislike'): Promise<CommentItem> {
    const { data } = await api.post<{ success: boolean; data: CommentItem }>(
      `/comments/${id}/${type}`,
    );
    return data.data;
  },
};
