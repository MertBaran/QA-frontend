import { captureError } from '../../config/sentry';

// Performance Error Handler
export const handlePerformanceError = (
  error: Error,
  performanceData: Record<string, any> = {},
  context: Record<string, any> = {}
): Record<string, any> => {
  const errorInfo = {
    message: error.message,
    performance: performanceData,
    ...context,
  };

  captureError(error, {
    tags: {
      type: 'performance_error',
    },
    extra: errorInfo,
  });

  return errorInfo;
};
