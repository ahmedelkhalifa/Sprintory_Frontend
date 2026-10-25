import api from "./client";
import { pageParams, toPage } from "../utils/paging";
import { mockGetProject, mockGetProjectMembers, mockGetProjects } from "../mocks/projects";

// TEMP: while the backend isn't ready, set VITE_USE_MOCKS=true in .env.local to use fake data
const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === "true";

/**
 * Projects API, see projects-docs.md (R02). Paths are relative to VITE_API_URL (…/api/v1).
 * ProjectResponse        { id, workspaceId, name }
 * ProjectMemberResponse  { userId, firstName, lastName, email }
 * Lists are PageResponse { content, page, size, totalElements, totalPages }, with ?q=&page=&size=.
 */

// translators: the only place that knows the backend's field names
const toProject = (raw) => ({ id: raw.id, workspaceId: raw.workspaceId, name: raw.name });
const toProjectMember = (raw) => ({
  userId: raw.userId,
  firstName: raw.firstName,
  lastName: raw.lastName,
  email: raw.email,
});

// one page of the workspace's projects (admins get all, members only their own)
export async function listWorkspaceProjects(workspaceId, { q, page, size } = {}) {
  const { data } = await api.get(`/workspaces/${workspaceId}/projects`, { params: pageParams({ q, page, size }) });
  return toPage(data, toProject);
}

export async function createProject(workspaceId, name) {
  const { data } = await api.post(`/workspaces/${workspaceId}/projects`, { name });
  return toProject(data);
}

export async function getProject(projectId) {
  if (USE_MOCKS) return mockGetProject(projectId);
  const { data } = await api.get(`/projects/${projectId}`);
  return toProject(data);
}

export async function listProjectMembers(projectId, { q, page, size } = {}) {
  const { data } = await api.get(`/projects/${projectId}/members`, { params: pageParams({ q, page, size }) });
  return toPage(data, toProjectMember);
}

// admin only; all or nothing: every id must be a member of the project's workspace
export async function addProjectMembers(projectId, userIds) {
  await api.post(`/projects/${projectId}/members`, { userIds });
}

// admin only; copies the team's current members once
export async function addTeamToProject(projectId, teamId) {
  await api.post(`/projects/${projectId}/teams`, { teamId });
}

// admin only
export async function removeProjectMember(projectId, userId) {
  await api.delete(`/projects/${projectId}/members/${userId}`);
}

// TEMP: the old guessed endpoints, still used by useProjects / useProjectMembers.
// Removed in group C, when the pages switch to the functions above.
export async function getProjects() {
  if (USE_MOCKS) return mockGetProjects();
  const { data } = await api.get("/projects");
  return data;
}

export async function getProjectMembers(projectId) {
  if (USE_MOCKS) return mockGetProjectMembers(projectId);
  const { data } = await api.get(`/projects/${projectId}/members`);
  return data;
}
