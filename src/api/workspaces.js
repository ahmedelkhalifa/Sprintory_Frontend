import api from "./client";

export const getWorkspace = (id) => api.get(`/workspaces/${id}`).then((r) => r.data);
export const getWorkspaceMembers = (id, params) =>
    api.get(`/workspaces/${id}/members`, { params }).then((r) => r.data);
export const updateWorkspace = (id, name) =>
    api.patch(`/workspaces/${id}`, { name }).then((r) => r.data);
export const archiveWorkspace = (id) => api.post(`/workspaces/${id}/archive`).then((r) => r.data);
export const restoreWorkspace = (id) => api.post(`/workspaces/${id}/restore`).then((r) => r.data);
export const deleteWorkspace = (id) => api.delete(`/workspaces/${id}`);
export const inviteMembers = (id, emails) =>
    api.post(`/workspaces/${id}/invitations`, { emails }).then((r) => r.data);