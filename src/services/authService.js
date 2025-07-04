import api from "./api";
import logger from "../utils/logger";

export const authService = {
  register: async (userData) => {
    logger.auth.register(userData.email);
    const response = await api.post("/auth/register", userData);
    return response.data;
  },

  login: async (credentials) => {
    logger.auth.login(credentials.email);
    const response = await api.post("/auth/login", credentials);
    logger.auth.success(response.data.user);
    return response.data;
  },

  logout: async () => {
    logger.auth.logout();
    const response = await api.get("/auth/logout");
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get("/auth/profile");
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get("/auth/profile");
    return response.data;
  },

  editProfile: async (userData) => {
    const response = await api.put("/auth/edit", userData);
    return response.data;
  },

  uploadImage: async (formData) => {
    const response = await api.post("/auth/upload", formData);
    return response.data;
  },

  forgotPassword: async (email) => {
    const response = await api.post("/auth/forgotpassword", { email });
    return response.data;
  },

  resetPassword: async (token, password) => {
    const response = await api.put(
      `/auth/resetpassword?resetPasswordToken=${token}`,
      { password }
    );
    return response.data;
  },
};
