// Audit log values as the backend sends them (audit-log-docs.md §4, summary in dev-docs/audit-log.md)

export const AUDIT_AREAS = {
  WORKSPACE: "Workspace",
  TEAM: "Teams",
  PROJECT: "Projects",
  TASK: "Tasks",
  SECURITY: "Security",
};

// every logged action with its area and the label shown in the table and the filter.
// The order is the order of the filter's list (grouped by area)
export const AUDIT_ACTIONS = {
  WORKSPACE_RENAMED: { area: "WORKSPACE", label: "Workspace renamed" },
  MEMBER_INVITED: { area: "WORKSPACE", label: "Member invited" },
  MEMBER_JOINED: { area: "WORKSPACE", label: "Member joined" },
  MEMBER_REMOVED: { area: "WORKSPACE", label: "Member removed" },
  MEMBER_LEFT: { area: "WORKSPACE", label: "Member left" },
  WORKSPACE_ROLE_CHANGED: { area: "WORKSPACE", label: "Workspace role changed" },
  TEAM_CREATED: { area: "TEAM", label: "Team created" },
  TEAM_RENAMED: { area: "TEAM", label: "Team renamed" },
  TEAM_DELETED: { area: "TEAM", label: "Team deleted" },
  TEAM_MEMBER_ADDED: { area: "TEAM", label: "Team member added" },
  TEAM_MEMBER_REMOVED: { area: "TEAM", label: "Team member removed" },
  PROJECT_CREATED: { area: "PROJECT", label: "Project created" },
  PROJECT_SETTINGS_CHANGED: { area: "PROJECT", label: "Project settings changed" },
  PROJECT_MEMBER_ADDED: { area: "PROJECT", label: "Project member added" },
  PROJECT_MEMBER_REMOVED: { area: "PROJECT", label: "Project member removed" },
  PROJECT_ROLES_CHANGED: { area: "PROJECT", label: "Project roles changed" },
  TASK_DELETED: { area: "TASK", label: "Task deleted" },
  TASK_RESTORED: { area: "TASK", label: "Task restored" },
  PASSWORD_RESET: { area: "SECURITY", label: "Password reset" },
  LOGIN_FAILED_REPEATED: { area: "SECURITY", label: "Repeated failed logins" },
};

// the filter's options grouped by area: [{ area: "PROJECT", label: "Projects", actions: ["PROJECT_CREATED", ...] }]
export const AUDIT_ACTION_GROUPS = Object.keys(AUDIT_AREAS).map((area) => ({
  area,
  label: AUDIT_AREAS[area],
  actions: Object.keys(AUDIT_ACTIONS).filter((code) => AUDIT_ACTIONS[code].area === area),
}));

export const AUDIT_PAGE_SIZE = 20;

// labels for the `field` of a change; any other field is shown readable from its name
export const AUDIT_FIELD_LABELS = {
  name: "Name",
  key: "Key",
  template: "Template",
  description: "Description",
  role: "Role",
  roles: "Roles",
  team: "Team",
  viaTeam: "Via team",
  failedAttempts: "Failed attempts",
};

// the backend never stores secrets, so none can come back; a change of a field that looks like one is dropped
// anyway, so a mistake on the server can't reach the screen (story: no passwords, tokens or links in entries)
export const SENSITIVE_FIELD = /pass(word)?|token|secret|credential|hash|link/i;
