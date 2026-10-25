import api from "./client";

export const getProject = (projectId, signal) =>
    api.get(`/projects/${projectId}`, { signal }).then((r) => r.data);

export const getProjects = (workspaceId, params) =>
    api.get(`/workspaces/${workspaceId}/projects`, { params }).then((r) => r.data);

export const getProjectMembers = (projectId, params) =>
    api.get(`/projects/${projectId}/members`, { params }).then((r) => r.data);
export const createProject = (workspaceId, name) =>
    api.post(`/workspaces/${workspaceId}/projects`, { name }).then((r) => r.data);