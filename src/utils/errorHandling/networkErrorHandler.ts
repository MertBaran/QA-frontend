import { captureMessage } from '../../config/sentry';

// Network Error Handler
export const handleNetworkError = (
  error: Error,
  context: Record<string, any> = {}
): Record<string, any> => {
  const errorInfo = {
    message: error.message,
    type: 'network_error',
    ...context,
  };

  captureMessage('Network Error', 'error', errorInfo);

  return errorInfo;
};

// Custom Network Error Class
export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}
