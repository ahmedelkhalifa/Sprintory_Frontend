import api from "./client";
import { mockGetProject, mockGetProjectMembers, mockGetProjects } from "../mocks/projects";

// TEMP: while the backend isn't ready, set VITE_USE_MOCKS=true in .env.local to use fake data
const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === "true";

/**
 * Backend contract to confirm with the backend team:
 * GET /projects returns
 *   [{ id, name, key, description, updatedAt, memberCount, membersPreview: [{ id, firstName, lastName, avatarUrl }] }].
 * GET /projects/:projectId returns { id, name, key, description }.
 * GET /projects/:projectId/members returns
 *   [{ id, firstName, lastName, email, role, avatarUrl, joinedAt }].
 * The configured VITE_API_URL supplies the API prefix.
 */
export async function getProjects() {
  if (USE_MOCKS) return mockGetProjects();
  const { data } = await api.get("/projects");
  return data;
}

export async function getProject(projectId) {
  if (USE_MOCKS) return mockGetProject(projectId);
  const { data } = await api.get(`/projects/${projectId}`);
  return data;
}

export async function getProjectMembers(projectId) {
  if (USE_MOCKS) return mockGetProjectMembers(projectId);
  const { data } = await api.get(`/projects/${projectId}/members`);
  return data;
}
