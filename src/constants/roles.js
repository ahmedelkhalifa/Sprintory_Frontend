// Roles as the backend sends them (workspaces-docs.md "Workspace roles", roles-docs.md "Project roles")

export const WORKSPACE_ADMIN = "WORKSPACE_ADMIN";
export const WORKSPACE_MEMBER = "WORKSPACE_MEMBER";

export const PROJECT_MANAGER = "PROJECT_MANAGER";
export const PRODUCT_OWNER = "PRODUCT_OWNER";
export const SCRUM_MASTER = "SCRUM_MASTER";
export const MEMBER = "MEMBER";
export const VIEWER = "VIEWER";

const PROJECT_ROLE_LABELS = {
  [PROJECT_MANAGER]: "Project Manager",
  [PRODUCT_OWNER]: "Product Owner",
  [SCRUM_MASTER]: "Scrum Master",
  [MEMBER]: "Member",
  [VIEWER]: "Viewer",
};

// MEMBER is one API value with two names: "Developer" in Scrum projects, "Member" in Kanban
export function projectRoleLabel(role, template) {
  if (role === MEMBER && template === "SCRUM") return "Developer";
  return PROJECT_ROLE_LABELS[role] ?? role;
}
