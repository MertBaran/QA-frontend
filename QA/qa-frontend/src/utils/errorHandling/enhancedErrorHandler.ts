import logger from '../logger';

// Error types
export const ERROR_TYPES = {
  NETWORK: 'NETWORK',
  SERVER: 'SERVER',
  VALIDATION: 'VALIDATION',
  AUTHENTICATION: 'AUTHENTICATION',
  AUTHORIZATION: 'AUTHORIZATION',
  NOT_FOUND: 'NOT_FOUND',
  TIMEOUT: 'TIMEOUT',
  UNKNOWN: 'UNKNOWN',
};

// Error severity levels
export const ERROR_SEVERITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
};

type ErrorContext = Record<string, any>;
type OperationFn = () => Promise<any>;

// Enhanced Error Handler
export class EnhancedErrorHandler {
  retryCount: number;
  maxRetries: number;
  retryDelay: number;

  constructor() {
    this.retryCount = 0;
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 second
  }

  // Detect error type from error object
  detectErrorType(error: any): string {
    // Network errors
    if (
      error.message?.includes('Network Error') ||
      error.code === 'NETWORK_ERROR' ||
      !navigator.onLine
    ) {
      return ERROR_TYPES.NETWORK;
    }

    // Timeout errors
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return ERROR_TYPES.TIMEOUT;
    }

    // HTTP status based errors
    if (error.response?.status) {
      const status = error.response.status;

      switch (status) {
        case 400:
          return ERROR_TYPES.VALIDATION;
        case 401:
          return ERROR_TYPES.AUTHENTICATION;
        case 403:
          return ERROR_TYPES.AUTHORIZATION;
        case 404:
          return ERROR_TYPES.NOT_FOUND;
        case 408:
        case 429:
          return ERROR_TYPES.TIMEOUT;
        case 500:
        case 502:
        case 503:
        case 504:
          return ERROR_TYPES.SERVER;
        default:
          return ERROR_TYPES.UNKNOWN;
      }
    }

    return ERROR_TYPES.UNKNOWN;
  }

  // Get error severity
  getErrorSeverity(errorType: string, context: ErrorContext = {}): string {
    switch (errorType) {
      case ERROR_TYPES.NETWORK:
        return ERROR_SEVERITY.MEDIUM;
      case ERROR_TYPES.TIMEOUT:
        return ERROR_SEVERITY.LOW;
      case ERROR_TYPES.VALIDATION:
        return ERROR_SEVERITY.LOW;
      case ERROR_TYPES.AUTHENTICATION:
        return ERROR_SEVERITY.MEDIUM;
      case ERROR_TYPES.AUTHORIZATION:
        return ERROR_SEVERITY.MEDIUM;
      case ERROR_TYPES.NOT_FOUND:
        return ERROR_SEVERITY.LOW;
      case ERROR_TYPES.SERVER:
        return ERROR_SEVERITY.HIGH;
      case ERROR_TYPES.UNKNOWN:
        return ERROR_SEVERITY.MEDIUM;
      default:
        return ERROR_SEVERITY.MEDIUM;
    }
  }

  // Get user-friendly error message
  getUserFriendlyMessage(
    errorType: string,
    error: any,
    context: ErrorContext = {}
  ): string {
    const defaultMessages = {
      [ERROR_TYPES.NETWORK]:
        'İnternet bağlantınızı kontrol edin ve tekrar deneyin.',
      [ERROR_TYPES.TIMEOUT]:
        'İşlem zaman aşımına uğradı. Lütfen tekrar deneyin.',
      [ERROR_TYPES.VALIDATION]: 'Lütfen girdiğiniz bilgileri kontrol edin.',
      [ERROR_TYPES.AUTHENTICATION]:
        'Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.',
      [ERROR_TYPES.AUTHORIZATION]:
        'Bu işlemi gerçekleştirmek için yetkiniz bulunmuyor.',
      [ERROR_TYPES.NOT_FOUND]: 'Aradığınız içerik bulunamadı.',
      [ERROR_TYPES.SERVER]:
        'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.',
      [ERROR_TYPES.UNKNOWN]:
        'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.',
    };

    // Try to get message from server response
    const serverMessage = error.response?.data?.message;
    if (serverMessage) {
      return serverMessage;
    }

    // Return default message for error type
    return defaultMessages[errorType] || defaultMessages[ERROR_TYPES.UNKNOWN];
  }

  // Check if error is retryable
  isRetryable(errorType: string): boolean {
    const retryableErrors = [
      ERROR_TYPES.NETWORK,
      ERROR_TYPES.TIMEOUT,
      ERROR_TYPES.SERVER,
    ];
    return retryableErrors.includes(errorType);
  }

  // Handle error with retry logic
  async handleWithRetry(
    error: any,
    context: ErrorContext = {}
  ): Promise<Record<string, any>> {
    const errorType = this.detectErrorType(error);
    const severity = this.getErrorSeverity(errorType, context);
    const message = this.getUserFriendlyMessage(errorType, error, context);
    const canRetry = this.isRetryable(errorType);

    // Log error
    logger.error(`Error handled: ${errorType}`, error, {
      errorType,
      severity,
      context,
      canRetry,
      retryCount: this.retryCount,
    });

    // Return error info
    return {
      type: errorType,
      severity,
      message,
      canRetry,
      retryCount: this.retryCount,
      maxRetries: this.maxRetries,
      originalError: error,
      context,
    };
  }

  // Retry function
  async retry(
    operation: OperationFn,
    context: ErrorContext = {}
  ): Promise<any> {
    this.retryCount = 0;

    while (this.retryCount < this.maxRetries) {
      try {
        return await operation();
      } catch (error) {
        this.retryCount++;
        const errorInfo = await this.handleWithRetry(error, context);

        if (!errorInfo.canRetry || this.retryCount >= this.maxRetries) {
          throw errorInfo;
        }

        // Wait before retry
        await this.delay(this.retryDelay * this.retryCount);
      }
    }
  }

  // Delay function
  delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Reset retry count
  reset(): void {
    this.retryCount = 0;
  }
}

// Global error handler instance
export const globalErrorHandler = new EnhancedErrorHandler();

// Utility functions
export const handleError = (
  error: any,
  context: ErrorContext = {}
): Promise<Record<string, any>> => {
  return globalErrorHandler.handleWithRetry(error, context);
};

export const retryOperation = (
  operation: OperationFn,
  context: ErrorContext = {}
): Promise<any> => {
  return globalErrorHandler.retry(operation, context);
};

export const isNetworkError = (error: any): boolean => {
  return globalErrorHandler.detectErrorType(error) === ERROR_TYPES.NETWORK;
};

export const isServerError = (error: any): boolean => {
  return globalErrorHandler.detectErrorType(error) === ERROR_TYPES.SERVER;
};

export const isValidationError = (error: any): boolean => {
  return globalErrorHandler.detectErrorType(error) === ERROR_TYPES.VALIDATION;
};

export default globalErrorHandler;
