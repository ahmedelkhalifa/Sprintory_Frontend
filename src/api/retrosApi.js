import api from "./client";

// Sprint retrospectives (PMP-148, backend retrospectives-docs.md; the backend, PMP-147, isn't in its main yet). Scrum
// only, one per ended sprint. Reading needs VIEW_WORK, cards and votes RETRO_CONTRIBUTE, the rest RETRO_MANAGE. A closed
// retro never changes again (409 RETRO_CLOSED). A project's retros aren't listed: each ended sprint has its `retroId`.

// the sprint's retro: creates it, or answers the one it already has, so every entry point can call this.
// 409 RETRO_SPRINT_NOT_ENDED while the sprint is planned or active
export const openRetro = (sprintId) => api.post(`/sprints/${sprintId}/retro`).then((res) => res.data);

// the whole board: { id, projectId, title, status: OPEN | CLOSED, createdAt, createdBy, closedAt, closedBy, sprint,
// items, votesPerMember, votesLeft, actions, previousActions: { retroId, sprintName, actions } | null, canContribute,
// canManage }
export const getRetro = (retroId, signal) => api.get(`/retros/${retroId}`, { signal }).then((res) => res.data);

// body: { column: WENT_WELL | TO_IMPROVE | IDEAS, body: a TipTap JSON string }; returns the card { id, column, author,
// body, mentions, createdAt, editedAt, voteCount, votedByMe, canEdit, canDelete }
export const createRetroItem = (retroId, body) => api.post(`/retros/${retroId}/items`, body).then((res) => res.data);

// the full new text, by its author only; the column can't change
export const updateRetroItem = (itemId, body) => api.patch(`/retro-items/${itemId}`, { body }).then((res) => res.data);

// everyone who voted on it gets that vote back; an action made from it keeps its task
export const deleteRetroItem = (itemId) => api.delete(`/retro-items/${itemId}`);

// { itemId, voteCount, votedByMe, votesLeft }. 409 ALREADY_VOTED or NO_VOTES_LEFT
export const voteRetroItem = (itemId) => api.post(`/retro-items/${itemId}/votes`).then((res) => res.data);

// the caller's own vote; removing one that isn't there is not an error. Same answer as voting
export const unvoteRetroItem = (itemId) => api.delete(`/retro-items/${itemId}/votes`).then((res) => res.data);

// body: { title, ownerId, itemId?, sprintId? (a PLANNED sprint, else the backlog) }; creates a real task and returns
// { id, itemId, createdAt, task: { id, key, title, statusName, statusCategory, assignee, sprintId, sprintName, deleted } }
export const createRetroAction = (retroId, body) => api.post(`/retros/${retroId}/actions`, body).then((res) => res.data);

// freezes cards, votes and the action list for good; returns the closed retro
export const closeRetro = (retroId) => api.post(`/retros/${retroId}/close`).then((res) => res.data);
