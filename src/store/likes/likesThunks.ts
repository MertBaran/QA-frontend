import { createAsyncThunk } from '@reduxjs/toolkit';
import { userService } from '../../services/userService';
import { User } from '../../types/user';

// Fetch users who liked a content (answer or question)
export const fetchLikedUsers = createAsyncThunk<User[], string[]>(
  'likes/fetchLikedUsers',
  async (userIds, { rejectWithValue }) => {
    try {
      const users = await Promise.all(userIds.map((id) => userService.getUserById(id)));
      return users.filter((u): u is User => u !== null);
    } catch (error) {
      return rejectWithValue('Failed to fetch liked users');
    }
  },
);
