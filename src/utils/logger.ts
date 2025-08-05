import * as Sentry from '@sentry/react';

// Environment check
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// Logger utility
type LogData = any;
type LogContext = Record<string, any>;

type Logger = {
  debug: (message: string, data?: LogData) => void;
  info: (message: string, data?: LogData) => void;
  warn: (message: string, data?: LogData) => void;
  error: (message: string, error?: any, context?: LogContext) => void;
  api: {
    request: (method: string, url: string, data?: LogData) => void;
    response: (method: string, url: string, status: number, data?: LogData) => void;
    error: (method: string, url: string, error: any) => void;
  };
  auth: {
    login: (email: string) => void;
    success: (user: { email?: string } | any) => void;
    failure: (email: string, error: any) => void;
    logout: () => void;
    action: (action: string, data?: LogData) => void;
    error: (action: string, error: any) => void;
  };
  redux: {
    action: (actionType: string, payload?: LogData) => void;
    state: (sliceName: string, state: LogData) => void;
  };
  performance: {
    measure: (name: string, duration: number, metadata?: LogData) => void;
  };
  user: {
    action: (action: string, data?: LogData) => void;
    navigation: (from: string, to: string) => void;
  };
};

const logger: Logger = {
  // Debug logs - only in development
  debug: (message, data = null) => {
    if (isDevelopment) {
      console.log(`[DEBUG] ${message}`, data);
    }
  },

  // Info logs - only in development
  info: (message, data = null) => {
    if (isDevelopment) {
      console.info(`[INFO] ${message}`, data);
    }
  },

  // Warning logs - development + production (Sentry)
  warn: (message, data = null) => {
    if (isDevelopment) {
      console.warn(`[WARN] ${message}`, data);
    }
    if (isProduction) {
      Sentry.captureMessage(message, {
        level: 'warning',
        extra: data,
      });
    }
  },

  // Error logs - development + production (Sentry)
  error: (message, error = null, context = {}) => {
    if (isDevelopment) {
      console.error(`[ERROR] ${message}`, error);
      if (context) {
        console.error('[ERROR CONTEXT]', context);
      }
    }
    if (isProduction) {
      Sentry.captureException(error || new Error(message), {
        extra: {
          message,
          context,
        },
      });
    }
  },

  // API logs - only in development
  api: {
    request: (method, url, data = null) => {
      if (isDevelopment) {
        console.log(`[API REQUEST] ${method.toUpperCase()} ${url}`, data);
      }
    },
    response: (method, url, status, data = null) => {
      if (isDevelopment) {
        console.log(`[API RESPONSE] ${method.toUpperCase()} ${url} (${status})`, data);
      }
    },
    error: (method, url, error) => {
      if (isDevelopment) {
        console.error(`[API ERROR] ${method.toUpperCase()} ${url}`, error);
      }
      if (isProduction) {
        Sentry.captureException(error, {
          tags: {
            type: 'api_error',
            method: method.toUpperCase(),
            url,
          },
        });
      }
    },
  },

  // Auth logs - only in development
  auth: {
    login: (email) => {
      if (isDevelopment) {
        console.log(`[AUTH] Login attempt for: ${email}`);
      }
    },
    success: (user) => {
      if (isDevelopment) {
        console.log(`[AUTH] Login successful for: ${user?.email || JSON.stringify(user)}`);
      }
    },
    failure: (email, error) => {
      if (isDevelopment) {
        console.error(`[AUTH] Login failed for: ${email}`, error);
      }
      if (isProduction) {
        Sentry.captureException(error, {
          tags: {
            type: 'auth_error',
            action: 'login',
          },
          extra: {
            email,
          },
        });
      }
    },
    logout: () => {
      if (isDevelopment) {
        console.log('[AUTH] User logged out');
      }
    },
    action: (action, data = null) => {
      if (isDevelopment) {
        console.log(`[AUTH ACTION] ${action}`, data);
      }
    },
    error: (action, error) => {
      if (isDevelopment) {
        console.error(`[AUTH ERROR] ${action}`, error);
      }
      if (isProduction) {
        Sentry.captureException(error, {
          tags: {
            type: 'auth_error',
            action,
          },
        });
      }
    },
  },

  // Redux logs - only in development
  redux: {
    action: (actionType, payload = null) => {
      if (isDevelopment) {
        console.log(`[REDUX] ${actionType}`, payload);
      }
    },
    state: (sliceName, state) => {
      if (isDevelopment) {
        console.log(`[REDUX STATE] ${sliceName}`, state);
      }
    },
  },

  // Performance logs - development + production (Sentry)
  performance: {
    measure: (name, duration, metadata = {}) => {
      if (isDevelopment) {
        console.log(`[PERF] ${name}: ${duration}ms`, metadata);
      }
      if (isProduction) {
        Sentry.addBreadcrumb({
          category: 'performance',
          message: name,
          data: {
            duration,
            ...metadata,
          },
        });
      }
    },
  },

  // User action logs - only in development
  user: {
    action: (action, data = null) => {
      if (isDevelopment) {
        console.log(`[USER] ${action}`, data);
      }
    },
    navigation: (from, to) => {
      if (isDevelopment) {
        console.log(`[NAVIGATION] ${from} → ${to}`);
      }
    },
  },
};

// Export logger
export default logger;

// Named exports for specific use cases
export const { debug, info, warn, error } = logger;
export const { api, auth, redux, performance, user } = logger;
