import { createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from '../../../services/authService';
import { RegisterData, LoginResponse } from '../../../types/user';
import { handleReduxError, handleApiError } from '../../../utils/errorHandling';

export const registerUser = createAsyncThunk<
  LoginResponse,
  RegisterData,
  { rejectValue: string }
>(
  'auth/register',
  async (userData, { rejectWithValue, getState }) => {
    try {
      const response = await authService.register(userData);
      localStorage.setItem('access_token', response.token);
      return response;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string; message?: string } }; message?: string };
      handleApiError(axiosError as Parameters<typeof handleApiError>[0], {
        action: 'register',
        userData: { email: userData.email },
      });
      handleReduxError(error as Error, { type: 'auth/register' }, getState(), {
        action: 'register',
        userData: { email: userData.email },
      });
      const data = axiosError.response?.data;
      const errorMessage =
        data?.error || data?.message ||
        (error instanceof Error ? error.message : undefined) ||
        'Registration failed';
      return rejectWithValue(errorMessage);
    }
  }
);
