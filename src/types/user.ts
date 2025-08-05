import { ApiResponse } from './api';

// Backend'den gelecek ham user tipi
export interface UserData {
  _id: string;
  name: string;
  email: string;
  roles: string[];
  title?: string;
  about?: string;
  place?: string;
  website?: string;
  profile_image: string;
  blocked: boolean;
  createdAt?: string;
  language?: string;
  notificationPreferences?: {
    email: boolean;
    push: boolean;
    sms: boolean;
    webhook: boolean;
  };
}

// Frontend'de kullanılacak dönüştürülmüş user tipi
export interface User {
  id: string;
  name: string;
  email: string;
  roles: string[];
  title?: string;
  about?: string;
  place?: string;
  website?: string;
  profile_image: string;
  blocked: boolean;
  createdAt?: string;
  language?: string;
  notificationPreferences?: {
    email: boolean;
    push: boolean;
    sms: boolean;
    webhook: boolean;
  };
}

// Kullanıcı kayıt için tip
export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

// Kullanıcı giriş için tip
export interface LoginCredentials {
  email: string;
  password: string;
}

// Kullanıcı giriş response tipi
export interface LoginResponse {
  token: string;
  user: User;
}

// Profil güncelleme için tip
export interface UpdateProfileData {
  name?: string;
  title?: string;
  about?: string;
  place?: string;
  website?: string;
  language?: string;
  notificationPreferences?: {
    email?: boolean;
    push?: boolean;
    sms?: boolean;
    webhook?: boolean;
  };
}

// Şifre sıfırlama için tip
export interface ResetPasswordData {
  token: string;
  newPassword: string;
}

// API Response tipleri
export interface UserResponse extends ApiResponse<UserData> {}
export interface UsersResponse extends ApiResponse<UserData[]> {}
export interface LoginResponseData extends ApiResponse<{ data: UserData; token: string }> {}
