// Errors from the backend look like { status, code, message, path, fieldErrors? }.
// We branch on `code`, never on `message` (messages may be reworded, but are safe to show).

// no response at all: the backend is down or unreachable
export const NETWORK_ERROR = "NETWORK_ERROR";

export function getErrorCode(err) {
  if (!err.response) return NETWORK_ERROR;
  return err.response.data?.code ?? "UNKNOWN";
}

/**
 * Message to show for an error. Pass page-specific texts per code, plus a fallback:
 * getErrorMessage(err, { RESOURCE_NOT_FOUND: "Project not found.", fallback: "Couldn't load the project." })
 * Order: our text for the code -> the backend's message -> the fallback.
 */
export function getErrorMessage(err, messages = {}) {
  const code = getErrorCode(err);
  if (code === NETWORK_ERROR) return "Can't reach the server. Please try again later.";
  return messages[code] || err.response.data?.message || messages.fallback || "Something went wrong. Please try again.";
}

// { field: message } from a VALIDATION_ERROR, or {} for any other error
export function getFieldErrors(err) {
  return getErrorCode(err) === "VALIDATION_ERROR" ? (err.response.data.fieldErrors ?? {}) : {};
}
