import api from "./client";

/**
 * Backend contract to confirm with the backend team:
 * GET /projects/:projectId returns { id, name, key, description }.
 * GET /projects/:projectId/members returns
 *   [{ id, firstName, lastName, email, role, avatarUrl, joinedAt }].
 * The configured VITE_API_URL supplies the API prefix.
 */
export async function getProject(projectId) {
  const { data } = await api.get(`/projects/${projectId}`);
  return data;
}

export async function getProjectMembers(projectId) {
  const { data } = await api.get(`/projects/${projectId}/members`);
  return data;
}
