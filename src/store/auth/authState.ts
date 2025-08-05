import { User } from '../../types/user';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  // Admin permission bilgileri
  hasAdminPermission: boolean;
  roles: string[];
  adminPermissionLoading: boolean;
}
