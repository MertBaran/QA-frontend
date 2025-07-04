import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  loading: false,
  error: null,
  user: null,
  isAuthenticated: false,
};

const loginSlice = createSlice({
  name: "login",
  initialState,
  reducers: {
    setLoading: (state) => {
      state.loading = true;
      state.error = null;
    },
    setSuccess: (state, action) => {
      state.loading = false;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.error = null;
    },
    setError: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    resetLogin: (state) => {
      state.loading = false;
      state.error = null;
      state.user = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setLoading, setSuccess, setError, resetLogin } = loginSlice.actions;
export default loginSlice.reducer; 