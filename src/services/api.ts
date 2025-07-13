import axios, {
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';
import config from '../config/config';
import logger from '../utils/logger';

// Create axios instance with default config
const api = axios.create({
  baseURL: config.API_BASE_URL,
  withCredentials: true, // Important for cookies
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: config.REQUEST_TIMEOUT,
});

// Token'ı her istekte Authorization header'a ekle
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    logger.api.request(config.method ?? '', config.url ?? '', config.data);
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    logger.api.error('request', error.config?.url ?? '', error.message);
    return Promise.reject(error);
  }
);

// Response interceptor for debugging
api.interceptors.response.use(
  (response: AxiosResponse) => {
    logger.api.response(
      response.config.method ?? '',
      response.config.url ?? '',
      response.status,
      response.data
    );
    return response;
  },
  (error: AxiosError) => {
    logger.api.error(error.config?.method ?? '', error.config?.url ?? '', error);
    return Promise.reject(error);
  }
);

export default api;
