import api from "./client";

// fired after any change to the workspace list, so WorkspaceProvider can reload it
export const WORKSPACES_CHANGED = "workspaces:changed";

const notifyChanged = (data) => {
  window.dispatchEvent(new Event(WORKSPACES_CHANGED));
  return data;
};

// every workspace the user belongs to; each one carries the user's role and archivedAt
export const listWorkspaces = (signal) =>
  api.get("/workspaces", { signal }).then((res) => res.data);

export const getWorkspace = (workspaceId, signal) =>
  api.get(`/workspaces/${workspaceId}`, { signal }).then((res) => res.data);

// params: { q, page, size }
export const listWorkspaceMembers = (workspaceId, params, signal) =>
  api.get(`/workspaces/${workspaceId}/members`, { params, signal }).then((res) => res.data);

// admin only; role is WORKSPACE_ADMIN or WORKSPACE_MEMBER. 409 LAST_WORKSPACE_ADMIN when it would leave
// the workspace without an admin (also when the admin demotes themselves). Returns the WorkspaceMemberResponse
export const changeWorkspaceMemberRole = (workspaceId, userId, role) =>
  api.patch(`/workspaces/${workspaceId}/members/${userId}`, { role }).then((res) => notifyChanged(res.data));

export const createWorkspace = (name) =>
  api.post("/workspaces", { name }).then((res) => notifyChanged(res.data));

export const renameWorkspace = (workspaceId, name) =>
  api.patch(`/workspaces/${workspaceId}`, { name }).then((res) => notifyChanged(res.data));

export const archiveWorkspace = (workspaceId) =>
  api.post(`/workspaces/${workspaceId}/archive`).then((res) => notifyChanged(res.data));

export const restoreWorkspace = (workspaceId) =>
  api.post(`/workspaces/${workspaceId}/restore`).then((res) => notifyChanged(res.data));

// only allowed once the workspace is archived (otherwise WORKSPACE_NOT_ARCHIVED)
export const deleteWorkspace = (workspaceId) =>
  api.delete(`/workspaces/${workspaceId}`).then(() => notifyChanged());

// returns { invited: [...emails], alreadyMembers: [...emails] }
export const inviteMembers = (workspaceId, emails) =>
  api.post(`/workspaces/${workspaceId}/invitations`, { emails }).then((res) => res.data);

// works without login; returns { workspaceName, email }. 404 once the link is expired, used or replaced
export const lookupInvitation = (token, signal) =>
  api.post("/invitations/lookup", { token }, { signal }).then((res) => res.data);

// the logged-in email must be the invited one (else 403); returns the joined workspace,
// also when the user was already a member
export const acceptInvitation = (token) =>
  api.post("/invitations/accept", { token }).then((res) => notifyChanged(res.data));
