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
  LAST_PROJECT_MANAGER: "A project must have at least one Project Manager. Make someone else Project Manager first.",
};

// every project role the API sends, in the order the role picker lists them
export const PROJECT_ROLES = {
  PROJECT_MANAGER: "PROJECT_MANAGER",
  PRODUCT_OWNER: "PRODUCT_OWNER",
  SCRUM_MASTER: "SCRUM_MASTER",
  MEMBER: "MEMBER",
  VIEWER: "VIEWER",
};

// the template decides which roles a project offers (roles-docs.md §1)
export const PROJECT_ROLES_BY_TEMPLATE = {
  SCRUM: [
    PROJECT_ROLES.PROJECT_MANAGER,
    PROJECT_ROLES.PRODUCT_OWNER,
    PROJECT_ROLES.SCRUM_MASTER,
    PROJECT_ROLES.MEMBER,
    PROJECT_ROLES.VIEWER,
  ],
  KANBAN: [PROJECT_ROLES.PROJECT_MANAGER, PROJECT_ROLES.MEMBER, PROJECT_ROLES.VIEWER],
};

// one line per role for the role picker
export const PROJECT_ROLE_DESCRIPTIONS = {
  PROJECT_MANAGER: "Manages settings, members, roles and archiving. Can also work on tasks.",
  PRODUCT_OWNER: "Owns and orders the product backlog. Can also work on tasks.",
  SCRUM_MASTER: "Starts and closes sprints and runs Scrum events. Can also work on tasks.",
  MEMBER: "Creates and works on tasks, comments and logs time.",
  VIEWER: "Read-only access. Can't be combined with other roles.",
};

// the texts the spec asks for when a role change is refused
export const ROLE_MESSAGES = {
  EMPTY: "A member must have at least one role.",
  VIEWER_EXCLUSIVE: "Viewer can't be combined with other roles.",
};

// every project permission the backend has (ProjectPermission, matrix: roles-docs.md §2).
// hide controls by permission, not by role; the caller's set comes on the project response.
export const PERMISSIONS = {
  VIEW_PROJECT: "VIEW_PROJECT", // the project and its member list
  VIEW_WORK: "VIEW_WORK", // tasks, comments, sprints, reports (a non-member workspace admin lacks it)
  EDIT_SETTINGS: "EDIT_SETTINGS", // name and description (story 8)
  ARCHIVE_PROJECT: "ARCHIVE_PROJECT", // archive, restore, delete (R30)
  MANAGE_MEMBERS: "MANAGE_MEMBERS", // add people / a team, remove people
  MANAGE_ROLES: "MANAGE_ROLES", // change members' project roles
  CONFIGURE_BOARD: "CONFIGURE_BOARD", // board columns and WIP limits (R16)
  MANAGE_BACKLOG: "MANAGE_BACKLOG", // order and prioritize the backlog (R13)
  MANAGE_SPRINTS: "MANAGE_SPRINTS", // plan, start and close sprints (R14, R15)
  EDIT_TASKS: "EDIT_TASKS", // create, edit and delete tasks (story 9)
  COMMENT: "COMMENT", // comment on tasks (R10)
  LOG_TIME: "LOG_TIME", // log time on tasks (R19)
};
