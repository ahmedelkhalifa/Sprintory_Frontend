import api from "./client";

// plain members only get the projects they are in
// params: { q, page, size, status } (status is ASSUMED until R30, see below)
export const listProjects = (workspaceId, params, signal) =>
  api.get(`/workspaces/${workspaceId}/projects`, { params, signal }).then((res) => res.data);

// key (unique in the workspace, 409 PROJECT_KEY_TAKEN) and template (SCRUM / KANBAN) are required and can never
// change; description is optional. The creator becomes Project Manager; the board gets the template's columns
export const createProject = (workspaceId, { name, key, template, description }) =>
  api.post(`/workspaces/${workspaceId}/projects`, { name, key, template, description }).then((res) => res.data);

// needs EDIT_SETTINGS; only name and description. A field left out stays as it is, description "" clears it
export const updateProject = (projectId, { name, description }) =>
  api.patch(`/projects/${projectId}`, { name, description }).then((res) => res.data);

// roles and permissions in the response are the caller's own
export const getProject = (projectId, signal) =>
  api.get(`/projects/${projectId}`, { signal }).then((res) => res.data);

// params: { q, page, size }
export const listProjectMembers = (projectId, params, signal) =>
  api.get(`/projects/${projectId}/members`, { params, signal }).then((res) => res.data);

// needs VIEW_WORK or CONFIGURE_BOARD; { template, backlogEnabled, sprintsEnabled, wipLimitsEnabled, activeSprintId,
// columns: [{ id, name, position, category, wipLimit, taskCount, wipExceeded }] } with the columns in order.
// category is TODO / IN_PROGRESS / DONE; taskCount counts every task in the column (no filters)
export const getBoard = (projectId, signal) =>
  api.get(`/projects/${projectId}/board`, { signal }).then((res) => res.data);

// Board columns (backend docs/board-docs.md, R16): every change needs CONFIGURE_BOARD (Project Manager, workspace
// admin) and answers the whole board. 400 BAD_REQUEST with a readable message when a rule says no (duplicate name,
// 2–10 columns, the last TODO / DONE column, the Kanban backlog, ...)

// { name, category, afterColumnId } (afterColumnId left out = at the end)
export const createBoardColumn = (projectId, { name, category, afterColumnId = null }) =>
  api.post(`/projects/${projectId}/board/columns`, { name, category, afterColumnId }).then((res) => res.data);

// only the fields that change: { name, category, wipLimit } or { clearWipLimit: true }; a limited column that becomes
// DONE must clear its limit in the same request
export const updateBoardColumn = (projectId, columnId, changes) =>
  api.patch(`/projects/${projectId}/board/columns/${columnId}`, changes).then((res) => res.data);

// every column id once, in the new order (the Kanban backlog stays first)
export const reorderBoardColumns = (projectId, columnIds) =>
  api.put(`/projects/${projectId}/board/columns/order`, { columnIds }).then((res) => res.data);

// a column that holds tasks needs `targetColumnId`: they move there. Soft delete, no restore (204, no body)
export const deleteBoardColumn = (projectId, columnId, targetColumnId = null) =>
  api.delete(`/projects/${projectId}/board/columns/${columnId}`, {
    data: targetColumnId === null ? undefined : { targetColumnId },
  });

// needs MANAGE_MEMBERS; all or nothing: every id must be a workspace member, at most 100 per request
export const addProjectMembers = (projectId, userIds) =>
  api.post(`/projects/${projectId}/members`, { userIds });

// needs MANAGE_MEMBERS; a one-time copy of the team's current members
export const addTeamToProject = (projectId, teamId) =>
  api.post(`/projects/${projectId}/teams`, { teamId });

// needs MANAGE_MEMBERS; the last Project Manager can't be removed (LAST_PROJECT_MANAGER)
export const removeProjectMember = (projectId, userId) =>
  api.delete(`/projects/${projectId}/members/${userId}`);

// needs MANAGE_ROLES; the list REPLACES the member's roles. 400 INVALID_PROJECT_ROLES (empty, Viewer combined with
// another role, or a role the template doesn't offer), 409 LAST_PROJECT_MANAGER, 404 when they aren't a member
export const setProjectMemberRoles = (projectId, userId, roles) =>
  api.put(`/projects/${projectId}/members/${userId}/roles`, { roles }).then((res) => res.data);

// ASSUMED until R30 (archive): not in the backend yet, shapes copied from workspaces (archive/restore)
// and teams (DELETE). Fix them here once agreed.

// needs ARCHIVE_PROJECT
export const archiveProject = (projectId) =>
  api.post(`/projects/${projectId}/archive`).then((res) => res.data);

// needs ARCHIVE_PROJECT
export const restoreProject = (projectId) =>
  api.post(`/projects/${projectId}/restore`).then((res) => res.data);

// needs ARCHIVE_PROJECT (the backend has no delete permission yet); cannot be undone
export const deleteProject = (projectId) => api.delete(`/projects/${projectId}`);
