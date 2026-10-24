import api from "./client";

export const getWorkspace = (id) =>
    api.get(`/workspaces/${id}`).then((r) => r.data);
export const getWorkspaceMembers = (id, params) =>
    api.get(`/workspaces/${id}/members`, { params }).then((r) => r.data);