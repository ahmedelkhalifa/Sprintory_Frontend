import api from "./client";
import { USE_MOCKS } from "./useMocks";
import { pageParams, toPage } from "../utils/paging";
import * as mock from "../mocks/handlers";
import { mockGetProject, mockGetProjectMembers, mockGetProjects } from "../mocks/projects";

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
  const params = pageParams({ q, page, size });
  const data = USE_MOCKS
    ? await mock.mockListWorkspaceProjects(workspaceId, params)
    : (await api.get(`/workspaces/${workspaceId}/projects`, { params })).data;
  return toPage(data, toProject);
}

export async function createProject(workspaceId, name) {
  const data = USE_MOCKS
    ? await mock.mockCreateProject(workspaceId, name)
    : (await api.post(`/workspaces/${workspaceId}/projects`, { name })).data;
  return toProject(data);
}

export async function getProject(projectId) {
  // TEMP: the old mock until group C, so the current pages keep matching ids; then mock.mockGetProject
  if (USE_MOCKS) return mockGetProject(projectId);
  const { data } = await api.get(`/projects/${projectId}`);
  return toProject(data);
}

export async function listProjectMembers(projectId, { q, page, size } = {}) {
  const params = pageParams({ q, page, size });
  const data = USE_MOCKS
    ? await mock.mockListProjectMembers(projectId, params)
    : (await api.get(`/projects/${projectId}/members`, { params })).data;
  return toPage(data, toProjectMember);
}

// admin only; all or nothing: every id must be a member of the project's workspace
export async function addProjectMembers(projectId, userIds) {
  if (USE_MOCKS) return mock.mockAddProjectMembers(projectId, userIds);
  await api.post(`/projects/${projectId}/members`, { userIds });
}

// admin only; copies the team's current members once
export async function addTeamToProject(projectId, teamId) {
  if (USE_MOCKS) return mock.mockAddTeamToProject(projectId, teamId);
  await api.post(`/projects/${projectId}/teams`, { teamId });
}

// admin only
export async function removeProjectMember(projectId, userId) {
  if (USE_MOCKS) return mock.mockRemoveProjectMember(projectId, userId);
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
