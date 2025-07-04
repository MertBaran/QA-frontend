import { captureError } from "../../config/sentry";

// Validation Error Handler
export const handleValidationError = (error, formData = {}, context = {}) => {
  const errorInfo = {
    message: error.message,
    field: error.field,
    formData,
    ...context,
  };

  captureError(error, {
    tags: {
      type: "validation_error",
      form: context.formName || "unknown",
    },
    extra: errorInfo,
  });

  return errorInfo;
};

// Custom Validation Error Class
export class ValidationError extends Error {
  constructor(message, field, formName) {
    super(message);
    this.name = "ValidationError";
    this.field = field;
    this.formName = formName;
  }
}
