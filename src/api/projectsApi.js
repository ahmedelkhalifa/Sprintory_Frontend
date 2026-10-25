import api from "./client";

// plain members only get the projects they are in
// params: { q, page, size, status } (status is ASSUMED until R30, see below)
export const listProjects = (workspaceId, params, signal) =>
  api.get(`/workspaces/${workspaceId}/projects`, { params, signal }).then((res) => res.data);

// template is required (SCRUM / KANBAN) and can never change; the creator becomes Project Manager
export const createProject = (workspaceId, { name, template }) =>
  api.post(`/workspaces/${workspaceId}/projects`, { name, template }).then((res) => res.data);

// roles and permissions in the response are the caller's own
export const getProject = (projectId, signal) =>
  api.get(`/projects/${projectId}`, { signal }).then((res) => res.data);

// params: { q, page, size }
export const listProjectMembers = (projectId, params, signal) =>
  api.get(`/projects/${projectId}/members`, { params, signal }).then((res) => res.data);

// needs MANAGE_MEMBERS; all or nothing: every id must be a workspace member, at most 100 per request
export const addProjectMembers = (projectId, userIds) =>
  api.post(`/projects/${projectId}/members`, { userIds });

// needs MANAGE_MEMBERS; a one-time copy of the team's current members
export const addTeamToProject = (projectId, teamId) =>
  api.post(`/projects/${projectId}/teams`, { teamId });

// needs MANAGE_MEMBERS; the last Project Manager can't be removed (LAST_PROJECT_MANAGER)
export const removeProjectMember = (projectId, userId) =>
  api.delete(`/projects/${projectId}/members/${userId}`);

// ASSUMED until story 8 (edit) and R30 (archive): not in the backend yet, shapes copied from
// workspaces (archive/restore) and teams (PATCH rename, DELETE). Fix them here once agreed.

// needs EDIT_SETTINGS
export const updateProject = (projectId, name) =>
  api.patch(`/projects/${projectId}`, { name }).then((res) => res.data);

// needs ARCHIVE_PROJECT
export const archiveProject = (projectId) =>
  api.post(`/projects/${projectId}/archive`).then((res) => res.data);

// needs ARCHIVE_PROJECT
export const restoreProject = (projectId) =>
  api.post(`/projects/${projectId}/restore`).then((res) => res.data);

// needs ARCHIVE_PROJECT (the backend has no delete permission yet); cannot be undone
export const deleteProject = (projectId) => api.delete(`/projects/${projectId}`);
