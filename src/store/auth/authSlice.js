import { createSlice } from "@reduxjs/toolkit";
import { getCurrentUser } from "./authThunks";
import { loginUser } from "./login/loginThunks";
import {
  logoutReducer,
  clearErrorReducer,
  getCurrentUserPending,
  getCurrentUserFulfilled,
  getCurrentUserRejected,
} from "./reducers/authReducers";
import logger from "../../utils/logger";

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: logoutReducer,
    clearError: clearErrorReducer,
  },
  extraReducers: (builder) => {
    builder
      // Login cases
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        logger.redux.state("auth", { loading: true, error: null });
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.error = null;
        logger.redux.state("auth", { 
          user: action.payload.user, 
          isAuthenticated: true 
        });
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.user = null;
        state.isAuthenticated = false;
        logger.redux.state("auth", { 
          error: action.payload, 
          isAuthenticated: false 
        });
      })
      // Get current user cases
      .addCase(getCurrentUser.pending, getCurrentUserPending)
      .addCase(getCurrentUser.fulfilled, getCurrentUserFulfilled)
      .addCase(getCurrentUser.rejected, getCurrentUserRejected);
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
