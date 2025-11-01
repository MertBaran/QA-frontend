import axios, { AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import config from '../config/config';
import logger from '../utils/logger';
import { getStoredToken, isTokenValidAndNotExpired, forceLogout } from '../utils/tokenUtils';
import { showWarningToast, showErrorToast } from '../utils/notificationUtils';
import { t } from '../utils/translations';
import { store } from '../store';

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

    // Token'ı header'a ekle (kontrol etme, sadece ekle)
    const token = getStoredToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    logger.api.error('request', error.config?.url ?? '', error.message);
    return Promise.reject(error);
  },
);

// Response interceptor for debugging and 401 handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    logger.api.response(
      response.config.method ?? '',
      response.config.url ?? '',
      response.status,
      response.data,
    );
    return response;
  },
  (error: AxiosError) => {
    logger.api.error(error.config?.method ?? '', error.config?.url ?? '', error);

    // 401 hatası durumunda akıllı kontrol
    if (error.response?.status === 401) {
      const lang = store.getState().language.currentLanguage;
      // Token expire olduğunda otomatik logout yap
      if (!isTokenValidAndNotExpired()) {
        showErrorToast(t('session_expired', lang));
        forceLogout();
      } else {
        showWarningToast(t('unauthorized_action', lang));
      }
    }

    return Promise.reject(error);
  },
);

export default api;
