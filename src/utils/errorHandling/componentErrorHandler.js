import { captureError } from "../../config/sentry";

// Component Error Handler
export const handleComponentError = (
  error,
  componentName,
  props = {},
  context = {}
) => {
  const errorInfo = {
    message: error.message,
    component: componentName,
    props,
    stack: error.stack,
    ...context,
  };

  captureError(error, {
    tags: {
      type: "component_error",
      component: componentName,
    },
    extra: errorInfo,
  });

  return errorInfo;
};
