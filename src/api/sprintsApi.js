import api from "./client";
import * as mock from "../mocks/tasksMock";

// ASSUMED until the backend has sprint planning (R14): shapes in dev-docs/tasks.md.
// With VITE_MOCK_TASKS=true every call goes to the in-browser mock instead.
// Sprints are listed with their tasks by getBacklog in tasksApi.js.
const MOCK = mock.MOCK_TASKS;

// needs MANAGE_SPRINTS; body: { name?, goal?, capacity?, startDate?, endDate? } (a blank name gets "<KEY> Sprint N")
export const createSprint = (projectId, body) =>
  MOCK ? mock.createSprint(projectId, body) : api.post(`/projects/${projectId}/sprints`, body).then((res) => res.data);

// needs MANAGE_SPRINTS
export const updateSprint = (sprintId, changes) =>
  MOCK ? mock.updateSprint(sprintId, changes) : api.patch(`/sprints/${sprintId}`, changes).then((res) => res.data);

// needs MANAGE_SPRINTS; only a planned sprint, its tasks go back to the top of the backlog
export const deleteSprint = (sprintId) => (MOCK ? mock.deleteSprint(sprintId) : api.delete(`/sprints/${sprintId}`));

// needs MANAGE_SPRINTS; body: { startDate, endDate, goal? }. 409 SPRINT_ALREADY_ACTIVE if another one runs
export const startSprint = (sprintId, body) =>
  MOCK ? mock.startSprint(sprintId, body) : api.post(`/sprints/${sprintId}/start`, body).then((res) => res.data);
