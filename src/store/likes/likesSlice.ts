import { createSlice } from '@reduxjs/toolkit';
import { fetchLikedUsers } from './likesThunks';
import { User } from '../../types/user';

interface LikesState {
  modalOpen: boolean;
  users: User[];
  loading: boolean;
  error: string | null;
}

const initialState: LikesState = {
  modalOpen: false,
  users: [],
  loading: false,
  error: null,
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
      });
  },
});

export const { openModal, closeModal } = likesSlice.actions;
export default likesSlice.reducer;
