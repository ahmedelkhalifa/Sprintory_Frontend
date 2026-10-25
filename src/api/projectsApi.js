import api from "./client";
import { USE_MOCKS } from "./useMocks";
import { pageParams, toPage } from "../utils/paging";
import { PROJECT_STATUS } from "../constants/projects";
import * as mock from "../mocks/handlers";

/**
 * Projects API, see projects-docs.md and roles-docs.md. Paths are relative to VITE_API_URL (…/api/v1).
 * ProjectResponse        { id, workspaceId, name, template, roles, permissions }   (the caller's own roles/permissions)
 * ProjectMemberResponse  { userId, firstName, lastName, email, roles }
 * Lists are PageResponse { content, page, size, totalElements, totalPages }, with ?q=&page=&size=.
 */

// translators: the only place that knows the backend's field names
const toProject = (raw) => ({
  id: raw.id,
  workspaceId: raw.workspaceId,
  name: raw.name,
  template: raw.template,
  roles: raw.roles ?? [],
  permissions: raw.permissions ?? [],
  // ASSUMED until story 8 (key, description, created date) and R30 (status): missing today,
  // so no key / description / date are shown and every project counts as active
  key: raw.key ?? null,
  status: raw.status ?? PROJECT_STATUS.ACTIVE,
  description: raw.description ?? "",
  createdAt: raw.createdAt ?? null,
});
const toProjectMember = (raw) => ({
  userId: raw.userId,
  firstName: raw.firstName,
  lastName: raw.lastName,
  email: raw.email,
  roles: raw.roles ?? [],
});

// one page of the workspace's projects (admins get all, members only their own).
// `status` filters by ACTIVE / ARCHIVED (ASSUMED until R30; leave it out for all projects)
export async function listWorkspaceProjects(workspaceId, { q, page, size, status } = {}) {
  const params = { ...pageParams({ q, page, size }), ...(status && { status }) };
  const data = USE_MOCKS
    ? await mock.mockListWorkspaceProjects(workspaceId, params)
    : (await api.get(`/workspaces/${workspaceId}/projects`, { params })).data;
  return toPage(data, toProject);
}

// any member of an active workspace; the creator becomes the project's Project Manager
export async function createProject(workspaceId, { name, template }) {
  const body = { name, template };
  const data = USE_MOCKS
    ? await mock.mockCreateProject(workspaceId, body)
    : (await api.post(`/workspaces/${workspaceId}/projects`, body)).data;
  return toProject(data);
}

export async function getProject(projectId) {
  const data = USE_MOCKS ? await mock.mockGetProject(projectId) : (await api.get(`/projects/${projectId}`)).data;
  return toProject(data);
}

export async function listProjectMembers(projectId, { q, page, size } = {}) {
  const params = pageParams({ q, page, size });
  const data = USE_MOCKS
    ? await mock.mockListProjectMembers(projectId, params)
    : (await api.get(`/projects/${projectId}/members`, { params })).data;
  return toPage(data, toProjectMember);
}

// needs MANAGE_MEMBERS; all or nothing: every id must be a member of the project's workspace
export async function addProjectMembers(projectId, userIds) {
  if (USE_MOCKS) return mock.mockAddProjectMembers(projectId, userIds);
  await api.post(`/projects/${projectId}/members`, { userIds });
}

// needs MANAGE_MEMBERS; copies the team's current members once
export async function addTeamToProject(projectId, teamId) {
  if (USE_MOCKS) return mock.mockAddTeamToProject(projectId, teamId);
  await api.post(`/projects/${projectId}/teams`, { teamId });
}

// needs MANAGE_MEMBERS; the last Project Manager can't be removed (409 LAST_PROJECT_MANAGER)
export async function removeProjectMember(projectId, userId) {
  if (USE_MOCKS) return mock.mockRemoveProjectMember(projectId, userId);
  await api.delete(`/projects/${projectId}/members/${userId}`);
}

// ---------------------------------------------------------------------------------------------
// ASSUMED until story 8 (edit) and R30 (archive). These endpoints are NOT in the backend docs yet:
// they copy the patterns of workspaces (archive/restore) and teams (PATCH rename, DELETE).
// Agree the real ones with the backend team and fix them here only.
// ---------------------------------------------------------------------------------------------

// needs EDIT_SETTINGS
export async function updateProject(projectId, { name }) {
  const data = USE_MOCKS
    ? await mock.mockUpdateProject(projectId, { name })
    : (await api.patch(`/projects/${projectId}`, { name })).data;
  return toProject(data);
}

// needs ARCHIVE_PROJECT
export async function archiveProject(projectId) {
  const data = USE_MOCKS
    ? await mock.mockArchiveProject(projectId)
    : (await api.post(`/projects/${projectId}/archive`)).data;
  return toProject(data);
}

// needs ARCHIVE_PROJECT
export async function restoreProject(projectId) {
  const data = USE_MOCKS
    ? await mock.mockRestoreProject(projectId)
    : (await api.post(`/projects/${projectId}/restore`)).data;
  return toProject(data);
}

// needs ARCHIVE_PROJECT; cannot be undone
export async function deleteProject(projectId) {
  if (USE_MOCKS) return mock.mockDeleteProject(projectId);
  await api.delete(`/projects/${projectId}`);
}
