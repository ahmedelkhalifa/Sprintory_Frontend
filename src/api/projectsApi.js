import api from "./client";

// plain members only get the projects they are in
// params: { q, page, size }
export const listProjects = (workspaceId, params, signal) =>
  api.get(`/workspaces/${workspaceId}/projects`, { params, signal }).then((res) => res.data);

export const createProject = (workspaceId, name) =>
  api.post(`/workspaces/${workspaceId}/projects`, { name }).then((res) => res.data);

// params: { q, page, size }
export const listProjectMembers = (projectId, params, signal) =>
  api.get(`/projects/${projectId}/members`, { params, signal }).then((res) => res.data);
