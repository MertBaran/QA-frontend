import { createAsyncThunk } from '@reduxjs/toolkit';
import { authService, RegisterData } from '../../../services/authService';
import { ApiResponse } from '../../../types/api';
import { User } from '../../../models/User';
import { handleReduxError, handleApiError } from '../../../utils/errorHandling';

export const registerUser = createAsyncThunk<
  ApiResponse<User>,
  RegisterData,
  { rejectValue: string }
>(
  'auth/register',
  async (userData, { rejectWithValue, getState }) => {
    try {
      const response = await authService.register(userData);
      localStorage.setItem('token', (response as any).token);
      return response;
    } catch (error: any) {
      handleApiError(error, {
        action: 'register',
        userData: {
          email: userData.email,
        },
      });
      handleReduxError(error, { type: 'auth/register' }, getState(), {
        action: 'register',
        userData: {
          email: userData.email,
        },
      });
      return rejectWithValue(error.message || 'Registration failed');
    }
  }
);
