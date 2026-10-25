export function parseWorkspaceId(value) {
  if (!/^[1-9]\d*$/.test(String(value ?? ""))) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) ? number : null;
}

export function isWorkspaceAdmin(workspace) {
  return workspace?.role === "WORKSPACE_ADMIN";
}

export function isWorkspaceArchived(workspace) {
  return Boolean(workspace?.archivedAt);
}

export function teamMemberLabel(member) {
  const name = [member.firstName, member.lastName].filter(Boolean).join(" ").trim();
  return name || member.email || `User ${member.userId}`;
}

export function errorMessage(error, fallback = "Request failed. Please try again.") {
  const data = error?.response?.data;
  switch (data?.code) {
    case "WORKSPACE_ARCHIVED": return "This workspace is archived and cannot be modified.";
    case "CONFLICT": return "A team with this name already exists in this workspace.";
    case "ACCESS_DENIED": return "You don't have permission to make this change.";
    case "RESOURCE_NOT_FOUND": return "The workspace or team is unavailable, or you don't have access.";
    case "VALIDATION_ERROR": return data.message || "Please check the submitted fields.";
    case "BAD_REQUEST": return data.message || "The request could not be accepted.";
    case "AUTHENTICATION_ERROR": return "Your session has expired. Please sign in again.";
    default: return fallback;
  }
}

export function isAbort(error) {
  return error?.code === "ERR_CANCELED" || error?.name === "CanceledError" || error?.name === "AbortError";
}

export const emptyPage = Object.freeze({ content: [], page: 0, size: 20, totalElements: 0, totalPages: 0 });
