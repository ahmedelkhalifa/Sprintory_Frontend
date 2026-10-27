import { PROJECT_ROLES, PROJECT_ROLES_BY_TEMPLATE, ROLE_MESSAGES } from "../constants/projects.js";
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

// the roles a project of this template offers, in picker order; empty for an unknown template
export const projectRoleOptions = (template) => PROJECT_ROLES_BY_TEMPLATE[template] ?? [];

// keeps only roles the template offers, in picker order (the order the API may send them in is not stable)
export const sortProjectRoles = (roles, template) => projectRoleOptions(template).filter((role) => roles.includes(role));

// ticks or unticks one role in the picker. Viewer is exclusive: ticking it clears the others, ticking another
// role clears Viewer. Unticking the last role returns an empty list; the caller refuses that (validateProjectRoles)
export const toggleProjectRole = (current, role, template) => {
  if (current.includes(role)) return sortProjectRoles(current.filter((r) => r !== role), template);
  if (role === PROJECT_ROLES.VIEWER) return [PROJECT_ROLES.VIEWER];
  return sortProjectRoles([...current.filter((r) => r !== PROJECT_ROLES.VIEWER), role], template);
};

// "" when the set may be sent, otherwise the text to show. The backend checks the same rules
// (INVALID_PROJECT_ROLES); this only saves a request
export const validateProjectRoles = (roles, template) => {
  if (roles.length === 0) return ROLE_MESSAGES.EMPTY;
  if (roles.includes(PROJECT_ROLES.VIEWER) && roles.length > 1) return ROLE_MESSAGES.VIEWER_EXCLUSIVE;
  const offered = projectRoleOptions(template);
  const unavailable = roles.find((role) => !offered.includes(role));
  return unavailable ? `${projectRoleLabel(unavailable, template)} is not available in this project.` : "";
};

// same roles, whatever the order
export const sameRoles = (a, b) => a.length === b.length && a.every((role) => b.includes(role));

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
