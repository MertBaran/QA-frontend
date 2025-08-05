import { captureError } from '../../config/sentry';

// Redux Error Handler
export const handleReduxError = (
  error: Error,
  action: any,
  state: any,
  context: Record<string, any> = {}
): Record<string, any> => {
  const errorInfo = {
    message: error.message,
    action: action.type,
    actionPayload: action.payload,
    stateSnapshot: state,
    ...context,
  };

  captureError(error, {
    tags: {
      type: 'redux_error',
      action: action.type,
    },
    extra: errorInfo,
  });

  return errorInfo;
};
