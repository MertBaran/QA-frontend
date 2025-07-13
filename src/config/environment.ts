// Environment Configuration
type EnvironmentConfig = {
  apiUrl: string;
  sentryDsn?: string;
  appName: string;
  appVersion: string;
  isDevelopment: boolean;
  isProduction: boolean;
  isTest: boolean;
  enableAnalytics: boolean;
  enableDebugMode: boolean;
  enableMockApi: boolean;
  logLevel: string;
};

export const config: EnvironmentConfig = {
  apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  sentryDsn: process.env.REACT_APP_SENTRY_DSN,
  appName: process.env.REACT_APP_NAME || 'QA Platform',
  appVersion: process.env.REACT_APP_VERSION || '1.0.0',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
  enableAnalytics: process.env.REACT_APP_ENABLE_ANALYTICS === 'true',
  enableDebugMode: process.env.REACT_APP_ENABLE_DEBUG_MODE === 'true',
  enableMockApi: process.env.REACT_APP_ENABLE_MOCK_API === 'true',
  logLevel: process.env.REACT_APP_LOG_LEVEL || 'info',
};

export const validateEnvironment = (): boolean => {
  const required = ['REACT_APP_API_URL'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.warn('Missing environment variables:', missing);
  }

  return missing.length === 0;
};

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