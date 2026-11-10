// friendlier text for codes whose backend message is too generic for the UI;
// every other code shows the backend message, which is safe to display
const MESSAGES = {
  VALIDATION_ERROR: "Please check the entered values.",
  ACCESS_DENIED: "You don't have permission to do this.",
  RESOURCE_NOT_FOUND: "Not found, or you don't have access.",
  CONFLICT: "That name is already in use.",
  NETWORK_ERROR: "Can't reach the server.",
};

const GENERIC = "Something went wrong. Please try again.";

// no response at all means the request never reached the backend
export const errorCode = (err) => (err?.response ? err.response.data?.code : "NETWORK_ERROR");

// `overrides` are a page's own texts by code, e.g. { BAD_REQUEST: "This team no longer exists." }; an override of
// null means "the backend's own message for this code", e.g. { CONFLICT: null } where CONFLICT isn't a taken name
export const errorMessage = (err, fallback = GENERIC, overrides = {}) => {
  const code = errorCode(err);
  const backend = err?.response?.data?.message;
  if (code in overrides && overrides[code] === null) return backend ?? fallback;
  return overrides[code] ?? MESSAGES[code] ?? backend ?? fallback;
};

// a request cancelled by an effect cleanup, not a real failure
export const isAbort = (err) => err?.code === "ERR_CANCELED";
