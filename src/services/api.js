import axios from "axios";
import config from "../config/config";
import logger from "../utils/logger";

// Create axios instance with default config
const api = axios.create({
  baseURL: config.API_BASE_URL,
  withCredentials: true, // Important for cookies
  headers: {
    "Content-Type": "application/json",
  },
  timeout: config.REQUEST_TIMEOUT,
});

// Request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    logger.api.request(config.method, config.url, config.data);
    return config;
  },
  (error) => {
    logger.error("Request interceptor error", error);
    return Promise.reject(error);
  }
);

// Response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    logger.api.response(response.config.method, response.config.url, response.status, response.data);
    return response;
  },
  (error) => {
    logger.api.error(error.config?.method, error.config?.url, error);
    return Promise.reject(error);
  }
);

export default api;
