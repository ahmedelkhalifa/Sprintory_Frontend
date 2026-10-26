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

// a key suggested from the name while the user hasn't typed one: "Mobile App" -> "MA", "Website" -> "WEB".
// only letters and digits count; the key must start with a letter, so leading digits are dropped.
// "" when nothing usable is left (the field then stays empty for the user to fill)
export const suggestProjectKey = (name) => {
  const words = name
    .toUpperCase()
    .split(/[^A-Z0-9]+/)
    .filter(Boolean);
  const raw = words.length > 1 ? words.map((word) => word[0]).join("") : (words[0] ?? "").slice(0, 3);
  const key = raw.replace(/^[0-9]+/, "").slice(0, 10);
  return key.length >= 2 ? key : "";
};

// same rule as workspace ids: only positive whole numbers
export const parseProjectId = parseWorkspaceId;

export const projectsPath = (workspaceId) => `/workspaces/${workspaceId}/projects`;

export const projectPath = (project) => `${projectsPath(project.workspaceId)}/${project.id}`;
