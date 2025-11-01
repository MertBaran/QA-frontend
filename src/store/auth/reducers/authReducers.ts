import { setUserContext } from '../../../config/sentry';
import { AuthState } from '../authState';

export const logoutReducer = (state: AuthState) => {
  state.user = null;
  state.isAuthenticated = false;
  state.error = null;
  state.hasAdminPermission = false;
  state.roles = [];
  localStorage.removeItem('access_token');
  localStorage.removeItem('token'); // Eski token'ı da temizle
  setUserContext(null);
};

export const clearErrorReducer = (state: AuthState) => {
  state.error = null;
};

// Get Current User
export const getCurrentUserPending = (state: AuthState) => {
  state.loading = true;
};
export const getCurrentUserFulfilled = (state: AuthState, action: { payload: any }) => {
  state.loading = false;
  state.user = action.payload;
  state.isAuthenticated = true;
  setUserContext(action.payload);

  // Admin permission'ları kontrol et ve set et
  if (action.payload && action.payload.roles && Array.isArray(action.payload.roles)) {
    const hasAdminRole = action.payload.roles.some(
      (role: string) => role === 'admin' || role === 'Admin',
    );
    state.hasAdminPermission = hasAdminRole;
    state.roles = action.payload.roles;
  } else {
    state.hasAdminPermission = false;
    state.roles = [];
  }
};
export const getCurrentUserRejected = (state: AuthState) => {
  state.loading = false;
  state.user = null;
  state.isAuthenticated = false;
  state.hasAdminPermission = false;
  state.roles = [];
  setUserContext(null);
};
