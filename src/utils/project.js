import { parseWorkspaceId } from "./workspace.js";

const ROLE_LABEL = {
  PROJECT_MANAGER: "Project Manager",
  PRODUCT_OWNER: "Product Owner",
  SCRUM_MASTER: "Scrum Master",
  MEMBER: "Member",
  VIEWER: "Viewer",
};

// MEMBER is one API value with two names: "Developer" in Scrum projects, "Member" in Kanban
export const projectRoleLabel = (role, template) =>
  role === "MEMBER" && template === "SCRUM" ? "Developer" : (ROLE_LABEL[role] ?? role);

export const isProjectManager = (member) => Boolean(member?.roles?.includes("PROJECT_MANAGER"));

// every ProjectResponse carries the caller's own permissions; check those, never role names.
// hiding a control is only for usability: the backend refuses the request either way
export const can = (project, permission) => Boolean(project?.permissions?.includes(permission));

// ASSUMED until R30: the backend has no project status yet, so today every project is active
export const isProjectArchived = (project) => project?.status === "ARCHIVED";

// same rule as workspace ids: only positive whole numbers
export const parseProjectId = parseWorkspaceId;

export const projectsPath = (workspaceId) => `/workspaces/${workspaceId}/projects`;

export const projectPath = (project) => `${projectsPath(project.workspaceId)}/${project.id}`;
