import api from "./client";

// The notifications API (notifications-docs.md, summary in dev-docs/notifications.md). Everything is the caller's
// own: one bell across all workspaces. There is no endpoint to create or delete a notification; the backend writes
// them as a side effect of other actions. The live stream is not here: see useNotificationStream.

// params (all optional): { unreadOnly, workspaceId, page, size } (size defaults to 20, capped at 100).
// Newest first; a PageResponse of { id, type, category, createdAt, read, readAt, message, excerpt, actor,
// workspace, project, task }. Notifications from projects the caller can no longer see are still listed
export const listNotifications = (params, signal) =>
  api.get("/notifications", { params, signal }).then((res) => res.data);

// { count }, across all workspaces; after the first call the stream pushes it
export const getUnreadCount = (signal) =>
  api.get("/notifications/unread-count", { signal }).then((res) => res.data);

// marks it read (even when the answer is 404) and says where to go:
// { kind: TASK | PROJECT | NONE, workspaceId, projectId, taskId, taskKey }.
// 404 RESOURCE_NOT_FOUND when the task or project is gone or no longer visible
export const openNotification = (id) => api.post(`/notifications/${id}/open`).then((res) => res.data);

// every unread one in every workspace; returns { count: 0 }
export const markAllRead = () => api.post("/notifications/read-all").then((res) => res.data);

// { preferences: [{ category, inApp, email, locked, defaultInApp, defaultEmail }] }, all 8 categories in a fixed order
export const getNotificationPreferences = (signal) =>
  api.get("/notification-preferences", { signal }).then((res) => res.data);

// partial: only the listed categories change, and an omitted channel stays as it is.
// Turning a locked category off answers 400 BAD_REQUEST. Returns the full matrix
export const updateNotificationPreferences = (preferences) =>
  api.put("/notification-preferences", { preferences }).then((res) => res.data);

// needs VIEW_WORK (viewers too), also in an archived workspace; { watching }.
// PUT and DELETE are idempotent; a workspace admin outside the project gets 403
const watchUrl = (projectId, taskId) => `/projects/${projectId}/tasks/${taskId}/watch`;

export const getWatch = (projectId, taskId, signal) =>
  api.get(watchUrl(projectId, taskId), { signal }).then((res) => res.data);

export const watchTask = (projectId, taskId) => api.put(watchUrl(projectId, taskId)).then((res) => res.data);

export const unwatchTask = (projectId, taskId) => api.delete(watchUrl(projectId, taskId)).then((res) => res.data);
