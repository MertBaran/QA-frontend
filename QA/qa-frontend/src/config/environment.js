// Environment Configuration
export const config = {
  // API Configuration
  apiUrl: process.env.REACT_APP_API_URL || "http://localhost:5000/api",

  // Sentry Configuration
  sentryDsn: process.env.REACT_APP_SENTRY_DSN,

  // App Configuration
  appName: process.env.REACT_APP_NAME || "QA Platform",
  appVersion: process.env.REACT_APP_VERSION || "1.0.0",

  // Environment
  isDevelopment: process.env.NODE_ENV === "development",
  isProduction: process.env.NODE_ENV === "production",
  isTest: process.env.NODE_ENV === "test",

  // Feature Flags
  enableAnalytics: process.env.REACT_APP_ENABLE_ANALYTICS === "true",
  enableDebugMode: process.env.REACT_APP_ENABLE_DEBUG_MODE === "true",
  enableMockApi: process.env.REACT_APP_ENABLE_MOCK_API === "true",

  // Logging
  logLevel: process.env.REACT_APP_LOG_LEVEL || "info",
};

// Validate required environment variables
export const validateEnvironment = () => {
  const required = ["REACT_APP_API_URL"];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.warn("Missing environment variables:", missing);
  }

  return missing.length === 0;
};

// Get environment info for debugging
export const getEnvironmentInfo = () => {
  return {
    nodeEnv: process.env.NODE_ENV,
    apiUrl: config.apiUrl,
    appName: config.appName,
    appVersion: config.appVersion,
    isDevelopment: config.isDevelopment,
    isProduction: config.isProduction,
  };
};
