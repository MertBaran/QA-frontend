import { createAsyncThunk } from '@reduxjs/toolkit';
import { userService } from '../../services/userService';
import { User } from '../../types/user';

// Follow user
export const followUser = createAsyncThunk<
  boolean,
  string,
  { rejectValue: string }
>('follow/followUser', async (userId, { rejectWithValue }) => {
  try {
    const success = await userService.followUser(userId);
    if (!success) {
      return rejectWithValue('Failed to follow user');
    }
    return success;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to follow user');
  }
});

// Unfollow user
export const unfollowUser = createAsyncThunk<
  boolean,
  string,
  { rejectValue: string }
>('follow/unfollowUser', async (userId, { rejectWithValue }) => {
  try {
    const success = await userService.unfollowUser(userId);
    if (!success) {
      return rejectWithValue('Failed to unfollow user');
    }
    return success;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to unfollow user');
  }
});

// Get followers
export const getFollowers = createAsyncThunk<
  User[],
  string,
  { rejectValue: string }
>('follow/getFollowers', async (userId, { rejectWithValue }) => {
  try {
    const followers = await userService.getFollowers(userId);
    return followers;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to get followers');
  }
});

// Get following
export const getFollowing = createAsyncThunk<
  User[],
  string,
  { rejectValue: string }
>('follow/getFollowing', async (userId, { rejectWithValue }) => {
  try {
    const following = await userService.getFollowing(userId);
    return following;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to get following');
  }
});
