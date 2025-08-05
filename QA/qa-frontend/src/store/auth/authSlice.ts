import { createSlice } from '@reduxjs/toolkit';
import { getCurrentUser, logoutUser } from './authThunks';
import { loginUser } from './login/loginThunks';
import {
  logoutReducer,
  clearErrorReducer,
  getCurrentUserPending,
  getCurrentUserFulfilled,
  getCurrentUserRejected,
} from './reducers/authReducers';
import logger from '../../utils/logger';
import { AuthState } from './authState';

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  // Admin permission state'leri
  hasAdminPermission: false,
  roles: [],
  adminPermissionLoading: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: logoutReducer,
    clearError: clearErrorReducer,
    // Admin permission actions
    setAdminPermissions: (state, action) => {
      state.hasAdminPermission = action.payload.hasAdminPermission;
      state.roles = action.payload.roles;
      state.adminPermissionLoading = false;
    },
    setAdminPermissionLoading: (state, action) => {
      state.adminPermissionLoading = action.payload;
    },
    clearAdminPermissions: (state) => {
      state.hasAdminPermission = false;
      state.roles = [];
      state.adminPermissionLoading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login cases
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        logger.redux.state('auth', { loading: true, error: null });
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.error = null;
        // Login sonrası admin permission'ları temizle (yeniden check edilecek)
        state.hasAdminPermission = false;
        state.roles = [];
        logger.redux.state('auth', {
          user: action.payload.user,
          isAuthenticated: true,
        });
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.user = null;
        state.isAuthenticated = false;
        // Login başarısız olduğunda admin permission'ları temizle
        state.hasAdminPermission = false;
        state.roles = [];
        logger.redux.state('auth', {
          error: action.payload,
          isAuthenticated: false,
        });
      })
      // Get current user cases
      .addCase(getCurrentUser.pending, getCurrentUserPending)
      .addCase(getCurrentUser.fulfilled, getCurrentUserFulfilled)
      .addCase(getCurrentUser.rejected, getCurrentUserRejected)
      // Logout cases
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        logger.redux.state('auth', { loading: true, error: null });
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
        state.hasAdminPermission = false;
        state.roles = [];
        logger.redux.state('auth', {
          user: null,
          isAuthenticated: false,
        });
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.user = null;
        state.isAuthenticated = false;
        state.hasAdminPermission = false;
        state.roles = [];
        logger.redux.state('auth', {
          error: action.payload,
          isAuthenticated: false,
        });
      });
  },
});

export const {
  logout,
  clearError,
  setAdminPermissions,
  setAdminPermissionLoading,
  clearAdminPermissions,
} = authSlice.actions;
export default authSlice.reducer;
