// Project values as the backend sends them (projects-docs.md, roles-docs.md)

export const TEMPLATES = {
  SCRUM: { value: "SCRUM", label: "Scrum", description: "Sprints, backlog and roles like Scrum Master and Product Owner." },
  KANBAN: { value: "KANBAN", label: "Kanban", description: "A continuous flow of work on a board, without sprints." },
};

// ASSUMED until R30 (archiving projects): the backend has no project status yet
export const PROJECT_STATUS = {
  ACTIVE: "ACTIVE",
  ARCHIVED: "ARCHIVED",
};

// what to tell the user when a change to a project is refused, by error code (projects-docs.md §4, roles-docs.md §5)
export const PROJECT_ERROR_MESSAGES = {
  ACCESS_DENIED: "You don't have permission to do this.",
  RESOURCE_NOT_FOUND: "This project no longer exists, or you no longer have access to it.",
  WORKSPACE_ARCHIVED: "This workspace is archived. Restore it to make changes.",
  PROJECT_ARCHIVED: "This project is archived. Restore it to make changes.", // ASSUMED (R30)
  LAST_PROJECT_MANAGER: "A project must keep at least one Project Manager. Make someone else Project Manager first.",
};

// the permissions the UI checks (full matrix: roles-docs.md §2). Hide controls by permission, not by role.
export const PERMISSIONS = {
  MANAGE_MEMBERS: "MANAGE_MEMBERS", // add people / a team, remove people
  EDIT_SETTINGS: "EDIT_SETTINGS", // rename (story 8)
  ARCHIVE_PROJECT: "ARCHIVE_PROJECT", // archive, restore, delete (R30)
};
