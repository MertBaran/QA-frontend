import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';
import { User } from '../models/User';
import type { SeverityLevel } from '@sentry/types';

export const initSentry = (): void => {
  const dsn = process.env.REACT_APP_SENTRY_DSN;
  if (!dsn || dsn === 'YOUR_SENTRY_DSN_HERE') {
    console.log('Sentry initialized in development mode (no DSN)');
    Sentry.init({
      dsn: 'https://dummy@dummy.ingest.sentry.io/dummy',
      integrations: [new BrowserTracing()],
      tracesSampleRate: 1.0,
      environment: 'development',
      release: '1.0.0',
      sampleRate: 1.0,
      beforeSend(event) {
        console.log('Sentry Error (development):', event);
        return null;
      },
    });
    return;
  }
  Sentry.init({
    dsn: dsn,
    integrations: [new BrowserTracing()],
    tracesSampleRate: 1.0,
    environment: process.env.NODE_ENV || 'development',
    release: process.env.REACT_APP_VERSION || '1.0.0',
    sampleRate: 1.0,
    beforeSend(event) {
      console.log('Sentry Error:', event);
      if (event.exception && event.exception.values) {
        const errorMessage = event.exception.values[0].value;
        if (typeof errorMessage === 'string' && errorMessage.includes('Network Error')) {
          return null;
        }
      }
      return event;
    },
    beforeBreadcrumb(breadcrumb) {
      return breadcrumb;
    },
  });
};

export const setUserContext = (user: User | null): void => {
  if (user) {
    Sentry.setUser({
      id: user._id,
      email: user.email,
      username: user.name,
    });
  } else {
    Sentry.setUser(null);
  }
};

export const setExtraContext = (key: string, value: unknown): void => {
  Sentry.setExtra(key, value);
};

export const setTag = (key: string, value: string): void => {
  Sentry.setTag(key, value);
};

export const captureError = (error: unknown, context: Record<string, unknown> = {}): void => {
  console.log('Sentry Error (development):', error, context);
  Sentry.captureException(error, {
    extra: context,
  });
};

export const captureMessage = (message: string, level: string = 'info', context: Record<string, unknown> = {}): void => {
  console.log('Sentry Message (development):', message, level, context);
  Sentry.captureMessage(message, {
    level: level as SeverityLevel,
    extra: context,
  });
}; 