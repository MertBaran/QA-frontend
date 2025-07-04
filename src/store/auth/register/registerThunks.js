import { createAsyncThunk } from "@reduxjs/toolkit";
import { authService } from "../../../services/authService";
import { handleReduxError, handleApiError } from "../../../utils/errorHandling";

export const registerUser = createAsyncThunk(
  "auth/register",
  async (userData, { rejectWithValue, getState }) => {
    try {
      const response = await authService.register(userData);
      localStorage.setItem("token", response.token);
      return response;
    } catch (error) {
      handleApiError(error, {
        action: "register",
        userData: {
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
        },
      });
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