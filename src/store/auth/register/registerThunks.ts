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
