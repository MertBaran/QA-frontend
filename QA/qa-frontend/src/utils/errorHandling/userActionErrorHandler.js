import { captureError } from "../../config/sentry";

// User Action Error Handler
export const handleUserActionError = (
  error,
  action,
  userContext = {},
  context = {}
) => {
  const errorInfo = {
    message: error.message,
    userAction: action,
    userContext,
    ...context,
  };

  captureError(error, {
    tags: {
      type: "user_action_error",
      action: action,
    },
    extra: errorInfo,
  });

  return errorInfo;
};
