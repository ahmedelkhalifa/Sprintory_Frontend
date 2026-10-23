/**
 * Turn an axios error into a message the page can show.
 * Pass page-specific texts per status code, plus a fallback:
 * getErrorMessage(err, { 404: "Project not found.", fallback: "Couldn't load the project." })
 */
export function getErrorMessage(err, messages = {}) {
  if (!err.response) return "Can't reach the server. Please try again later.";

  const { status } = err.response;
  if (messages[status]) return messages[status];
  if (status === 403) return "You don't have access to this.";
  return messages.fallback || "Something went wrong. Please try again.";
}
