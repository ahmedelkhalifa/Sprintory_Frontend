import api from "./client";

// Sprints of a Scrum project (backend sprints-docs.md, R14/R15; summary in dev-docs/sprints.md).
// Reading needs VIEW_WORK, every change MANAGE_SPRINTS (the Scrum Master). A sprint is PLANNED, ACTIVE, COMPLETED or
// CANCELLED; an ended one is read-only. Its `taskIds` are its top-level tasks in sprint order.

// planned and active sprints only, by number; read an ended one with getSprint
export const listSprints = (projectId, signal) =>
  api.get(`/projects/${projectId}/sprints`, { signal }).then((res) => res.data);

// any sprint, ended ones included
export const getSprint = (sprintId, signal) => api.get(`/sprints/${sprintId}`, { signal }).then((res) => res.data);

// body: { name?, goal?, capacity?, startDate?, endDate? }. A blank name becomes "<KEY> Sprint N", missing dates the
// next free period of the project's sprint length
export const createSprint = (projectId, body) =>
  api.post(`/projects/${projectId}/sprints`, body).then((res) => res.data);

// a partial update: both dates or neither, `clearCapacity: true` to remove the capacity
export const updateSprint = (sprintId, changes) => api.patch(`/sprints/${sprintId}`, changes).then((res) => res.data);

// only a planned sprint; its tasks go back to their places in the backlog
export const deleteSprint = (sprintId) => api.delete(`/sprints/${sprintId}`);

// body: { startDate, endDate, goal }. Needs a goal and at least one task; 409 SPRINT_ALREADY_ACTIVE if another one runs
export const startSprint = (sprintId, body) => api.post(`/sprints/${sprintId}/start`, body).then((res) => res.data);

// ends the active sprint. body: { goalAchieved: YES | PARTIALLY | NO, goalNote?, confirmEarlyClose?, and where the
// unfinished tasks go: carryOverSprintId (a planned sprint), createSprint: true (a new one), or neither (the backlog) }.
// Before the end date without confirmEarlyClose: 409 EARLY_CLOSE_CONFIRMATION_REQUIRED. Answers { sprint, carriedOver, toSprint }
export const completeSprint = (sprintId, body) =>
  api.post(`/sprints/${sprintId}/complete`, body).then((res) => res.data);

// what closing or cancelling the active sprint would do (PMP-41; VIEW_WORK): { doneCount, donePoints, unfinishedCount,
// unfinishedPoints, unfinished: [{ taskId, key, title, estimate, statusName, openSubtasks }] in sprint order,
// endsEarly, daysLeft, plannedSprints: [{ id, name, startDate }] }. 409 CONFLICT once it's no longer active
export const getClosePreview = (sprintId, signal) =>
  api.get(`/sprints/${sprintId}/close-preview`, { signal }).then((res) => res.data);

// CANCEL_SPRINTS (Product Owner, Project Manager, not the Scrum Master): ends the active sprint as CANCELLED because
// its goal became obsolete. `reason` is required (≤ 1000); unfinished work goes to the top of the backlog.
// Answers { sprint, carriedOver, toSprint: null }
export const cancelSprint = (sprintId, reason) =>
  api.post(`/sprints/${sprintId}/cancel`, { reason }).then((res) => res.data);

// puts a task into a sprint after `afterTaskId` (null = first), or back in the backlog (sprintId null)
export const moveToSprint = (projectId, { taskId, sprintId = null, afterTaskId = null }) =>
  api.post(`/projects/${projectId}/sprints/move`, { taskId, sprintId, afterTaskId });

// { suggestedCapacity (null before the first completed sprint), averageVelocity, normalPersonDays,
// availablePersonDays, workingDays, members: [{ userId, availableDays }] }; Viewers aren't counted
export const getCapacitySuggestion = (sprintId, signal) =>
  api.get(`/sprints/${sprintId}/capacity-suggestion`, { signal }).then((res) => res.data);

// a member's working days in the sprint (0 to workingDays); answers the new suggestion
export const setAvailability = (sprintId, userId, availableDays) =>
  api.put(`/sprints/${sprintId}/availability/${userId}`, { availableDays }).then((res) => res.data);

// tasks added to or removed from the sprint after it started, as a PageResponse of
// { id, sprintId, taskId, taskKey, action: ADDED | REMOVED, actorId, changedAt }
export const listScopeChanges = (sprintId, { page = 0, size = 20 } = {}, signal) =>
  api.get(`/sprints/${sprintId}/scope-history`, { params: { page, size }, signal }).then((res) => res.data);
