import { User, UserData, RegisterData, LoginCredentials, LoginResponse } from '../types/user';
import { ApiResponse } from '../types/api';
import api from './api';
import logger from '../utils/logger';
import { setStoredToken, removeStoredToken } from '../utils/tokenUtils';

export const authService = {
  register: async (registerData: RegisterData): Promise<LoginResponse> => {
    const response = await api.post<{
      success: boolean;
      access_token: string;
      data: UserData;
    }>('/auth/register', registerData, { timeout: 30000 });

    if (!response.data.success || !response.data.data) {
      throw new Error('Register response data is missing');
    }

    const { access_token: token, data: backendUserData } = response.data;

    // Token'ı localStorage'a kaydet
    setStoredToken(token);

    const user: User = {
      id: backendUserData._id,
      name: backendUserData.name,
      email: backendUserData.email,
      roles: backendUserData.roles || [],
      title: backendUserData.title,
      about: backendUserData.about,
      place: backendUserData.place,
      website: backendUserData.website,
      profile_image: backendUserData.profile_image,
      blocked: backendUserData.blocked,
      createdAt: backendUserData.createdAt,
      language: backendUserData.language,
      notificationPreferences: backendUserData.notificationPreferences,
    };

    return { token, user };
  },

  login: async (
    credentials: LoginCredentials & { rememberMe?: boolean; captchaToken?: string },
  ): Promise<LoginResponse> => {
    logger.auth.login(credentials.email);

    const response = await api.post<{
      success: boolean;
      access_token: string;
      data: UserData;
    }>('/auth/login', credentials);

    if (!response.data.success || !response.data.data) {
      throw new Error('Login response data is missing');
    }

    const { access_token: token, data: userData } = response.data;

    // Token'ı localStorage'a kaydet
    setStoredToken(token);

    // User verisini dönüştür
    const user: User = {
      id: userData._id,
      name: userData.name,
      email: userData.email,
      roles: userData.roles || [],
      title: userData.title,
      about: userData.about,
      place: userData.place,
      website: userData.website,
      profile_image: userData.profile_image,
      blocked: userData.blocked,
      createdAt: userData.createdAt,
      language: userData.language,
      notificationPreferences: userData.notificationPreferences,
    };

    logger.auth.success(user);
    return { token, user };
  },

  logout: async (): Promise<ApiResponse<null>> => {
    logger.auth.logout();
    const response = await api.get<ApiResponse<null>>('/auth/logout');

    // Token'ı localStorage'dan sil
    removeStoredToken();

    return response.data;
  },

  getCurrentUser: async (): Promise<User | null> => {
    try {
      const response = await api.get<{
        success: boolean;
        data: UserData;
      }>('/auth/profile');

      if (response.data.success && response.data.data) {
        return {
          id: response.data.data._id,
          name: response.data.data.name,
          email: response.data.data.email,
          roles: response.data.data.roles || [],
          title: response.data.data.title,
          about: response.data.data.about,
          place: response.data.data.place,
          website: response.data.data.website,
          profile_image: response.data.data.profile_image,
          blocked: response.data.data.blocked,
          createdAt: response.data.data.createdAt,
          language: response.data.data.language,
          notificationPreferences: response.data.data.notificationPreferences,
        };
      }
      return null;
    } catch (error) {
      logger.error('Failed to get current user:', error);
      return null;
    }
  },

  // Admin permission check fonksiyonu
  checkAdminPermissions: async (): Promise<{
    hasAdminPermission: boolean;
    permissions: string[];
  }> => {
    try {
      const response = await api.get<{
        success: boolean;
        hasAdminPermission: boolean;
        permissions: string[];
      }>('/auth/check-admin-permissions');

      if (response.data.success) {
        return {
          hasAdminPermission: response.data.hasAdminPermission,
          permissions: response.data.permissions,
        };
      }

      return {
        hasAdminPermission: false,
        permissions: [],
      };
    } catch (error) {
      logger.error('Failed to check admin permissions:', error);
      return {
        hasAdminPermission: false,
        permissions: [],
      };
    }
  },

  getProfile: async (): Promise<User | null> => {
    return authService.getCurrentUser();
  },

  editProfile: async (userData: Partial<User>): Promise<User | null> => {
    try {
      const response = await api.put<{
        success: boolean;
        data: UserData;
      }>('/auth/edit', userData);

      if (response.data.success && response.data.data) {
        return {
          id: response.data.data._id,
          name: response.data.data.name,
          email: response.data.data.email,
          roles: response.data.data.roles || [],
          title: response.data.data.title,
          about: response.data.data.about,
          place: response.data.data.place,
          website: response.data.data.website,
          profile_image: response.data.data.profile_image,
          blocked: response.data.data.blocked,
          createdAt: response.data.data.createdAt,
          language: response.data.data.language,
          notificationPreferences: response.data.data.notificationPreferences,
        };
      }
      return null;
    } catch (error) {
      console.error('Profil güncellenirken hata:', error);
      throw error;
    }
  },

  uploadImage: async (formData: FormData): Promise<ApiResponse<{ profile_image: string }>> => {
    const response = await api.post<ApiResponse<{ profile_image: string }>>(
      '/auth/upload',
      formData,
    );
    return response.data;
  },

  forgotPassword: async (email: string): Promise<ApiResponse<null>> => {
    const response = await api.post<ApiResponse<null>>('/auth/forgotpassword', {
      email,
    });
    return response.data;
  },

  resetPassword: async (token: string, password: string): Promise<ApiResponse<null>> => {
    const response = await api.put<ApiResponse<null>>('/auth/resetpassword', {
      token,
      newPassword: password,
    });
    return response.data;
  },

  requestPasswordChange: async (oldPassword: string | undefined, newPassword: string): Promise<ApiResponse<null>> => {
    const response = await api.post<ApiResponse<null>>('/auth/change-password/request', {
      oldPassword,
      newPassword,
    });
    return response.data;
  },

  verifyPasswordChangeCode: async (code: string): Promise<ApiResponse<{ verificationToken: string }>> => {
    const response = await api.post<ApiResponse<{ verificationToken: string }>>('/auth/change-password/verify', {
      code,
    });
    return response.data;
  },

  confirmPasswordChange: async (verificationToken: string, newPassword: string): Promise<ApiResponse<null>> => {
    const response = await api.post<ApiResponse<null>>('/auth/change-password/confirm', {
      verificationToken,
      newPassword,
    });
    return response.data;
  },
};
