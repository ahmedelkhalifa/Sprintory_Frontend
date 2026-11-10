// Project charter values as the backend sends them (project-charter-docs.md)

// field limits, the same as the backend's request checks
export const CHARTER_LIMITS = {
  GOAL_TITLE: 200,
  GOAL_MEASURE: 1000,
  STAKEHOLDER_NAME: 200,
  STAKEHOLDER_ORGANIZATION: 200,
  STAKEHOLDER_ROLE: 100,
  STAKEHOLDER_EMAIL: 254,
};

// interest and influence: one of these or null
export const STAKEHOLDER_LEVELS = ["LOW", "MEDIUM", "HIGH"];

export const STAKEHOLDER_LEVEL_LABEL = { LOW: "Low", MEDIUM: "Medium", HIGH: "High" };

// ToneChip colors, from quiet to strong
export const STAKEHOLDER_LEVEL_TONE = { LOW: "text.secondary", MEDIUM: "warning.main", HIGH: "error.main" };

// suggestions only: the role is free text
export const STAKEHOLDER_ROLE_SUGGESTIONS = ["Sponsor", "Client", "End user", "Supplier", "Regulator", "Subject matter expert"];

export const CHARTER_HISTORY_TYPES = {
  GOAL_ADDED: "GOAL_ADDED",
  GOAL_UPDATED: "GOAL_UPDATED",
  GOAL_DELETED: "GOAL_DELETED",
  GOALS_REORDERED: "GOALS_REORDERED",
  IN_SCOPE_CHANGED: "IN_SCOPE_CHANGED",
  OUT_OF_SCOPE_CHANGED: "OUT_OF_SCOPE_CHANGED",
};

// what to tell the user when a charter change is refused, by error code
export const CHARTER_ERROR_MESSAGES = {
  CHARTER_READ_ONLY: "This project is completed or archived, so its charter is read-only.",
  WORKSPACE_ARCHIVED: "This workspace is archived. Restore it to make changes.",
  ACCESS_DENIED: "Only the Project Manager (and the Product Owner in Scrum) can edit the charter.",
  RESOURCE_NOT_FOUND: "This item no longer exists, or you no longer have access to it.",
};
