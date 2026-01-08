import api from './api';
import { UserData, User, UserResponse, UsersResponse, UpdateProfileData } from '../types/user';

// Backend'den gelen ham veriyi frontend formatına dönüştürme
const transformUserData = (userData: UserData): User => {
  return {
    id: userData._id,
    name: userData.name,
    email: userData.email,
    roles: userData.roles,
    title: userData.title,
    about: userData.about,
    place: userData.place,
    website: userData.website,
    profile_image: userData.profile_image,
    blocked: userData.blocked,
    createdAt: userData.createdAt,
    language: userData.language,
    notificationPreferences: userData.notificationPreferences,
    followersCount: userData.followersCount,
    followingCount: userData.followingCount,
    isFollowing: userData.isFollowing,
    background_asset_key: userData.background_asset_key,
  };
};

class UserService {
  // Tüm kullanıcıları getir (admin)
  async getAllUsers(): Promise<User[]> {
    try {
      const response = await api.get<UsersResponse>('/admin/users');
      if (response.data.success && response.data.data) {
        return response.data.data.map(transformUserData);
      }
      return [];
    } catch (error) {
      console.error('Kullanıcılar getirilirken hata:', error);
      return [];
    }
  }

  // Tek kullanıcı getir (public)
  async getUserById(id: string): Promise<User | null> {
    try {
      const response = await api.get<UserResponse>(`/public/users/${id}`);
      if (response.data.success && response.data.data) {
        return transformUserData(response.data.data);
      }
      return null;
    } catch (error) {
      console.error('Kullanıcı getirilirken hata:', error);
      return null;
    }
  }

  // Kullanıcıyı engelle/engelini kaldır (admin)
  async toggleUserBlock(id: string): Promise<User | null> {
    try {
      const response = await api.get<UserResponse>(`/admin/block/${id}`);
      if (response.data.success && response.data.data) {
        return transformUserData(response.data.data);
      }
      return null;
    } catch (error) {
      console.error('Kullanıcı engelleme hatası:', error);
      throw error;
    }
  }

  // Kullanıcıyı sil (admin)
  async deleteUser(id: string): Promise<boolean> {
    try {
      const response = await api.delete(`/admin/delete/${id}`);
      return response.data.success || false;
    } catch (error) {
      console.error('Kullanıcı silme hatası:', error);
      throw error;
    }
  }

  // Profil bilgilerini güncelle
  async updateProfile(profileData: UpdateProfileData): Promise<User | null> {
    try {
      const response = await api.put<UserResponse>('/auth/edit', profileData);
      if (response.data.success && response.data.data) {
        return transformUserData(response.data.data);
      }
      return null;
    } catch (error) {
      console.error('Profil güncellenirken hata:', error);
      throw error;
    }
  }

  // Profil resmi yükle
  async uploadProfileImage(formData: FormData): Promise<string | null> {
    try {
      const response = await api.post<{ success: boolean; data: { profile_image: string } }>(
        '/auth/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );
      if (response.data.success && response.data.data) {
        return response.data.data.profile_image;
      }
      return null;
    } catch (error) {
      console.error('Profil resmi yüklenirken hata:', error);
      throw error;
    }
  }

  // Mevcut kullanıcı bilgilerini getir
  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await api.get<UserResponse>('/auth/profile');
      if (response.data.success && response.data.data) {
        return transformUserData(response.data.data);
      }
      return null;
    } catch (error) {
      console.error('Mevcut kullanıcı bilgileri getirilirken hata:', error);
      return null;
    }
  }

  // Kullanıcı rollerini getir
  async getUserRoles(userId: string): Promise<string[]> {
    try {
      const response = await api.get<{ success: boolean; data: string[] }>(
        `/users/${userId}/roles`,
      );
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error('Kullanıcı rolleri getirilirken hata:', error);
      return [];
    }
  }

  // Kullanıcıya rol ata (admin)
  async assignRoleToUser(userId: string, roleId: string): Promise<boolean> {
    try {
      const response = await api.post('/permissions/assign-role', {
        userId,
        roleId,
      });
      return response.data.success || false;
    } catch (error) {
      console.error('Rol atama hatası:', error);
      throw error;
    }
  }

  // Kullanıcıdan rol kaldır (admin)
  async removeRoleFromUser(userId: string, roleId: string): Promise<boolean> {
    try {
      const response = await api.post('/permissions/remove-role', {
        userId,
        roleId,
      });
      return response.data.success || false;
    } catch (error) {
      console.error('Rol kaldırma hatası:', error);
      throw error;
    }
  }

  // Follow user
  async followUser(userId: string): Promise<boolean> {
    try {
      const response = await api.post<{ success: boolean; data: { message: string } }>(
        `/public/users/${userId}/follow`
      );
      return response.data.success || false;
    } catch (error) {
      console.error('Kullanıcı takip edilirken hata:', error);
      throw error;
    }
  }

  // Unfollow user
  async unfollowUser(userId: string): Promise<boolean> {
    try {
      const response = await api.post<{ success: boolean; data: { message: string } }>(
        `/public/users/${userId}/unfollow`
      );
      return response.data.success || false;
    } catch (error) {
      console.error('Kullanıcı takibi bırakılırken hata:', error);
      throw error;
    }
  }

  // Get followers
  async getFollowers(userId: string): Promise<User[]> {
    try {
      const response = await api.get<UsersResponse>(`/public/users/${userId}/followers`);
      if (response.data.success && response.data.data) {
        return response.data.data.map(transformUserData);
      }
      return [];
    } catch (error) {
      console.error('Takipçiler getirilirken hata:', error);
      return [];
    }
  }

  // Get following
  async getFollowing(userId: string): Promise<User[]> {
    try {
      const response = await api.get<UsersResponse>(`/public/users/${userId}/following`);
      if (response.data.success && response.data.data) {
        return response.data.data.map(transformUserData);
      }
      return [];
    } catch (error) {
      console.error('Takip edilenler getirilirken hata:', error);
      return [];
    }
  }
}

export const userService = new UserService();
