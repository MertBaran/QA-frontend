import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { ConversationListItem, MessageItem } from '../../services/messageService';
import {
  fetchConversations,
  fetchMessages,
  sendMessage,
  createConversation,
  markAsRead,
  deleteConversation,
  blockUser,
  unblockUser,
} from './messagingThunks';
import { logoutUser } from '../auth/authThunks';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

interface PaginationInfo {
  page: number;
  hasPrev: boolean;
  hasNext: boolean;
  total: number;
}

export interface MessageComposeRequest {
  id: number;
  recipient: { id: string; name: string; profile_image?: string };
  questionId?: string;
  answerId?: string;
  commentId?: string;
}

interface MessagingState {
  conversations: ConversationListItem[];
  messagesByConversation: Record<string, MessageItem[]>;
  paginationByConversation: Record<string, PaginationInfo>;
  activeConversationId: string | null;
  connectionStatus: ConnectionStatus;
  loading: boolean;
  loadingMessages: boolean;
  loadingMoreMessages: boolean;
  error: string | null;
  pendingCompose: MessageComposeRequest | null;
}

const initialState: MessagingState = {
  conversations: [],
  messagesByConversation: {},
  paginationByConversation: {},
  activeConversationId: null,
  connectionStatus: 'disconnected',
  loading: false,
  loadingMessages: false,
  loadingMoreMessages: false,
  error: null,
  pendingCompose: null,
};

/** Yeni mesajla konuşmayı üste taşı (liste sırası sunucuyla uyumlu kalsın). */
function applyIncomingMessageToConversationList(state: MessagingState, msg: MessageItem): void {
  const list = state.messagesByConversation[msg.conversationId] ?? [];
  if (!list.some((m) => m.id === msg.id)) {
    state.messagesByConversation[msg.conversationId] = [...list, msg];
  }
  const idx = state.conversations.findIndex((c) => c.id === msg.conversationId);
  if (idx === -1) return;
  const conv = state.conversations[idx];
  conv.lastMessage = {
    content: msg.content,
    createdAt: msg.createdAt,
    senderId: msg.senderId,
  };
  conv.updatedAt = msg.createdAt;
  if (idx !== 0) {
    state.conversations.splice(idx, 1);
    state.conversations.unshift(conv);
  }
}

const messagingSlice = createSlice({
  name: 'messaging',
  initialState,
  reducers: {
    setActiveConversation: (state, action: PayloadAction<string | null>) => {
      state.activeConversationId = action.payload;
    },
    requestMessageCompose: (state, action: PayloadAction<Omit<MessageComposeRequest, 'id'>>) => {
      state.pendingCompose = { ...action.payload, id: Date.now() };
    },
    clearMessageCompose: (state) => {
      state.pendingCompose = null;
    },
    setConnectionStatus: (state, action: PayloadAction<ConnectionStatus>) => {
      state.connectionStatus = action.payload;
    },
    addMessage: (state, action: PayloadAction<MessageItem>) => {
      applyIncomingMessageToConversationList(state, action.payload);
    },
    clearError: (state) => {
      state.error = null;
    },
    markConversationRead: (state, action: PayloadAction<string>) => {
      const conv = state.conversations.find((c) => c.id === action.payload);
      if (conv) conv.unreadCount = 0;
    },
    incrementConversationUnread: (state, action: PayloadAction<string>) => {
      const conv = state.conversations.find((c) => c.id === action.payload);
      if (conv) conv.unreadCount = (conv.unreadCount || 0) + 1;
    },
    updateMessageReaction: (
      state,
      action: PayloadAction<{ conversationId: string; messageId: string; emoji: string; add: boolean }>
    ) => {
      const { conversationId, messageId, emoji, add } = action.payload;
      const list = state.messagesByConversation[conversationId];
      if (!list) return;
      const msg = list.find((m) => m.id === messageId);
      if (!msg) return;
      msg.reactions = msg.reactions ?? [];
      const existing = msg.reactions.find((r) => r.emoji === emoji);
      if (add) {
        if (existing) {
          existing.count += 1;
          existing.reactedByMe = true;
        } else {
          msg.reactions.push({ emoji, userId: '', count: 1, reactedByMe: true });
        }
      } else {
        if (existing) {
          existing.count -= 1;
          existing.reactedByMe = false;
          if (existing.count <= 0) msg.reactions = msg.reactions.filter((r) => r.emoji !== emoji);
        }
      }
    },
    updateMessageStar: (
      state,
      action: PayloadAction<{ conversationId: string; messageId: string; starred: boolean }>
    ) => {
      const { conversationId, messageId, starred } = action.payload;
      const list = state.messagesByConversation[conversationId];
      if (!list) return;
      const msg = list.find((m) => m.id === messageId);
      if (msg) msg.starredByMe = starred;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConversations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.loading = false;
        state.conversations = action.payload;
        if (state.activeConversationId) {
          const openConversation = state.conversations.find(conversation => conversation.id === state.activeConversationId);
          if (openConversation) openConversation.unreadCount = 0;
        }
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchMessages.pending, (state, action) => {
        if (action.meta.arg.append) {
          state.loadingMoreMessages = true;
        } else {
          state.loadingMessages = true;
        }
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loadingMessages = false;
        state.loadingMoreMessages = false;
        const { conversationId, messages, pagination, append } = action.payload;
        state.paginationByConversation[conversationId] = {
          page: pagination.page,
          hasPrev: pagination.hasPrev,
          hasNext: pagination.hasNext,
          total: pagination.total,
        };
        if (append) {
          const existing = state.messagesByConversation[conversationId] ?? [];
          const existingIds = new Set(existing.map((m) => m.id));
          const newMsgs = messages.filter((m) => !existingIds.has(m.id));
          state.messagesByConversation[conversationId] = [...newMsgs, ...existing];
        } else {
          state.messagesByConversation[conversationId] = messages;
        }
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loadingMessages = false;
        state.loadingMoreMessages = false;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        applyIncomingMessageToConversationList(state, action.payload);
      })
      .addCase(createConversation.fulfilled, (state, action) => {
        state.activeConversationId = action.payload.id;
      })
      .addCase(markAsRead.fulfilled, (state, action) => {
        const conv = state.conversations.find((c) => c.id === action.meta.arg);
        if (conv) conv.unreadCount = 0;
      })
      .addCase(deleteConversation.fulfilled, (state, action) => {
        const id = action.payload;
        state.conversations = state.conversations.filter((c) => c.id !== id);
        if (state.activeConversationId === id) state.activeConversationId = null;
        delete state.messagesByConversation[id];
        delete state.paginationByConversation[id];
      })
      .addCase(blockUser.fulfilled, (state, action) => {
        const blockedUserId = action.payload;
        const conv = state.conversations.find((c) => c.otherUser.id === blockedUserId);
        if (conv) conv.isBlockedByMe = true;
      })
      .addCase(unblockUser.fulfilled, (state, action) => {
        const unblockedUserId = action.payload;
        const conv = state.conversations.find((c) => c.otherUser.id === unblockedUserId);
        if (conv) conv.isBlockedByMe = false;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        return initialState;
      });
  },
});

export const {
  setActiveConversation,
  requestMessageCompose,
  clearMessageCompose,
  setConnectionStatus,
  addMessage,
  clearError,
  markConversationRead,
  incrementConversationUnread,
  updateMessageReaction,
  updateMessageStar,
} = messagingSlice.actions;

export default messagingSlice.reducer;
