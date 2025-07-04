import { captureError } from "../../config/sentry";

// Performance Error Handler
export const handlePerformanceError = (
  error,
  performanceData = {},
  context = {}
) => {
  const errorInfo = {
    message: error.message,
    performance: performanceData,
    ...context,
  };

  captureError(error, {
    tags: {
      type: "performance_error",
    },
    extra: errorInfo,
  });

  return errorInfo;
};
