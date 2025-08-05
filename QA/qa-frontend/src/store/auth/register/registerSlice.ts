import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  loading: false,
  error: null,
  user: null,
  isRegistered: false,
};

const registerSlice = createSlice({
  name: 'register',
  initialState,
  reducers: {
    setLoading: state => {
      state.loading = true;
      state.error = null;
    },
    setSuccess: (state, action) => {
      state.loading = false;
      state.user = action.payload.user;
      state.isRegistered = true;
      state.error = null;
    },
    setError: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    resetRegister: state => {
      state.loading = false;
      state.error = null;
      state.user = null;
      state.isRegistered = false;
    },
  },
});

export const { setLoading, setSuccess, setError, resetRegister } =
  registerSlice.actions;
export default registerSlice.reducer;
