import { createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from '../../services/authService';
import { handleReduxError, handleApiError } from '../../utils/errorHandling';
import type { AxiosError } from 'axios';

export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue, getState }) => {
    try {
      const response = await authService.getCurrentUser();
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
      if (error && typeof error === 'object' && 'message' in error && typeof (error as any).message === 'string') {
        message = (error as any).message;
      }
      return rejectWithValue(message);
    }
  }
);
