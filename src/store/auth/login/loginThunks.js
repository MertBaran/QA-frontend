import { createAsyncThunk } from "@reduxjs/toolkit";
import { authService } from "../../../services/authService";
import { handleReduxError, handleApiError } from "../../../utils/errorHandling";
import logger from "../../../utils/logger";

export const loginUser = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue, getState }) => {
    try {
      const response = await authService.login(credentials);
      localStorage.setItem("token", response.token);
      logger.redux.action("auth/loginUser/fulfilled", { user: response.user });
      return response;
    } catch (error) {
      logger.auth.failure(credentials.email, error);
      
      handleApiError(error, {
        action: "login",
        credentials: { email: credentials.email },
      });
      handleReduxError(error, { type: "auth/login" }, getState(), {
        action: "login",
        credentials: { email: credentials.email },
      });
      
      // Return more specific error message
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          "Login failed. Please check your credentials.";
      
      return rejectWithValue(errorMessage);
    }
  }
); 