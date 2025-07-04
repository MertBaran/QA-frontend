import { captureError } from "../../config/sentry";

// API Error Handler
export const handleApiError = (error, context = {}) => {
  // Parse request data if it's a string
  let requestData = error.config?.data;
  if (requestData && typeof requestData === 'string') {
    try {
      requestData = JSON.parse(requestData);
    } catch (e) {
      // If parsing fails, keep as string
    }
  }

  // Create safe version of request data (hide sensitive fields)
  const safeRequestData = { ...requestData };
  if (safeRequestData.password) {
    safeRequestData.password = '[HIDDEN]';
  }
  if (safeRequestData.token) {
    safeRequestData.token = '[HIDDEN]';
  }

  const errorInfo = {
    message: error.message,
    status: error.response?.status,
    statusText: error.response?.statusText,
    url: error.config?.url,
    method: error.config?.method,
    requestData: safeRequestData,  // Safe version
    requestHeaders: error.config?.headers,
    responseData: error.response?.data,
    responseHeaders: error.response?.headers,
    // Add debugging info
    hasPassword: !!requestData?.password,
    hasEmail: !!requestData?.email,
    requestDataKeys: requestData ? Object.keys(requestData) : [],
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
      method: error.config?.method,
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
