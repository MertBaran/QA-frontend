import { createSlice } from '@reduxjs/toolkit';
import { fetchLikedUsers, fetchDislikedUsers } from './likesThunks';
import { User } from '../../types/user';

interface LikesState {
  modalOpen: boolean;
  users: User[];
  loading: boolean;
  error: string | null;
  dislikesModalOpen: boolean;
  dislikedUsers: User[];
  dislikesLoading: boolean;
  dislikesError: string | null;
}

const initialState: LikesState = {
  modalOpen: false,
  users: [],
  loading: false,
  error: null,
  dislikesModalOpen: false,
  dislikedUsers: [],
  dislikesLoading: false,
  dislikesError: null,
};

const likesSlice = createSlice({
  name: 'likes',
  initialState,
  reducers: {
    openModal: (state) => {
      state.modalOpen = true;
    },
    closeModal: (state) => {
      state.modalOpen = false;
      state.users = [];
      state.error = null;
    },
    openDislikesModal: (state) => {
      state.dislikesModalOpen = true;
    },
    closeDislikesModal: (state) => {
      state.dislikesModalOpen = false;
      state.dislikedUsers = [];
      state.dislikesError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLikedUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLikedUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
        state.error = null;
      })
      .addCase(fetchLikedUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Failed to fetch liked users';
      })
      .addCase(fetchDislikedUsers.pending, (state) => {
        state.dislikesLoading = true;
        state.dislikesError = null;
      })
      .addCase(fetchDislikedUsers.fulfilled, (state, action) => {
        state.dislikesLoading = false;
        state.dislikedUsers = action.payload;
        state.dislikesError = null;
      })
      .addCase(fetchDislikedUsers.rejected, (state, action) => {
        state.dislikesLoading = false;
        state.dislikesError = (action.payload as string) || 'Failed to fetch disliked users';
      });
  },
});

export const { openModal, closeModal, openDislikesModal, closeDislikesModal } = likesSlice.actions;
export default likesSlice.reducer;
