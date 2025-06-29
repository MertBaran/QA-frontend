import { captureMessage } from "../../config/sentry";

// Network Error Handler
export const handleNetworkError = (error, context = {}) => {
  const errorInfo = {
    message: error.message,
    type: "network_error",
    ...context,
  };

  captureMessage("Network Error", "error", errorInfo);

  return errorInfo;
};

// Custom Network Error Class
export class NetworkError extends Error {
  constructor(message) {
    super(message);
    this.name = "NetworkError";
  }
}
