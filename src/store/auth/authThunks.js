import { createAsyncThunk } from "@reduxjs/toolkit";
import { authService } from "../../services/authService";
import { handleReduxError, handleApiError } from "../../utils/errorHandling";

export const getCurrentUser = createAsyncThunk(
  "auth/getCurrentUser",
  async (_, { rejectWithValue, getState }) => {
    try {
      const response = await authService.getCurrentUser();
      return response;
    } catch (error) {
      localStorage.removeItem("token");
      handleApiError(error, {
        action: "getCurrentUser",
      });
      handleReduxError(error, { type: "auth/getCurrentUser" }, getState(), {
        action: "getCurrentUser",
      });
      return rejectWithValue(error.message || "Failed to get user");
    }
  }
); 