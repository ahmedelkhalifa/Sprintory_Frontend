// Workspace values as the backend sends them (workspaces-docs.md, roles-docs.md)

export const WORKSPACE_ROLES = {
  WORKSPACE_ADMIN: "WORKSPACE_ADMIN",
  WORKSPACE_MEMBER: "WORKSPACE_MEMBER",
};

// the role picker's options, in order
export const WORKSPACE_ROLE_OPTIONS = [WORKSPACE_ROLES.WORKSPACE_ADMIN, WORKSPACE_ROLES.WORKSPACE_MEMBER];

// what to tell the user when changing a workspace role is refused, by error code
export const WORKSPACE_ERROR_MESSAGES = {
  ACCESS_DENIED: "You don't have permission to do this.",
  RESOURCE_NOT_FOUND: "This person is no longer a member of the workspace.",
  WORKSPACE_ARCHIVED: "This workspace is archived. Restore it to make changes.",
  LAST_WORKSPACE_ADMIN: "A workspace must have at least one admin.",
};
