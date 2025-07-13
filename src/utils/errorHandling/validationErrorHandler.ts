import { captureError } from '../../config/sentry';

// Validation Error Handler
export const handleValidationError = (
  error: Error & { field?: string },
  formData: Record<string, any> = {},
  context: Record<string, any> = {}
): Record<string, any> => {
  const errorInfo = {
    message: error.message,
    field: error.field,
    formData,
    ...context,
  };

  captureError(error, {
    tags: {
      type: 'validation_error',
      form: context.formName || 'unknown',
    },
    extra: errorInfo,
  });

  return errorInfo;
};

// Custom Validation Error Class
export class ValidationError extends Error {
  field?: string;
  formName?: string;

  constructor(message: string, field?: string, formName?: string) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.formName = formName;
  }
}
