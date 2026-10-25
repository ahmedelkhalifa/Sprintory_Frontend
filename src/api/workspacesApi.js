import api from "./client";
import { pageParams, toPage } from "../utils/paging";
import { WORKSPACE_ADMIN } from "../constants/roles";

/**
 * Workspaces API, see workspaces-docs.md (R02). Only what the projects pages need.
 * TEMP: the workspace page (branch workspace-page) has its own workspaces API file;
 * once it is merged into main, use that one and delete these functions.
 * WorkspaceResponse        { id, name, slug, role, archivedAt }   (role is the caller's role)
 * WorkspaceMemberResponse  { userId, firstName, lastName, email, role }
 */

// translators: the only place that knows the backend's field names
const toWorkspace = (raw) => ({
  id: raw.id,
  name: raw.name,
  slug: raw.slug,
  role: raw.role,
  archivedAt: raw.archivedAt,
  isAdmin: raw.role === WORKSPACE_ADMIN,
  isArchived: raw.archivedAt != null,
});
const toWorkspaceMember = (raw) => ({
  userId: raw.userId,
  firstName: raw.firstName,
  lastName: raw.lastName,
  email: raw.email,
  role: raw.role,
});

// every workspace the user is in (not paginated, includes archived ones)
export async function listMyWorkspaces() {
  const { data } = await api.get("/workspaces");
  return data.map(toWorkspace);
}

export async function getWorkspace(workspaceId) {
  const { data } = await api.get(`/workspaces/${workspaceId}`);
  return toWorkspace(data);
}

// one page of the workspace's people; q matches first name, last name or email
export async function listWorkspaceMembers(workspaceId, { q, page, size } = {}) {
  const { data } = await api.get(`/workspaces/${workspaceId}/members`, { params: pageParams({ q, page, size }) });
  return toPage(data, toWorkspaceMember);
}
