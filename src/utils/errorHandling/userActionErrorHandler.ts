import { captureError } from '../../config/sentry';

// User Action Error Handler
export const handleUserActionError = (
  error: Error,
  action: string,
  userContext: Record<string, any> = {},
  context: Record<string, any> = {}
): Record<string, any> => {
  const errorInfo = {
    message: error.message,
    userAction: action,
    userContext,
    ...context,
  };

  captureError(error, {
    tags: {
      type: 'user_action_error',
      action: action,
    },
    extra: errorInfo,
  });

  return errorInfo;
};
