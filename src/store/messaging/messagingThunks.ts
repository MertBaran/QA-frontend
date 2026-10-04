import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  messageService,
  type ConversationListItem,
  type MessageItem,
  type MessagesResponse,
} from '../../services/messageService';

const MESSAGES_PAGE_SIZE = 15;

export const fetchConversations = createAsyncThunk<
  ConversationListItem[],
  void,
  { rejectValue: string }
>('messaging/fetchConversations', async (_, { rejectWithValue }) => {
  try {
    return await messageService.getConversations();
  } catch (e: unknown) {
    const err = e as { response?: { data?: { error?: string } } };
    return rejectWithValue(err?.response?.data?.error || 'Failed to load conversations');
  }
});

export const fetchMessages = createAsyncThunk<
  {
    conversationId: string;
    messages: MessageItem[];
    pagination: MessagesResponse['pagination'];
    append?: boolean;
  },
  { conversationId: string; page?: number; limit?: number; append?: boolean },
  { rejectValue: string }
>(
  'messaging/fetchMessages',
  async ({ conversationId, page = 1, limit = MESSAGES_PAGE_SIZE, append = false }, { rejectWithValue }) => {
    try {
      const res = await messageService.getMessages(conversationId, page, limit);
      return {
        conversationId,
        messages: res.data,
        pagination: res.pagination,
        append,
      };
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      return rejectWithValue(err?.response?.data?.error || 'Failed to load messages');
    }
  }
);

export const sendMessage = createAsyncThunk<
  MessageItem,
  { conversationId: string; content: string },
  { rejectValue: string }
>(
  'messaging/sendMessage',
  async ({ conversationId, content }, { rejectWithValue }) => {
    try {
      return await messageService.sendMessage(conversationId, content);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      return rejectWithValue(err?.response?.data?.error || 'Failed to send message');
    }
  }
);

export const markAsRead = createAsyncThunk<
  void,
  string,
  { rejectValue: string }
>('messaging/markAsRead', async (conversationId, { rejectWithValue }) => {
  try {
    await messageService.markAsRead(conversationId);
  } catch (e: unknown) {
    const err = e as { response?: { data?: { error?: string } } };
    return rejectWithValue(err?.response?.data?.error || 'Failed to mark as read');
  }
});

export const createConversation = createAsyncThunk<
  { id: string },
  string,
  { rejectValue: string }
>('messaging/createConversation', async (recipientId, { rejectWithValue }) => {
  try {
    return await messageService.createConversation(recipientId);
  } catch (e: unknown) {
    const err = e as { response?: { data?: { error?: string } } };
    return rejectWithValue(err?.response?.data?.error || 'Failed to create conversation');
  }
});

export const deleteConversation = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>('messaging/deleteConversation', async (conversationId, { rejectWithValue }) => {
  try {
    await messageService.deleteConversation(conversationId);
    return conversationId;
  } catch (e: unknown) {
    const err = e as { response?: { data?: { error?: string } } };
    return rejectWithValue(err?.response?.data?.error || 'Failed to delete conversation');
  }
});

export const blockUser = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>('messaging/blockUser', async (userId, { rejectWithValue }) => {
  try {
    await messageService.blockUser(userId);
    return userId;
  } catch (e: unknown) {
    const err = e as { response?: { data?: { error?: string } } };
    return rejectWithValue(err?.response?.data?.error || 'Failed to block user');
  }
});

export const unblockUser = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>('messaging/unblockUser', async (userId, { rejectWithValue }) => {
  try {
    await messageService.unblockUser(userId);
    return userId;
  } catch (e: unknown) {
    const err = e as { response?: { data?: { error?: string } } };
    return rejectWithValue(err?.response?.data?.error || 'Failed to unblock user');
  }
});
