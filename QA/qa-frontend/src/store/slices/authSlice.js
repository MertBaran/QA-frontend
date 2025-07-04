import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { authService } from "../../services/authService";
import { handleReduxError, handleApiError } from "../../utils/errorHandling";
import { setUserContext } from "../../config/sentry";

// Async thunks
export const loginUser = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue, getState }) => {
    try {
      const response = await authService.login(credentials);
      localStorage.setItem("token", response.token);
      return response;
    } catch (error) {
      // Handle API error with Sentry
      handleApiError(error, {
        action: "login",
        credentials: { email: credentials.email }, // Don't log password
      });

      // Handle Redux error
      handleReduxError(error, { type: "auth/login" }, getState(), {
        action: "login",
        credentials: { email: credentials.email },
      });

      return rejectWithValue(error.message || "Login failed");
    }
  }
);

export const registerUser = createAsyncThunk(
  "auth/register",
  async (userData, { rejectWithValue, getState }) => {
    try {
      const response = await authService.register(userData);
      localStorage.setItem("token", response.token);
      return response;
    } catch (error) {
      // Handle API error with Sentry
      handleApiError(error, {
        action: "register",
        userData: {
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
        }, // Don't log password
      });

      // Handle Redux error
      handleReduxError(error, { type: "auth/register" }, getState(), {
        action: "register",
        userData: {
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
        },
      });

      return rejectWithValue(error.message || "Registration failed");
    }
  }
);

export const getCurrentUser = createAsyncThunk(
  "auth/getCurrentUser",
  async (_, { rejectWithValue, getState }) => {
    try {
      const response = await authService.getCurrentUser();
      return response;
    } catch (error) {
      localStorage.removeItem("token");

      // Handle API error with Sentry
      handleApiError(error, {
        action: "getCurrentUser",
      });

      // Handle Redux error
      handleReduxError(error, { type: "auth/getCurrentUser" }, getState(), {
        action: "getCurrentUser",
      });

      return rejectWithValue(error.message || "Failed to get user");
    }
  }
);

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem("token");
      // Clear user context in Sentry
      setUserContext(null);
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.error = null;
        // Set user context in Sentry
        setUserContext(action.payload.user);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Register
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.error = null;
        // Set user context in Sentry
        setUserContext(action.payload.user);
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get Current User
      .addCase(getCurrentUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        // Set user context in Sentry
        setUserContext(action.payload);
      })
      .addCase(getCurrentUser.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.isAuthenticated = false;
        // Clear user context in Sentry
        setUserContext(null);
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
