import api from "./client";

// All API URLs below are relative to VITE_API_URL (usually /api/v1).
// The backend enforces workspace visibility and write permissions.
export const getWorkspace = (workspaceId, signal) =>
  api.get(`/workspaces/${workspaceId}`, { signal }).then(({ data }) => data);

export const listTeams = (workspaceId, { q = "", page = 0, size = 20 } = {}, signal) =>
  api.get(`/workspaces/${workspaceId}/teams`, { params: { q, page, size }, signal }).then(({ data }) => data);

export const getTeam = (teamId, signal) =>
  api.get(`/teams/${teamId}`, { signal }).then(({ data }) => data);

export const createTeam = (workspaceId, name) =>
  api.post(`/workspaces/${workspaceId}/teams`, { name }).then(({ data }) => data);

export const renameTeam = (teamId, name) =>
  api.patch(`/teams/${teamId}`, { name }).then(({ data }) => data);

export const deleteTeam = (teamId) => api.delete(`/teams/${teamId}`);

export const listTeamMembers = (teamId, { q = "", page = 0, size = 20 } = {}, signal) =>
  api.get(`/teams/${teamId}/members`, { params: { q, page, size }, signal }).then(({ data }) => data);

export const listWorkspaceMembers = (workspaceId, { q = "", page = 0, size = 20 } = {}, signal) =>
  api.get(`/workspaces/${workspaceId}/members`, { params: { q, page, size }, signal }).then(({ data }) => data);

export const addTeamMembers = (teamId, userIds) =>
  api.post(`/teams/${teamId}/members`, { userIds });

export const removeTeamMember = (teamId, userId) =>
  api.delete(`/teams/${teamId}/members/${userId}`);
