// Route validation is for navigation only; the backend remains authoritative.
export const validResourceId = (raw) =>
  typeof raw === "string" && /^(?:[1-9][0-9]*)$/.test(raw) && Number.isSafeInteger(Number(raw));

export const accessFailure = (error) => {
  const status = error?.response?.status;
  if (status === 401) return "login";
  if (status === 403 || status === 404) return "denied";
  return "unavailable";
};

export const matchesWorkspace = (project, workspaceId) =>
  !workspaceId || (validResourceId(workspaceId) && String(project?.workspaceId) === workspaceId);
