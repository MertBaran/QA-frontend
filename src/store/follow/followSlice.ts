import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { followUser, unfollowUser, getFollowers, getFollowing } from './followThunks';
import { User } from '../../types/user';

interface FollowState {
  followersModalOpen: boolean;
  followingModalOpen: boolean;
  followers: User[];
  following: User[];
  followersLoading: boolean;
  followingLoading: boolean;
  followersError: string | null;
  followingError: string | null;
}

const initialState: FollowState = {
  followersModalOpen: false,
  followingModalOpen: false,
  followers: [],
  following: [],
  followersLoading: false,
  followingLoading: false,
  followersError: null,
  followingError: null,
};

const followSlice = createSlice({
  name: 'follow',
  initialState,
  reducers: {
    openFollowersModal: (state) => {
      state.followersModalOpen = true;
    },
    closeFollowersModal: (state) => {
      state.followersModalOpen = false;
      state.followers = [];
      state.followersError = null;
    },
    openFollowingModal: (state) => {
      state.followingModalOpen = true;
    },
    closeFollowingModal: (state) => {
      state.followingModalOpen = false;
      state.following = [];
      state.followingError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get followers
      .addCase(getFollowers.pending, (state) => {
        state.followersLoading = true;
        state.followersError = null;
      })
      .addCase(getFollowers.fulfilled, (state, action) => {
        state.followersLoading = false;
        state.followers = action.payload;
        state.followersError = null;
      })
      .addCase(getFollowers.rejected, (state, action) => {
        state.followersLoading = false;
        state.followersError = action.payload || 'Failed to get followers';
      })
      // Get following
      .addCase(getFollowing.pending, (state) => {
        state.followingLoading = true;
        state.followingError = null;
      })
      .addCase(getFollowing.fulfilled, (state, action) => {
        state.followingLoading = false;
        state.following = action.payload;
        state.followingError = null;
      })
      .addCase(getFollowing.rejected, (state, action) => {
        state.followingLoading = false;
        state.followingError = action.payload || 'Failed to get following';
      });
  },
});

export const { 
  openFollowersModal, 
  closeFollowersModal, 
  openFollowingModal, 
  closeFollowingModal 
} = followSlice.actions;

export default followSlice.reducer;
