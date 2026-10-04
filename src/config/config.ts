const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
const apiOrigin = apiBaseUrl.replace(/\/api\/?$/, '') || 'http://localhost:3000';

const config = {
  // API Configuration
  API_BASE_URL: apiBaseUrl,

  // Backend origin (for health check - /health is at root, not under /api)
  API_ORIGIN: apiOrigin,

  // App Configuration
  APP_NAME: 'QA Platform',

  // Environment
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Request timeout (10 seconds)
  REQUEST_TIMEOUT: 10000,

  // Backend health check interval (ms)
  BACKEND_HEALTH_CHECK_INTERVAL: 30000,
};

export default config; 