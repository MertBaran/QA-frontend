import { setUserContext } from "../../../config/sentry";

export const logoutReducer = (state) => {
  state.user = null;
  state.isAuthenticated = false;
  state.error = null;
  localStorage.removeItem("token");
  setUserContext(null);
};

export const clearErrorReducer = (state) => {
  state.error = null;
};

// Get Current User
export const getCurrentUserPending = (state) => {
  state.loading = true;
};
export const getCurrentUserFulfilled = (state, action) => {
  state.loading = false;
  state.user = action.payload;
  state.isAuthenticated = true;
  setUserContext(action.payload);
};
export const getCurrentUserRejected = (state) => {
  state.loading = false;
  state.user = null;
  state.isAuthenticated = false;
  setUserContext(null);
}; 