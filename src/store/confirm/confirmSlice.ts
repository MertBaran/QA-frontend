import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { ConfirmOptions } from '../../services/confirmService';

export interface ConfirmState {
  open: boolean;
  options: ConfirmOptions | null;
}

const initialState: ConfirmState = {
  open: false,
  options: null,
};

const confirmSlice = createSlice({
  name: 'confirm',
  initialState,
  reducers: {
    showConfirm: (state, action: PayloadAction<ConfirmOptions>) => {
      state.open = true;
      state.options = action.payload;
    },
    hideConfirm: (state) => {
      state.open = false;
      state.options = null;
    },
  },
});

export const confirmActions = confirmSlice.actions;
export default confirmSlice.reducer;
