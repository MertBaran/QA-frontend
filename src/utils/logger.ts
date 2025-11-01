import * as Sentry from '@sentry/react';

// Environment check
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// Config helpers
type LogLevel = 'debug' | 'info' | 'warn' | 'error';
const LEVEL_WEIGHT: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const getEnv = (key: string, fallback?: string) => {
  const ls =
    typeof window !== 'undefined' ? (window.localStorage?.getItem(key) ?? undefined) : undefined;
  // CRA requires REACT_APP_ prefix for env variables; we try both
  const env = (process.env as any)[key] ?? (process.env as any)[`REACT_APP_${key}`];
  return (ls ?? env ?? fallback) as string | undefined;
};

const parseChannels = (value: string | undefined): Set<string> => {
  if (!value) return new Set<string>();
  return new Set(
    value
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
};

const LOG_LEVEL = (getEnv('LOG_LEVEL', 'warn') as LogLevel) || 'warn';
const ENABLED_CHANNELS = parseChannels(getEnv('LOG_CHANNELS', 'auth')); // default dar: sadece auth
const PERF_THRESHOLD_MS = Number(getEnv('PERF_THRESHOLD_MS', '200')) || 200;

const isLevelEnabled = (level: LogLevel) => LEVEL_WEIGHT[level] >= LEVEL_WEIGHT[LOG_LEVEL];
const isChannelEnabled = (channel: string) => ENABLED_CHANNELS.has(channel.toLowerCase());

const hasReduxDevtools = () =>
  typeof window !== 'undefined' && !!(window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__;

const SENSITIVE_KEYS = new Set(['password', 'pass', 'token', 'authorization', 'auth', 'email']);
const mask = (v: unknown, key?: string): unknown => {
  if (key && SENSITIVE_KEYS.has(key.toLowerCase())) {
    if (key.toLowerCase() === 'email' && typeof v === 'string') {
      const [name, domain] = v.split('@');
      if (!domain) return '***';
      const maskedName = name?.length ? `${name[0]}***` : '***';
      return `${maskedName}@${domain}`;
    }
    return '******';
  }
  return v;
};

const safeSerialize = (data: any, maxLen = 2048): any => {
  try {
    if (data == null) return data;
    if (typeof data === 'string') return data.length > maxLen ? `${data.slice(0, maxLen)}…` : data;
    if (typeof data !== 'object') return data;
    const replacer = (_k: string, v: any) => mask(v, _k);
    const str = JSON.stringify(data, replacer);
    return str.length > maxLen ? `${str.slice(0, maxLen)}…` : JSON.parse(str);
  } catch {
    return '[unserializable]';
  }
};

const getHttpStatus = (error: any): number | undefined => {
  return error?.response?.status ?? error?.status;
};

const getErrorCode = (error: any): string | undefined => {
  return error?.response?.data?.code ?? error?.code;
};

type ErrorCategory =
  | 'auth_user' // kullanıcı hatası: yanlış şifre vb.
  | 'auth' // 401 ancak kullanıcıya özel kod yok
  | 'permission' // 403
  | 'validation' // 422 veya VALIDATION_ERROR
  | 'not_found' // 404
  | 'rate_limit' // 429
  | 'client' // diğer 4xx
  | 'network' // ERR_NETWORK türleri
  | 'timeout' // ECONNABORTED
  | 'server' // 5xx
  | 'unknown';

const classifyError = (error: any): ErrorCategory => {
  try {
    const status = getHttpStatus(error);
    const codeRaw = getErrorCode(error);
    const code = typeof codeRaw === 'string' ? codeRaw.toUpperCase() : undefined;
    const axiosCode = typeof error?.code === 'string' ? error.code.toUpperCase() : undefined;

    if (axiosCode === 'ECONNABORTED') return 'timeout';
    if (axiosCode && axiosCode.includes('NETWORK')) return 'network';

    if (status === 401) {
      if (code === 'AUTH_INVALID_CREDENTIALS' || code === 'AUTH_FAILED') return 'auth_user';
      return 'auth';
    }
    if (status === 403) return 'permission';
    if (status === 404) return 'not_found';
    if (status === 422 || code === 'VALIDATION_ERROR') return 'validation';
    if (status === 429) return 'rate_limit';
    if (typeof status === 'number' && status >= 500) return 'server';
    if (typeof status === 'number' && status >= 400) return 'client';
    return 'unknown';
  } catch {
    return 'unknown';
  }
};

const isReportableError = (error: any): boolean => {
  const category = classifyError(error);
  // Sadece önemli problemler (server/unknown) Sentry'e gitsin
  return category === 'server' || category === 'unknown';
};

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
    if (isDevelopment && isLevelEnabled('debug')) {
      console.log(`[DEBUG] ${message}`, safeSerialize(data));
    }
  },

  // Info logs - only in development
  info: (message, data = null) => {
    if (isDevelopment && isLevelEnabled('info')) {
      console.info(`[INFO] ${message}`, safeSerialize(data));
    }
  },

  // Warning logs - development + production (Sentry)
  warn: (message, data = null) => {
    if (isDevelopment && isLevelEnabled('warn')) {
      console.warn(`[WARN] ${message}`, safeSerialize(data));
    }
    // Varsayılan: warn'ları Sentry'e yollama (yalnızca önemli hatalar Sentry)
  },

  // Error logs - development + production (Sentry)
  error: (message, error = null, context = {}) => {
    if (isDevelopment && isLevelEnabled('error')) {
      console.error(`[ERROR] ${message}`, error);
      if (context) {
        console.error('[ERROR CONTEXT]', safeSerialize(context));
      }
    }
    if (isProduction && isReportableError(error)) {
      Sentry.captureException(error || new Error(message), {
        extra: {
          message,
          context: safeSerialize(context),
        },
      });
    }
  },

  // API logs - only in development
  api: {
    request: (method, url, data = null) => {
      if (isDevelopment && isChannelEnabled('api') && isLevelEnabled('debug')) {
        console.log(`[API REQUEST] ${method.toUpperCase()} ${url}`, safeSerialize(data));
      }
    },
    response: (method, url, status, data = null) => {
      if (isDevelopment && isChannelEnabled('api') && isLevelEnabled('debug')) {
        // Yanıtları yalnızca dev ve açık kanalda göster
        console.log(
          `[API RESPONSE] ${method.toUpperCase()} ${url} (${status})`,
          safeSerialize(data),
        );
      }
      if (status >= 400 && isDevelopment && isLevelEnabled('warn')) {
        console.warn(`[API RESPONSE WARN] ${method.toUpperCase()} ${url} (${status})`);
      }
    },
    error: (method, url, error) => {
      if (isDevelopment && isLevelEnabled('error')) {
        console.error(`[API ERROR] ${method.toUpperCase()} ${url}`, error);
      }
      if (isProduction && isReportableError(error)) {
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
      if (isDevelopment && isChannelEnabled('auth') && isLevelEnabled('info')) {
        console.log(`[AUTH] Login attempt for: ${email ? mask(email, 'email') : ''}`);
      }
    },
    success: (user) => {
      if (isDevelopment && isChannelEnabled('auth') && isLevelEnabled('info')) {
        const id = user?.email || user?.id || '[user]';
        console.log(
          `[AUTH] Login successful for: ${typeof id === 'string' ? mask(id, 'email') : id}`,
        );
      }
    },
    failure: (email, error) => {
      if (isDevelopment && isChannelEnabled('auth') && isLevelEnabled('error')) {
        console.error(`[AUTH] Login failed for: ${email ? mask(email, 'email') : ''}`, error);
      }
      if (isProduction && isReportableError(error)) {
        Sentry.captureException(error, {
          tags: {
            type: 'auth_error',
            action: 'login',
          },
          extra: {
            email: email ? mask(email, 'email') : undefined,
          },
        });
      }
    },
    logout: () => {
      if (isDevelopment && isChannelEnabled('auth') && isLevelEnabled('info')) {
        console.log('[AUTH] User logged out');
      }
    },
    action: (action, data = null) => {
      if (isDevelopment && isChannelEnabled('auth') && isLevelEnabled('debug')) {
        console.log(`[AUTH ACTION] ${action}`, safeSerialize(data));
      }
    },
    error: (action, error) => {
      if (isDevelopment && isChannelEnabled('auth') && isLevelEnabled('error')) {
        console.error(`[AUTH ERROR] ${action}`, error);
      }
      if (isProduction && isReportableError(error)) {
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
      if (
        isDevelopment &&
        isChannelEnabled('redux') &&
        isLevelEnabled('debug') &&
        !hasReduxDevtools()
      ) {
        console.log(`[REDUX] ${actionType}`, safeSerialize(payload));
      }
    },
    state: (sliceName, state) => {
      if (
        isDevelopment &&
        isChannelEnabled('redux') &&
        isLevelEnabled('debug') &&
        !hasReduxDevtools()
      ) {
        console.log(`[REDUX STATE] ${sliceName}`, safeSerialize(state));
      }
    },
  },

  // Performance logs - development + production (Sentry)
  performance: {
    measure: (name, duration, metadata = {}) => {
      if (duration >= PERF_THRESHOLD_MS) {
        if (isDevelopment && isLevelEnabled('info')) {
          console.log(`[PERF] ${name}: ${duration}ms`, safeSerialize(metadata));
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
      }
    },
  },

  // User action logs - only in development
  user: {
    action: (action, data = null) => {
      if (isDevelopment && isChannelEnabled('user') && isLevelEnabled('info')) {
        console.log(`[USER] ${action}`, safeSerialize(data));
      }
    },
    navigation: (from, to) => {
      if (isDevelopment && isChannelEnabled('user') && isLevelEnabled('info')) {
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
