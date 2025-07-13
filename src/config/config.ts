const config = {
  // API Configuration
  API_BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api',

  // App Configuration
  APP_NAME: 'QA Platform',

  // Environment
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Request timeout (10 seconds)
  REQUEST_TIMEOUT: 10000,
};

export default config; 