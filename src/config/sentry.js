import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

// Initialize Sentry
export const initSentry = () => {
  const dsn = process.env.REACT_APP_SENTRY_DSN;

  // For personal projects, we can use a fallback DSN or initialize without it
  if (!dsn || dsn === 'YOUR_SENTRY_DSN_HERE') {
    console.log('Sentry initialized in development mode (no DSN)');
    // Initialize with a dummy DSN for development
    Sentry.init({
      dsn: 'https://dummy@dummy.ingest.sentry.io/dummy', // Dummy DSN
      integrations: [new BrowserTracing()],
      tracesSampleRate: 1.0,
      environment: 'development',
      release: '1.0.0',
      sampleRate: 1.0,
      beforeSend(event) {
        // In development, log to console and don't send to Sentry
        console.log('Sentry Error (development):', event);
        return null; // Don't send to Sentry in development
      },
    });
    return;
  }

  Sentry.init({
    dsn: dsn,
    integrations: [new BrowserTracing()],

    // Performance monitoring
    tracesSampleRate: 1.0, // 100% of transactions for development

    // Environment
    environment: process.env.NODE_ENV || 'development',

    // Release version
    release: process.env.REACT_APP_VERSION || '1.0.0',

    // Error sampling
    sampleRate: 1.0, // 100% of errors for development

    // Before send hook - filter out certain errors
    beforeSend(event) {
      // Temporarily allow errors in development for testing
      console.log('Sentry Error:', event);
      
      // Filter out network errors if needed
      if (event.exception && event.exception.values) {
        const errorMessage = event.exception.values[0].value;
        if (errorMessage.includes('Network Error')) {
          return null; // Don't send network errors
        }
      }

      return event; // Send all other errors to Sentry
    },

    // Add user context
    beforeBreadcrumb(breadcrumb) {
      return breadcrumb;
    },
  });
};

// Set user context
export const setUserContext = user => {
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

// Set extra context
export const setExtraContext = (key, value) => {
  Sentry.setExtra(key, value);
};

// Set tag
export const setTag = (key, value) => {
  Sentry.setTag(key, value);
};

// Capture error manually
export const captureError = (error, context = {}) => {
  console.log('Sentry Error (development):', error, context);
  Sentry.captureException(error, {
    extra: context,
  });
};

// Capture message
export const captureMessage = (message, level = 'info', context = {}) => {
  console.log('Sentry Message (development):', message, level, context);
  Sentry.captureMessage(message, {
    level,
    extra: context,
  });
};
