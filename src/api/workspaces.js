import api from "./client";

export const WORKSPACES_CHANGED = "workspaces:changed";
const notify = (data) => {
    window.dispatchEvent(new Event(WORKSPACES_CHANGED));
    return data;
};

export const getWorkspace = (id, signal) => api.get(`/workspaces/${id}`, { signal }).then((r) => r.data);
export const getWorkspaces = () => api.get("/workspaces").then((r) => r.data);
export const getWorkspaceMembers = (id, params) =>
    api.get(`/workspaces/${id}/members`, { params }).then((r) => r.data);
export const createWorkspace = (name) =>
    api.post("/workspaces", { name }).then((r) => notify(r.data));
export const updateWorkspace = (id, name) =>
    api.patch(`/workspaces/${id}`, { name }).then((r) => notify(r.data));
export const archiveWorkspace = (id) =>
    api.post(`/workspaces/${id}/archive`).then((r) => notify(r.data));
export const restoreWorkspace = (id) =>
    api.post(`/workspaces/${id}/restore`).then((r) => notify(r.data));
export const deleteWorkspace = (id) => api.delete(`/workspaces/${id}`).then(notify);
export const inviteMembers = (id, emails) =>
    api.post(`/workspaces/${id}/invitations`, { emails }).then((r) => r.data);