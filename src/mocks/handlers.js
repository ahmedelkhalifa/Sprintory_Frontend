// Fake versions of the backend endpoints, used only when VITE_USE_MOCKS=true.
// Each returns exactly what the real endpoint returns (same JSON shape, same errors, same access rules),
// so the API files run their translators on it just like on real data.
import { ME, projectMembers, projects, teams, users, workspaceMembers, workspaces } from "./db";

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

const person = (userId) => {
  const { id, firstName, lastName, email } = users.find((u) => u.id === userId);
  return { userId: id, firstName, lastName, email };
};

const myRole = (workspaceId) =>
  workspaceMembers.find(([ws, userId]) => ws === Number(workspaceId) && userId === ME)?.[2];

const workspaceResponse = (ws) => ({ ...ws, role: myRole(ws.id) });

// the caller must be in the workspace, otherwise 404 (private by default)
const requireWorkspace = (workspaceId) => {
  const ws = workspaces.find((w) => w.id === Number(workspaceId));
  if (!ws || !myRole(ws.id)) throw notFound("Workspace");
  return ws;
};

// the project must exist and be visible: admins see all, members only their own projects
const requireProject = (projectId) => {
  const project = projects.find((p) => p.id === Number(projectId));
  const role = project && myRole(project.workspaceId);
  const isMember = project && projectMembers[project.id].includes(ME);
  if (!project || !role || (role !== "WORKSPACE_ADMIN" && !isMember)) throw notFound("Project");
  return project;
};

// membership changes: admin of an active workspace (a project member who isn't admin gets 403)
const requireProjectAdmin = (projectId) => {
  const project = requireProject(projectId);
  if (myRole(project.workspaceId) !== "WORKSPACE_ADMIN") throw accessDenied();
  if (requireWorkspace(project.workspaceId).archivedAt) throw archived();
  return project;
};

// ---------- workspaces ----------

export const mockListMyWorkspaces = () =>
  delay(workspaces.filter((ws) => myRole(ws.id)).sort(byName).map(workspaceResponse));

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
  const isAdmin = myRole(workspaceId) === "WORKSPACE_ADMIN";
  const list = teams
    .filter((t) => t.workspaceId === Number(workspaceId) && (isAdmin || t.members.includes(ME)))
    .map(({ id, workspaceId: ws, name }) => ({ id, workspaceId: ws, name }))
    .sort(byName);
  return toPageResponse(list, params, (t, q) => contains(t.name, q));
};

// ---------- projects ----------

export const mockListWorkspaceProjects = async (workspaceId, params) => {
  await delay();
  requireWorkspace(workspaceId);
  const isAdmin = myRole(workspaceId) === "WORKSPACE_ADMIN";
  const list = projects
    .filter((p) => p.workspaceId === Number(workspaceId) && (isAdmin || projectMembers[p.id].includes(ME)))
    .map((p) => ({ ...p }))
    .sort(byName);
  return toPageResponse(list, params, (p, q) => contains(p.name, q));
};

export const mockCreateProject = async (workspaceId, name) => {
  await delay();
  const ws = requireWorkspace(workspaceId);
  if (ws.archivedAt) throw archived();

  const trimmed = (name ?? "").trim();
  if (!trimmed) throw apiError(400, "VALIDATION_ERROR", "Request validation failed.", { name: "must not be blank" });
  if (trimmed.length > 100) {
    throw apiError(400, "VALIDATION_ERROR", "Request validation failed.", { name: "size must be between 0 and 100" });
  }

  const project = { id: Math.max(...projects.map((p) => p.id)) + 1, workspaceId: ws.id, name: trimmed };
  projects.push(project);
  projectMembers[project.id] = [ME]; // the creator is the first member
  return { ...project };
};

export const mockGetProject = async (projectId) => {
  await delay();
  return { ...requireProject(projectId) };
};

export const mockListProjectMembers = async (projectId, params) => {
  await delay();
  const project = requireProject(projectId);
  const list = projectMembers[project.id].map(person).sort(byPerson);
  return toPageResponse(list, params, (m, q) => contains(`${m.firstName} ${m.lastName} ${m.email}`, q));
};

export const mockAddProjectMembers = async (projectId, userIds) => {
  await delay();
  const project = requireProjectAdmin(projectId);
  const inWorkspace = (id) => workspaceMembers.some(([ws, userId]) => ws === project.workspaceId && userId === id);
  // all or nothing
  if (!userIds.every(inWorkspace)) throw apiError(400, "BAD_REQUEST", "Some users are not members of this workspace.");
  projectMembers[project.id] = [...new Set([...projectMembers[project.id], ...userIds])];
};

export const mockAddTeamToProject = async (projectId, teamId) => {
  await delay();
  const project = requireProjectAdmin(projectId);
  const team = teams.find((t) => t.id === Number(teamId) && t.workspaceId === project.workspaceId);
  if (!team) throw apiError(400, "BAD_REQUEST", "Team not found in this workspace.");
  // a one-time copy of the team's current members
  projectMembers[project.id] = [...new Set([...projectMembers[project.id], ...team.members])];
};

export const mockRemoveProjectMember = async (projectId, userId) => {
  await delay();
  const project = requireProjectAdmin(projectId);
  projectMembers[project.id] = projectMembers[project.id].filter((id) => id !== Number(userId));
};
