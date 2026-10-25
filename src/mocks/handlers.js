// Fake versions of the backend endpoints, used only when VITE_USE_MOCKS=true.
// Each returns exactly what the real endpoint returns (same JSON shape, same errors, same access rules),
// so the API files run their translators on it just like on real data.
// Edit / archive / restore / delete and project key + status are ASSUMED (story 8 / R30).
import { ME, makeKey, projectMembers, projects, teams, users, workspaceMembers, workspaces } from "./db";

// ---------- permission matrix (roles-docs.md §2) ----------

const ROLE_PERMISSIONS = {
  PROJECT_MANAGER: ["VIEW_PROJECT", "VIEW_WORK", "EDIT_SETTINGS", "ARCHIVE_PROJECT", "MANAGE_MEMBERS", "MANAGE_ROLES",
    "CONFIGURE_BOARD", "EDIT_TASKS", "COMMENT", "LOG_TIME"],
  PRODUCT_OWNER: ["VIEW_PROJECT", "VIEW_WORK", "MANAGE_BACKLOG", "EDIT_TASKS", "COMMENT", "LOG_TIME"],
  SCRUM_MASTER: ["VIEW_PROJECT", "VIEW_WORK", "MANAGE_SPRINTS", "EDIT_TASKS", "COMMENT", "LOG_TIME"],
  MEMBER: ["VIEW_PROJECT", "VIEW_WORK", "EDIT_TASKS", "COMMENT", "LOG_TIME"],
  VIEWER: ["VIEW_PROJECT", "VIEW_WORK"],
};
// what a workspace admin gets in every project of the workspace, member or not
const WORKSPACE_ADMIN_PERMISSIONS = ["VIEW_PROJECT", "EDIT_SETTINGS", "ARCHIVE_PROJECT", "MANAGE_MEMBERS", "MANAGE_ROLES"];
const PERMISSION_ORDER = ROLE_PERMISSIONS.PROJECT_MANAGER.concat("MANAGE_BACKLOG", "MANAGE_SPRINTS");

// ---------- helpers ----------

// small delay so loading states are visible, like a real request
const delay = (value) => new Promise((resolve) => setTimeout(() => resolve(value), 300));

// an error shaped like an axios error from the real backend
const apiError = (status, code, message, fieldErrors) =>
  Object.assign(new Error(message), {
    response: { status, data: { status, code, message, ...(fieldErrors && { fieldErrors }) } },
  });

const notFound = (what) => apiError(404, "RESOURCE_NOT_FOUND", `${what} not found.`);
const accessDenied = () => apiError(403, "ACCESS_DENIED", "You do not have access to this resource.");
const archived = () => apiError(409, "WORKSPACE_ARCHIVED", "This workspace is archived. Restore it to make changes.");
// ASSUMED (R30): changes to an archived project, other than restore and delete
const projectArchived = () => apiError(409, "PROJECT_ARCHIVED", "This project is archived. Restore it to make changes.");
const validation = (fieldErrors) => apiError(400, "VALIDATION_ERROR", "Request validation failed.", fieldErrors);

const contains = (text, q) => text.toLowerCase().includes(q.toLowerCase());
const byName = (a, b) => a.name.localeCompare(b.name);
const byPerson = (a, b) => a.firstName.localeCompare(b.firstName) || a.lastName.localeCompare(b.lastName);

// same rules as the backend: page 0-based, size default 20 and max 100, q = case-insensitive contains
const toPageResponse = (list, { q, page = 0, size = 20 } = {}, matches) => {
  const filtered = q?.trim() ? list.filter((item) => matches(item, q.trim())) : list;
  const pageSize = Math.min(Math.max(size, 1), 100);
  const pageNumber = Math.max(page, 0);
  return {
    content: filtered.slice(pageNumber * pageSize, (pageNumber + 1) * pageSize),
    page: pageNumber,
    size: pageSize,
    totalElements: filtered.length,
    totalPages: Math.ceil(filtered.length / pageSize),
  };
};

// name rules shared by create and edit: required, trimmed, at most 100 characters
const nameError = (name) => {
  const trimmed = (name ?? "").trim();
  if (!trimmed) return "must not be blank";
  if (trimmed.length > 100) return "size must be between 0 and 100";
  return null;
};

const person = (userId) => {
  const { id, firstName, lastName, email } = users.find((u) => u.id === userId);
  return { userId: id, firstName, lastName, email };
};

const myWorkspaceRole = (workspaceId) =>
  workspaceMembers.find(([ws, userId]) => ws === Number(workspaceId) && userId === ME)?.[2];

const myProjectRoles = (project) => projectMembers[project.id].find((m) => m.userId === ME)?.roles ?? [];

const myPermissions = (project) => {
  const granted = new Set(myProjectRoles(project).flatMap((role) => ROLE_PERMISSIONS[role]));
  if (myWorkspaceRole(project.workspaceId) === "WORKSPACE_ADMIN") WORKSPACE_ADMIN_PERMISSIONS.forEach((p) => granted.add(p));
  return PERMISSION_ORDER.filter((p) => granted.has(p));
};

const workspaceResponse = (ws) => ({ ...ws, role: myWorkspaceRole(ws.id) });

// the caller's view of a project: their own roles and permissions in it
const projectResponse = (project) => ({ ...project, roles: myProjectRoles(project), permissions: myPermissions(project) });

// the caller must be in the workspace, otherwise 404 (private by default)
const requireWorkspace = (workspaceId) => {
  const ws = workspaces.find((w) => w.id === Number(workspaceId));
  if (!ws || !myWorkspaceRole(ws.id)) throw notFound("Workspace");
  return ws;
};

// visible to workspace admins and the project's own members, 404 for everyone else
const requireProject = (projectId) => {
  const project = projects.find((p) => p.id === Number(projectId));
  const isAdmin = project && myWorkspaceRole(project.workspaceId) === "WORKSPACE_ADMIN";
  if (!project || !myWorkspaceRole(project.workspaceId) || (!isAdmin && myProjectRoles(project).length === 0)) {
    throw notFound("Project");
  }
  return project;
};

// a change: visible (404) → permission (403) → active workspace (409) → active project (409, unless allowed)
const requirePermission = (projectId, permission, { allowArchivedProject = false } = {}) => {
  const project = requireProject(projectId);
  if (!myPermissions(project).includes(permission)) throw accessDenied();
  if (requireWorkspace(project.workspaceId).archivedAt) throw archived();
  if (!allowArchivedProject && project.status === "ARCHIVED") throw projectArchived();
  return project;
};

// people added to a project get MEMBER; people already in it keep their roles
const addMembers = (project, userIds) => {
  const current = projectMembers[project.id];
  userIds.filter((id) => !current.some((m) => m.userId === id)).forEach((userId) => current.push({ userId, roles: ["MEMBER"] }));
};

// ---------- workspaces ----------

export const mockListMyWorkspaces = () =>
  delay(workspaces.filter((ws) => myWorkspaceRole(ws.id)).sort(byName).map(workspaceResponse));

export const mockGetWorkspace = async (workspaceId) => {
  await delay();
  return workspaceResponse(requireWorkspace(workspaceId));
};

export const mockListWorkspaceMembers = async (workspaceId, params) => {
  await delay();
  requireWorkspace(workspaceId);
  const list = workspaceMembers
    .filter(([ws]) => ws === Number(workspaceId))
    .map(([, userId, role]) => ({ ...person(userId), role }))
    .sort(byPerson);
  return toPageResponse(list, params, (m, q) => contains(`${m.firstName} ${m.lastName} ${m.email}`, q));
};

// ---------- teams ----------

export const mockListWorkspaceTeams = async (workspaceId, params) => {
  await delay();
  requireWorkspace(workspaceId);
  const isAdmin = myWorkspaceRole(workspaceId) === "WORKSPACE_ADMIN";
  const list = teams
    .filter((t) => t.workspaceId === Number(workspaceId) && (isAdmin || t.members.includes(ME)))
    .map(({ id, workspaceId: ws, name }) => ({ id, workspaceId: ws, name }))
    .sort(byName);
  return toPageResponse(list, params, (t, q) => contains(t.name, q));
};

// ---------- projects ----------

export const mockListWorkspaceProjects = async (workspaceId, params = {}) => {
  await delay();
  requireWorkspace(workspaceId);
  const isAdmin = myWorkspaceRole(workspaceId) === "WORKSPACE_ADMIN";
  const list = projects
    .filter((p) => p.workspaceId === Number(workspaceId) && (isAdmin || myProjectRoles(p).length > 0))
    .filter((p) => !params.status || p.status === params.status) // ASSUMED (R30)
    .sort(byName)
    .map(projectResponse);
  return toPageResponse(list, params, (p, q) => contains(p.name, q));
};

export const mockCreateProject = async (workspaceId, { name, template } = {}) => {
  await delay();
  const ws = requireWorkspace(workspaceId);
  if (ws.archivedAt) throw archived();

  const fieldErrors = {};
  if (nameError(name)) fieldErrors.name = nameError(name);
  if (!template) fieldErrors.template = "must not be null";
  if (Object.keys(fieldErrors).length > 0) throw validation(fieldErrors);
  if (!["SCRUM", "KANBAN"].includes(template)) throw apiError(400, "BAD_REQUEST", "Malformed request body.");

  const trimmed = name.trim();
  const takenKeys = projects.filter((p) => p.workspaceId === ws.id).map((p) => p.key);
  const project = {
    id: Math.max(...projects.map((p) => p.id)) + 1,
    workspaceId: ws.id,
    name: trimmed,
    template,
    key: makeKey(trimmed, takenKeys),
    status: "ACTIVE",
    description: "",
    createdAt: new Date().toISOString(),
  };
  projects.push(project);
  projectMembers[project.id] = [{ userId: ME, roles: ["PROJECT_MANAGER"] }]; // the creator is Project Manager
  return projectResponse(project);
};

export const mockGetProject = async (projectId) => {
  await delay();
  return projectResponse(requireProject(projectId));
};

export const mockListProjectMembers = async (projectId, params) => {
  await delay();
  const project = requireProject(projectId);
  const list = projectMembers[project.id].map((m) => ({ ...person(m.userId), roles: [...m.roles] })).sort(byPerson);
  return toPageResponse(list, params, (m, q) => contains(`${m.firstName} ${m.lastName} ${m.email}`, q));
};

export const mockAddProjectMembers = async (projectId, userIds = []) => {
  await delay();
  const project = requirePermission(projectId, "MANAGE_MEMBERS");
  if (userIds.length === 0 || userIds.length > 100) throw validation({ userIds: "size must be between 1 and 100" });
  const inWorkspace = (id) => workspaceMembers.some(([ws, userId]) => ws === project.workspaceId && userId === id);
  // all or nothing
  if (!userIds.every(inWorkspace)) throw apiError(400, "BAD_REQUEST", "Some users are not members of this workspace.");
  addMembers(project, userIds);
};

export const mockAddTeamToProject = async (projectId, teamId) => {
  await delay();
  const project = requirePermission(projectId, "MANAGE_MEMBERS");
  const team = teams.find((t) => t.id === Number(teamId) && t.workspaceId === project.workspaceId);
  if (!team) throw apiError(400, "BAD_REQUEST", "Team not found in this workspace.");
  addMembers(project, team.members); // a one-time copy of the team's current members
};

export const mockRemoveProjectMember = async (projectId, userId) => {
  await delay();
  const project = requirePermission(projectId, "MANAGE_MEMBERS");
  const members = projectMembers[project.id];
  const target = members.find((m) => m.userId === Number(userId));
  if (!target) return; // not in the project: nothing changes, still 204

  const managers = members.filter((m) => m.roles.includes("PROJECT_MANAGER"));
  if (target.roles.includes("PROJECT_MANAGER") && managers.length === 1) {
    throw apiError(409, "LAST_PROJECT_MANAGER", "A project must have at least one Project Manager.");
  }
  projectMembers[project.id] = members.filter((m) => m !== target);
};

// ---------- ASSUMED until story 8 / R30 ----------

export const mockUpdateProject = async (projectId, { name } = {}) => {
  await delay();
  const project = requirePermission(projectId, "EDIT_SETTINGS");
  if (nameError(name)) throw validation({ name: nameError(name) });
  project.name = name.trim();
  return projectResponse(project);
};

export const mockArchiveProject = async (projectId) => {
  await delay();
  const project = requirePermission(projectId, "ARCHIVE_PROJECT", { allowArchivedProject: true });
  project.status = "ARCHIVED";
  return projectResponse(project);
};

export const mockRestoreProject = async (projectId) => {
  await delay();
  const project = requirePermission(projectId, "ARCHIVE_PROJECT", { allowArchivedProject: true });
  project.status = "ACTIVE";
  return projectResponse(project);
};

export const mockDeleteProject = async (projectId) => {
  await delay();
  const project = requirePermission(projectId, "ARCHIVE_PROJECT", { allowArchivedProject: true });
  projects.splice(projects.indexOf(project), 1);
  delete projectMembers[project.id];
};
