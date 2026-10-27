import api from "./client";
import * as mock from "../mocks/sprintsMock";

// ASSUMED until the backend has sprints (R14/R15): shapes in dev-docs/tasks.md.
// The backend has no sprint endpoints yet, so the in-browser mock is on unless VITE_MOCK_SPRINTS=false.
const MOCK = mock.MOCK_SPRINTS;

// needs VIEW_WORK; planned + active sprints, each with `taskIds` (its tasks in sprint order)
export const listSprints = (projectId, signal) =>
  MOCK ? mock.listSprints(projectId, signal) : api.get(`/projects/${projectId}/sprints`, { signal }).then((res) => res.data);

// needs MANAGE_SPRINTS; body: { name?, goal?, capacity?, startDate?, endDate? } (a blank name gets "<KEY> Sprint N")
export const createSprint = (projectId, body) =>
  MOCK ? mock.createSprint(projectId, body) : api.post(`/projects/${projectId}/sprints`, body).then((res) => res.data);

// needs MANAGE_SPRINTS
export const updateSprint = (sprintId, changes) =>
  MOCK ? mock.updateSprint(sprintId, changes) : api.patch(`/sprints/${sprintId}`, changes).then((res) => res.data);

// needs MANAGE_SPRINTS; only a planned sprint, its tasks go back to their places in the backlog
export const deleteSprint = (sprintId) => (MOCK ? mock.deleteSprint(sprintId) : api.delete(`/sprints/${sprintId}`));

// needs MANAGE_SPRINTS; body: { startDate, endDate, goal? }. 409 SPRINT_ALREADY_ACTIVE if another one runs
export const startSprint = (sprintId, body) =>
  MOCK ? mock.startSprint(sprintId, body) : api.post(`/sprints/${sprintId}/start`, body).then((res) => res.data);

// needs MANAGE_SPRINTS; ends the active sprint. Unfinished tasks (not in the last column) go to the planned sprint
// `carryOverSprintId`, to a new sprint (`createSprint: true`), or back to the backlog (neither)
export const completeSprint = (sprintId, body) =>
  MOCK ? mock.completeSprint(sprintId, body) : api.post(`/sprints/${sprintId}/complete`, body).then((res) => res.data);

// needs MANAGE_SPRINTS; puts a task into a sprint after `afterTaskId` (null = first), or back in the backlog (sprintId null)
export const moveToSprint = (projectId, { taskId, sprintId = null, afterTaskId = null }) =>
  MOCK
    ? mock.moveToSprint(projectId, { taskId, sprintId, afterTaskId })
    : api.post(`/projects/${projectId}/sprints/move`, { taskId, sprintId, afterTaskId });
