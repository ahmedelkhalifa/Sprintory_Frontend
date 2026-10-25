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

// the permissions the UI checks (full matrix: roles-docs.md §2). Hide controls by permission, not by role.
export const PERMISSIONS = {
  MANAGE_MEMBERS: "MANAGE_MEMBERS", // add people / a team, remove people
  EDIT_SETTINGS: "EDIT_SETTINGS", // rename (story 8)
  ARCHIVE_PROJECT: "ARCHIVE_PROJECT", // archive, restore, delete (R30)
};
