import { User } from '../types/user';
import { ApiResponse } from '../types/api';
import api from './api';
import logger from '../utils/logger';

export interface AdminUser extends User {
  lastLogin?: string;
  loginCount?: number;
  isOnline?: boolean;
}

export interface UserFilters {
  search?: string;
  searchType?: 'contains' | 'starts_with' | 'ends_with' | 'exact';
  emailFilter?: 'all' | 'verified' | 'unverified';
  status?: 'all' | 'active' | 'blocked';
  role?: 'all' | 'admin' | 'moderator' | 'user';
  dateFrom?: string;
  dateTo?: string;
  dateOperator?: 'after' | 'before' | 'between' | 'exact';
  lastLoginOperator?: 'all' | 'today' | 'this_week' | 'this_month' | 'never';
  isOnline?: boolean;
}

export interface UsersResponse {
  users: AdminUser[];
  total: number;
  page: number;
  limit: number;
}

export const adminService = {
  // Kullanıcıları getir
  getUsers: async (
    filters: UserFilters = {},
    page: number = 1,
    limit: number = 10,
  ): Promise<UsersResponse> => {
    try {
      const params = new URLSearchParams();

      if (filters.search) params.append('search', filters.search);
      if (filters.status && filters.status !== 'all') params.append('status', filters.status);
      if (filters.role && filters.role !== 'all') params.append('role', filters.role);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.isOnline !== undefined) params.append('isOnline', filters.isOnline.toString());

      params.append('page', page.toString());
      params.append('limit', limit.toString());

      const response = await api.get<ApiResponse<UsersResponse>>(
        `/admin/users?${params.toString()}`,
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error('Failed to fetch users');
    } catch (error) {
      logger.error('Failed to get users:', error);
      throw error;
    }
  },

  // Kullanıcı güncelle
  updateUser: async (userId: string, userData: Partial<AdminUser>): Promise<AdminUser> => {
    try {
      const response = await api.put<ApiResponse<AdminUser>>(`/admin/users/${userId}`, userData);

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error('Failed to update user');
    } catch (error) {
      logger.error('Failed to update user:', error);
      throw error;
    }
  },

  // Kullanıcı sil
  deleteUser: async (userId: string): Promise<void> => {
    try {
      const response = await api.delete<ApiResponse<null>>(`/admin/users/${userId}`);

      if (!response.data.success) {
        throw new Error('Failed to delete user');
      }
    } catch (error) {
      logger.error('Failed to delete user:', error);
      throw error;
    }
  },

  // Kullanıcı engelle/engel kaldır
  toggleUserBlock: async (userId: string, blocked: boolean): Promise<AdminUser> => {
    try {
      const response = await api.patch<ApiResponse<AdminUser>>(`/admin/users/${userId}/block`, {
        blocked,
      });

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error('Failed to toggle user block status');
    } catch (error) {
      logger.error('Failed to toggle user block:', error);
      throw error;
    }
  },

  // Kullanıcı rollerini güncelle
  updateUserRoles: async (userId: string, roles: string[]): Promise<AdminUser> => {
    try {
      const response = await api.patch<ApiResponse<AdminUser>>(`/admin/users/${userId}/roles`, {
        roles,
      });

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error('Failed to update user roles');
    } catch (error) {
      logger.error('Failed to update user roles:', error);
      throw error;
    }
  },

  // Kullanıcı istatistikleri
  getUserStats: async (): Promise<{
    total: number;
    active: number;
    blocked: number;
    online: number;
    newThisMonth: number;
  }> => {
    try {
      const response = await api.get<
        ApiResponse<{
          total: number;
          active: number;
          blocked: number;
          online: number;
          newThisMonth: number;
        }>
      >('/admin/users/stats');

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error('Failed to fetch user stats');
    } catch (error) {
      logger.error('Failed to get user stats:', error);
      throw error;
    }
  },
};
