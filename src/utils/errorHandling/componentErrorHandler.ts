import { captureError } from '../../config/sentry';

// Component Error Handler
export const handleComponentError = (
  error: Error,
  componentName: string,
  props: Record<string, any> = {},
  context: Record<string, any> = {}
): Record<string, any> => {
  const errorInfo = {
    message: error.message,
    component: componentName,
    props,
    stack: error.stack,
    ...context,
  };

  captureError(error, {
    tags: {
      type: 'component_error',
      component: componentName,
    },
    extra: errorInfo,
  });

  return errorInfo;
};
