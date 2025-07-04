import { captureError } from "../../config/sentry";

// Redux Error Handler
export const handleReduxError = (error, action, state, context = {}) => {
  const errorInfo = {
    message: error.message,
    action: action.type,
    actionPayload: action.payload,
    stateSnapshot: state,
    ...context,
  };

  captureError(error, {
    tags: {
      type: "redux_error",
      action: action.type,
    },
    extra: errorInfo,
  });

  return errorInfo;
};
