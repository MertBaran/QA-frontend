import api from './api';
import config from '../config/config';

export interface ConversationListItem {
  id: string;
  updatedAt: string;
  otherUser: { id: string; name: string; profile_image: string };
  lastMessage: { content: string; createdAt: string; senderId: string } | null;
  unreadCount: number;
  isBlockedByMe?: boolean;
}

export interface MessageReaction {
  emoji: string;
  userId: string;
  count: number;
  reactedByMe?: boolean;
}

export interface MessageItem {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender?: { id: string; name: string; profile_image: string };
  reactions?: MessageReaction[];
  starredByMe?: boolean;
}

export interface MessagesResponse {
  data: MessageItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export const messageService = {
  async searchUsers(query: string, limit: number = 10): Promise<Array<{ id: string; name: string; profile_image: string }>> {
    const { data } = await api.get<Array<{ id: string; name: string; profile_image: string }>>(
      '/messages/users',
      { params: { q: query, limit } }
    );
    return data;
  },

  async getConversations(): Promise<ConversationListItem[]> {
    const { data } = await api.get<ConversationListItem[]>('/messages/conversations');
    return data;
  },

  async createConversation(recipientId: string): Promise<{ id: string }> {
    const { data } = await api.post<{ id: string }>('/messages/conversations', { recipientId });
    return data;
  },

  async getMessages(
    conversationId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<MessagesResponse> {
    const { data } = await api.get<MessagesResponse>(
      `/messages/conversations/${conversationId}/messages`,
      { params: { page, limit } }
    );
    return data;
  },

  async markAsRead(conversationId: string): Promise<void> {
    await api.put(`/messages/conversations/${conversationId}/read`);
  },

  async sendMessage(conversationId: string, content: string): Promise<MessageItem> {
    const { data } = await api.post<MessageItem>(
      `/messages/conversations/${conversationId}/messages`,
      { content }
    );
    return data;
  },

  async addReaction(conversationId: string, messageId: string, emoji: string): Promise<void> {
    await api.post(`/messages/conversations/${conversationId}/messages/${messageId}/reactions`, { emoji });
  },

  async removeReaction(conversationId: string, messageId: string, emoji: string): Promise<void> {
    await api.delete(`/messages/conversations/${conversationId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`);
  },

  async toggleStar(conversationId: string, messageId: string): Promise<{ starred: boolean }> {
    const { data } = await api.post<{ starred: boolean }>(`/messages/conversations/${conversationId}/messages/${messageId}/star`);
    return data;
  },

  async deleteConversation(conversationId: string): Promise<void> {
    await api.delete(`/messages/conversations/${conversationId}`);
  },

  async blockUser(userId: string): Promise<void> {
    await api.post(`/messages/users/${userId}/block`);
  },

  async unblockUser(userId: string): Promise<void> {
    await api.delete(`/messages/users/${userId}/block`);
  },
};

export function getMessagingWebSocketUrl(token: string): string {
  const origin = config.API_ORIGIN || 'http://localhost:3000';
  const wsProtocol = origin.startsWith('https') ? 'wss' : 'ws';
  const wsHost = origin.replace(/^https?:\/\//, '');
  return `${wsProtocol}://${wsHost}/ws/messages?token=${encodeURIComponent(token)}`;
}
