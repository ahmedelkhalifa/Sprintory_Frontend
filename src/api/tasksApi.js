import api from "./client";
import * as mock from "../mocks/tasksMock";

// ASSUMED until the backend has tasks (R09) and the backlog (R13): shapes in dev-docs/tasks.md.
// With VITE_MOCK_TASKS=true every call goes to the in-browser mock instead.
const MOCK = mock.MOCK_TASKS;

// needs VIEW_WORK; { sprints: planned + active sprints with their tasks in order, backlog: tasks in rank order }
export const getBacklog = (projectId, signal) =>
  MOCK
    ? mock.getBacklog(projectId, signal)
    : api.get(`/projects/${projectId}/backlog`, { signal }).then((res) => res.data);

// needs EDIT_TASKS; the new task goes to the bottom of the backlog
// body: { title, type?, priority?, description?, estimate?, labels?, assigneeId? }
export const createTask = (projectId, body) =>
  MOCK ? mock.createTask(projectId, body) : api.post(`/projects/${projectId}/tasks`, body).then((res) => res.data);

// needs VIEW_WORK
export const getTask = (taskId, signal) =>
  MOCK ? mock.getTask(taskId, signal) : api.get(`/tasks/${taskId}`, { signal }).then((res) => res.data);

// needs EDIT_TASKS; any subset of the editable fields (assigneeId null = unassign)
export const updateTask = (taskId, changes) =>
  MOCK ? mock.updateTask(taskId, changes) : api.patch(`/tasks/${taskId}`, changes).then((res) => res.data);

// needs EDIT_TASKS
export const deleteTask = (taskId) => (MOCK ? mock.deleteTask(taskId) : api.delete(`/tasks/${taskId}`));

// moves a task to the backlog (sprintId null) or a sprint, before `beforeTaskId` (null = at the end).
// inside the backlog it needs MANAGE_BACKLOG; when a sprint is involved, MANAGE_SPRINTS
export const moveTask = (projectId, { taskId, sprintId = null, beforeTaskId = null }) =>
  MOCK
    ? mock.moveTask(projectId, { taskId, sprintId, beforeTaskId })
    : api.post(`/projects/${projectId}/backlog/move`, { taskId, sprintId, beforeTaskId });
