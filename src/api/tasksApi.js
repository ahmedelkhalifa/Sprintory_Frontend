import api from "./client";

// Tasks (story 9), see the backend's docs/tasks-docs.md. Reading needs VIEW_WORK, changing EDIT_TASKS.
const tasksPath = (projectId) => `/projects/${projectId}/tasks`;

// the backend's page size limit
const MAX_PAGE_SIZE = 100;

// params: { q, type, priority, statusId, assigneeId, label, order (newest | board | backlog), page, size }
export const listTasks = (projectId, params, signal) =>
  api.get(tasksPath(projectId), { params, signal }).then((res) => res.data);

// every task of the project that matches `params`, fetching page after page.
// params: { order ("board" | "backlog"), and optionally the filters q, type, priority, statusId, assigneeId, label }
export const listAllTasks = async (projectId, params, signal) => {
  const tasks = [];
  for (let page = 0; ; page += 1) {
    const result = await listTasks(projectId, { ...params, page, size: MAX_PAGE_SIZE }, signal);
    tasks.push(...result.content);
    if (page + 1 >= result.totalPages) return tasks;
  }
};

// body: { title, type?, priority?, assigneeId?, estimate?, labels?, description? }; it starts in the first column
// and last in the backlog
export const createTask = (projectId, body) => api.post(tasksPath(projectId), body).then((res) => res.data);

export const getTask = (projectId, taskId, signal) =>
  api.get(`${tasksPath(projectId)}/${taskId}`, { signal }).then((res) => res.data);

// only the fields that change; null means "unchanged", so emptied fields go as clearAssignee / clearEstimate /
// clearDescription (see taskChanges in utils/task.js). Not for subtasks (updateSubtask): `estimate` is story points.
// Moving a parent into a Done column while it has open subtasks answers 409 OPEN_SUBTASKS_CONFIRMATION_REQUIRED;
// the same changes plus `confirmOpenSubtasks: true` go through
export const updateTask = (projectId, taskId, changes) =>
  api.patch(`${tasksPath(projectId)}/${taskId}`, changes).then((res) => res.data);

// a soft delete: the task disappears everywhere, its key is never reused. A parent takes its subtasks with it;
// a subtask is deleted on its own the same way
export const deleteTask = (projectId, taskId) => api.delete(`${tasksPath(projectId)}/${taskId}`);

// Subtasks (backend tasks-docs §10, PMP-132): one level under a top-level task, with their own key, title, assignee,
// status and an optional time estimate in minutes (no story points). The main task list never includes them; a
// parent answers `subtaskDone` / `subtaskTotal`, a subtask `parentTaskId` and `estimateMinutes`.

// the parent's subtasks, oldest first
export const listSubtasks = (projectId, parentId, signal) =>
  api.get(`${tasksPath(projectId)}/${parentId}/subtasks`, { signal }).then((res) => res.data);

// body: { title, assigneeId?, statusId?, estimateMinutes? }; no status = the board's first column
export const createSubtask = (projectId, parentId, body) =>
  api.post(`${tasksPath(projectId)}/${parentId}/subtasks`, body).then((res) => res.data);

// only the fields that change: { title, statusId, assigneeId, estimateMinutes } or clearAssignee /
// clearEstimateMinutes (see subtaskChanges in utils/task.js)
export const updateSubtask = (projectId, parentId, subtaskId, changes) =>
  api.patch(`${tasksPath(projectId)}/${parentId}/subtasks/${subtaskId}`, changes).then((res) => res.data);

// the task's status moves, oldest first: [{ id, fromColumnId, fromColumnName, toColumnId, toColumnName, actorId,
// changedAt }]. Names are kept as they were then. Other field changes and comments aren't in it yet (PMP-133)
export const getTaskHistory = (projectId, taskId, signal) =>
  api.get(`${tasksPath(projectId)}/${taskId}/history`, { signal }).then((res) => res.data);

// one drag on the board: into column `statusId`, right after `afterTaskId` in that column (null = first)
export const moveOnBoard = (projectId, taskId, { statusId, afterTaskId = null }) =>
  api.put(`${tasksPath(projectId)}/${taskId}/position`, { statusId, afterTaskId }).then((res) => res.data);

// needs MANAGE_BACKLOG (the Product Owner); right after `afterTaskId` in the backlog (null = first). Scrum only
export const rankInBacklog = (projectId, taskId, afterTaskId = null) =>
  api.put(`${tasksPath(projectId)}/${taskId}/backlog-rank`, { afterTaskId }).then((res) => res.data);
