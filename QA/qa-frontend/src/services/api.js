import axios from "axios";
import config from "../config/config";

// Create axios instance with default config
const api = axios.create({
  baseURL: config.API_BASE_URL,
  withCredentials: true, // Important for cookies
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
