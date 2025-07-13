import { setUserContext } from '../../../config/sentry';
import { AuthState } from '../../../models/Auth';

export const logoutReducer = (state: AuthState) => {
  state.user = null;
  state.isAuthenticated = false;
  state.error = null;
  localStorage.removeItem('token');
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
};
export const getCurrentUserRejected = (state: AuthState) => {
  state.loading = false;
  state.user = null;
  state.isAuthenticated = false;
  setUserContext(null);
};
