import api from "./client";

// Tasks (story 9), see the backend's docs/tasks-docs.md. Reading needs VIEW_WORK, changing EDIT_TASKS.
const tasksPath = (projectId) => `/projects/${projectId}/tasks`;

// the backend's page size limit
const MAX_PAGE_SIZE = 100;

// params: { q, type, priority, statusId, assigneeId, label, order (newest | board | backlog), page, size }
export const listTasks = (projectId, params, signal) =>
  api.get(tasksPath(projectId), { params, signal }).then((res) => res.data);

// every task of the project in `order` ("board" or "backlog"), fetching page after page
export const listAllTasks = async (projectId, order, signal) => {
  const tasks = [];
  for (let page = 0; ; page += 1) {
    const result = await listTasks(projectId, { order, page, size: MAX_PAGE_SIZE }, signal);
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
// clearDescription (see taskChanges in utils/task.js)
export const updateTask = (projectId, taskId, changes) =>
  api.patch(`${tasksPath(projectId)}/${taskId}`, changes).then((res) => res.data);

// a soft delete: the task disappears everywhere, its key is never reused
export const deleteTask = (projectId, taskId) => api.delete(`${tasksPath(projectId)}/${taskId}`);

// one drag on the board: into column `statusId`, right after `afterTaskId` in that column (null = first)
export const moveOnBoard = (projectId, taskId, { statusId, afterTaskId = null }) =>
  api.put(`${tasksPath(projectId)}/${taskId}/position`, { statusId, afterTaskId }).then((res) => res.data);

// needs MANAGE_BACKLOG (the Product Owner); right after `afterTaskId` in the backlog (null = first). Scrum only
export const rankInBacklog = (projectId, taskId, afterTaskId = null) =>
  api.put(`${tasksPath(projectId)}/${taskId}/backlog-rank`, { afterTaskId }).then((res) => res.data);
