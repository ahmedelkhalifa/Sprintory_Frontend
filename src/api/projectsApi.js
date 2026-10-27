import api from "./client";

// plain members only get the projects they are in
// params: { q, page, size, status } (status is ASSUMED until R30, see below)
export const listProjects = (workspaceId, params, signal) =>
  api.get(`/workspaces/${workspaceId}/projects`, { params, signal }).then((res) => res.data);

// key (unique in the workspace, 409 PROJECT_KEY_TAKEN) and template (SCRUM / KANBAN) are required and can never
// change; description is optional. The creator becomes Project Manager; the board gets the template's columns
export const createProject = (workspaceId, { name, key, template, description }) =>
  api.post(`/workspaces/${workspaceId}/projects`, { name, key, template, description }).then((res) => res.data);

// needs EDIT_SETTINGS; only name and description. A field left out stays as it is, description "" clears it
export const updateProject = (projectId, { name, description }) =>
  api.patch(`/projects/${projectId}`, { name, description }).then((res) => res.data);

// roles and permissions in the response are the caller's own
export const getProject = (projectId, signal) =>
  api.get(`/projects/${projectId}`, { signal }).then((res) => res.data);

// params: { q, page, size }
export const listProjectMembers = (projectId, params, signal) =>
  api.get(`/projects/${projectId}/members`, { params, signal }).then((res) => res.data);

// needs VIEW_WORK (a workspace admin who isn't a member gets 403); { template, backlogEnabled, sprintsEnabled,
// wipLimitsEnabled, activeSprintId, columns: [{ id, name, position, wipLimit }] } with the columns in order
export const getBoard = (projectId, signal) =>
  api.get(`/projects/${projectId}/board`, { signal }).then((res) => res.data);

// needs MANAGE_MEMBERS; all or nothing: every id must be a workspace member, at most 100 per request
export const addProjectMembers = (projectId, userIds) =>
  api.post(`/projects/${projectId}/members`, { userIds });

// needs MANAGE_MEMBERS; a one-time copy of the team's current members
export const addTeamToProject = (projectId, teamId) =>
  api.post(`/projects/${projectId}/teams`, { teamId });

// needs MANAGE_MEMBERS; the last Project Manager can't be removed (LAST_PROJECT_MANAGER)
export const removeProjectMember = (projectId, userId) =>
  api.delete(`/projects/${projectId}/members/${userId}`);

// needs MANAGE_ROLES; the list REPLACES the member's roles. 400 INVALID_PROJECT_ROLES (empty, Viewer combined with
// another role, or a role the template doesn't offer), 409 LAST_PROJECT_MANAGER, 404 when they aren't a member
export const setProjectMemberRoles = (projectId, userId, roles) =>
  api.put(`/projects/${projectId}/members/${userId}/roles`, { roles }).then((res) => res.data);

// ASSUMED until R30 (archive): not in the backend yet, shapes copied from workspaces (archive/restore)
// and teams (DELETE). Fix them here once agreed.

// needs ARCHIVE_PROJECT
export const archiveProject = (projectId) =>
  api.post(`/projects/${projectId}/archive`).then((res) => res.data);

// needs ARCHIVE_PROJECT
export const restoreProject = (projectId) =>
  api.post(`/projects/${projectId}/restore`).then((res) => res.data);

// needs ARCHIVE_PROJECT (the backend has no delete permission yet); cannot be undone
export const deleteProject = (projectId) => api.delete(`/projects/${projectId}`);
