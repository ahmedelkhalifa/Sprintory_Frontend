import api from "./client";

export const getTeams = (workspaceId, params) =>
    api.get(`/workspaces/${workspaceId}/teams`, { params }).then((r) => r.data);

export const getTeamMembers = (teamId, params) =>
    api.get(`/teams/${teamId}/members`, { params }).then((r) => r.data);