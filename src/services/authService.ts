import { User } from '../models/User';
import { ApiResponse } from '../types/api';
import api from './api';
import logger from '../utils/logger';

export interface RegisterData {
  email: string;
  password: string;
  name?: string;
  // Diğer register alanları eklenebilir
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  // Diğer response alanları eklenebilir
}

export const authService = {
  register: async (userData: RegisterData): Promise<ApiResponse<User>> => {
    const response = await api.post<ApiResponse<User>>(
      '/auth/register',
      userData
    );
    return response.data;
  },

  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    logger.auth.login(credentials.email);
    const response = await api.post<ApiResponse<{ data: User; token: string }>>(
      '/auth/login',
      credentials
    );
    const { token, user } = response.data; // backend'den gelen user bilgisi
    logger.auth.success(user);
    // Diğer kodlar user objesini beklediği için ekle:
    return { token, user };
  },

  logout: async (): Promise<ApiResponse<null>> => {
    logger.auth.logout();
    const response = await api.get<ApiResponse<null>>('/auth/logout');
    return response.data;
  },

  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    const response = await api.get<ApiResponse<User>>('/auth/profile');
    return response.data;
  },

  getProfile: async (): Promise<ApiResponse<User>> => {
    const response = await api.get<ApiResponse<User>>('/auth/profile');
    return response.data;
  },

  editProfile: async (userData: Partial<User>): Promise<ApiResponse<User>> => {
    const response = await api.put<ApiResponse<User>>('/auth/edit', userData);
    return response.data;
  },

  uploadImage: async (formData: FormData): Promise<ApiResponse<User>> => {
    const response = await api.post<ApiResponse<User>>(
      '/auth/upload',
      formData
    );
    return response.data;
  },

  forgotPassword: async (email: string): Promise<ApiResponse<null>> => {
    const response = await api.post<ApiResponse<null>>('/auth/forgotpassword', {
      email,
    });
    return response.data;
  },

  resetPassword: async (
    token: string,
    password: string
  ): Promise<ApiResponse<null>> => {
    const response = await api.put<ApiResponse<null>>(
      `/auth/resetpassword?resetPasswordToken=${token}`,
      { password }
    );
    return response.data;
  },
};
