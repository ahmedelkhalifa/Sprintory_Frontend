import api from "./client";

// admins get every team in the workspace, members only the teams they are in
// params: { q, page, size }
export const listTeams = (workspaceId, params, signal) =>
  api.get(`/workspaces/${workspaceId}/teams`, { params, signal }).then((res) => res.data);

export const getTeam = (teamId, signal) =>
  api.get(`/teams/${teamId}`, { signal }).then((res) => res.data);

export const createTeam = (workspaceId, name) =>
  api.post(`/workspaces/${workspaceId}/teams`, { name }).then((res) => res.data);

export const renameTeam = (teamId, name) =>
  api.patch(`/teams/${teamId}`, { name }).then((res) => res.data);

export const deleteTeam = (teamId) => api.delete(`/teams/${teamId}`);

// params: { q, page, size }
export const listTeamMembers = (teamId, params, signal) =>
  api.get(`/teams/${teamId}/members`, { params, signal }).then((res) => res.data);

// userIds must already be workspace members, at most 100 per request
export const addTeamMembers = (teamId, userIds) =>
  api.post(`/teams/${teamId}/members`, { userIds });

export const removeTeamMember = (teamId, userId) =>
  api.delete(`/teams/${teamId}/members/${userId}`);
