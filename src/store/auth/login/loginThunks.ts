import { createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from '../../../services/authService';
import { LoginCredentials, LoginResponse } from '../../../types/user';
import { handleReduxError, handleApiError } from '../../../utils/errorHandling';
import { setAdminPermissions } from '../authSlice';
import logger from '../../../utils/logger';

// Genişletilmiş login credentials interface
interface ExtendedLoginCredentials extends LoginCredentials {
  rememberMe?: boolean;
}

export const loginUser = createAsyncThunk<
  LoginResponse,
  ExtendedLoginCredentials,
  { rejectValue: string }
>('auth/login', async (credentials, { rejectWithValue, getState, dispatch }) => {
  try {
    const response = await authService.login(credentials);
    localStorage.setItem('token', response.token);

    // Login sonrası admin permission'ları kontrol et
    try {
      const adminPermissions = await authService.checkAdminPermissions();
      dispatch(setAdminPermissions(adminPermissions));
      logger.auth.success('Admin permissions checked after login');
    } catch (permissionError) {
      logger.auth.error('Failed to check admin permissions after login', permissionError);
      // Admin permission kontrolü başarısız olsa bile login devam etsin
      dispatch(
        setAdminPermissions({
          hasAdminPermission: false,
          permissions: [],
        }),
      );
    }

    logger.redux.action('auth/loginUser/fulfilled', { user: response.user });
    return response;
  } catch (error: any) {
    logger.auth.failure(credentials.email, error);

    handleApiError(error, {
      action: 'login',
      credentials: { email: credentials.email },
    });
    handleReduxError(error, { type: 'auth/login' }, getState(), {
      action: 'login',
      credentials: { email: credentials.email },
    });

    // Return more specific error message
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      'Login failed. Please check your credentials.';

    return rejectWithValue(errorMessage);
  }
});
