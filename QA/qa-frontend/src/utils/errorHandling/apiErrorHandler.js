import { captureError } from "../../config/sentry";

// API Error Handler
export const handleApiError = (error, context = {}) => {
  const errorInfo = {
    message: error.message,
    status: error.response?.status,
    statusText: error.response?.statusText,
    url: error.config?.url,
    method: error.config?.method,
    data: error.config?.data,
    response: error.response?.data,
    ...context,
  };

  // Log error to console in development
  if (process.env.NODE_ENV === "development") {
    console.error("API Error:", errorInfo);
  }

  // Capture error in Sentry
  captureError(error, {
    tags: {
      type: "api_error",
      status: error.response?.status,
      endpoint: error.config?.url,
    },
    extra: errorInfo,
  });

  return errorInfo;
};

// Custom API Error Class
export class ApiError extends Error {
  constructor(message, status, response, config) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.response = response;
    this.config = config;
  }
}
