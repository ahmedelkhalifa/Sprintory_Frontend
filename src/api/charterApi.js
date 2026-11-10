import api from "./client";

// The project charter (PMP-116, backend project-charter-docs.md): goals, scope, stakeholders and the goal / scope
// history. Members only (Viewers included): anyone else gets 404. Every change needs EDIT_CHARTER and answers
// 409 CHARTER_READ_ONLY once the project is completed or archived.

// { projectId, canEdit, readOnly, inScope, outOfScope, goals: [...], stakeholders: [...] }
export const getCharter = (projectId, signal) =>
  api.get(`/projects/${projectId}/charter`, { signal }).then((res) => res.data);

// PageResponse of { id, actorId, actorName, occurredAt, changeType, oldValue, newValue }, newest first
export const getCharterHistory = (projectId, { page = 0, size = 20 } = {}, signal) =>
  api.get(`/projects/${projectId}/charter/history`, { params: { page, size }, signal }).then((res) => res.data);

// body: { title, successMeasure }; returns the goal { id, title, successMeasure, order }
export const createCharterGoal = (projectId, body) =>
  api.post(`/projects/${projectId}/charter/goals`, body).then((res) => res.data);

export const updateCharterGoal = (projectId, goalId, body) =>
  api.put(`/projects/${projectId}/charter/goals/${goalId}`, body).then((res) => res.data);

export const deleteCharterGoal = (projectId, goalId) => api.delete(`/projects/${projectId}/charter/goals/${goalId}`);

// every goal id exactly once, in the new order; returns the ordered goals
export const reorderCharterGoals = (projectId, goalIds) =>
  api.put(`/projects/${projectId}/charter/goals/order`, { goalIds }).then((res) => res.data);

// replaces both texts (TipTap JSON strings, null clears one); returns the whole charter
export const updateCharterScope = (projectId, { inScope, outOfScope }) =>
  api.put(`/projects/${projectId}/charter/scope`, { inScope, outOfScope }).then((res) => res.data);

// body: { name, organization, projectRole, interest, influence, contactEmail, linkedUserId }
export const createStakeholder = (projectId, body) =>
  api.post(`/projects/${projectId}/charter/stakeholders`, body).then((res) => res.data);

export const updateStakeholder = (projectId, stakeholderId, body) =>
  api.put(`/projects/${projectId}/charter/stakeholders/${stakeholderId}`, body).then((res) => res.data);

export const deleteStakeholder = (projectId, stakeholderId) =>
  api.delete(`/projects/${projectId}/charter/stakeholders/${stakeholderId}`);
