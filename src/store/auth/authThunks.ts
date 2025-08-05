import { createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from '../../services/authService';
import { handleReduxError, handleApiError } from '../../utils/errorHandling';
import type { AxiosError } from 'axios';
import { setAdminPermissions, setAdminPermissionLoading } from './authSlice';
import logger from '../../utils/logger';

export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue, getState, dispatch }) => {
    try {
      const response = await authService.getCurrentUser();

      // Kullanıcı varsa admin permission'ları kontrol et
      if (response) {
        // User'ın roles'ına bakarak admin olup olmadığını kontrol et
        const hasAdminRole =
          response.roles &&
          response.roles.some((role: string) => role === 'admin' || role === 'Admin');

        dispatch(
          setAdminPermissions({
            hasAdminPermission: hasAdminRole,
            roles: response.roles || [],
          }),
        );

        logger.auth.success('Admin permissions checked for current user');
      }

      return response;
    } catch (error: unknown) {
      localStorage.removeItem('token');
      handleApiError(error as AxiosError, {
        action: 'getCurrentUser',
      });
      handleReduxError(error as Error, { type: 'auth/getCurrentUser' }, getState(), {
        action: 'getCurrentUser',
      });
      let message = 'Failed to get user';
      if (
        error &&
        typeof error === 'object' &&
        'message' in error &&
        typeof (error as any).message === 'string'
      ) {
        message = (error as any).message;
      }
      return rejectWithValue(message);
    }
  },
);

// Admin permission check thunk
export const checkAdminPermissions = createAsyncThunk(
  'auth/checkAdminPermissions',
  async (_, { dispatch }) => {
    try {
      dispatch(setAdminPermissionLoading(true));
      logger.auth.action('check_admin_permissions');

      const result = await authService.checkAdminPermissions();

      dispatch(
        setAdminPermissions({
          hasAdminPermission: result.hasAdminPermission,
          roles: result.permissions || [],
        }),
      );

      logger.auth.success({
        hasAdminPermission: result.hasAdminPermission,
        permissionCount: result.permissions.length,
      });

      return result;
    } catch (error) {
      logger.auth.error('check_admin_permissions_failed', error);
      dispatch(
        setAdminPermissions({
          hasAdminPermission: false,
          roles: [],
        }),
      );
      throw error;
    }
  },
);
