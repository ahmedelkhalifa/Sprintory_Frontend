import { projectPath } from "./project.js";
import { taskPath } from "./task.js";

// Where "open" sends the user ({ kind, workspaceId, projectId, taskId } from POST /notifications/{id}/open),
// or null for NONE (an invitation or a security notice: there is nothing to open).
// The url takes the workspace slug; a workspace not in the list yet (e.g. just joined) uses its id,
// which WorkspaceAccessGuard redirects to the slug
export const notificationTargetPath = (target, workspaces = []) => {
  if (!target || (target.kind !== "TASK" && target.kind !== "PROJECT") || target.projectId == null) return null;
  const workspace = workspaces.find((w) => w.id === target.workspaceId) ?? { slug: String(target.workspaceId) };
  const project = { id: target.projectId };
  if (target.kind === "TASK" && target.taskId != null) return taskPath(workspace, project, target.taskId);
  return projectPath(workspace, project);
};

// "Mobile App · Acme", "Acme" for a workspace notification, "" for a security one (no workspace)
export const notificationWhere = (notification) =>
  [notification?.project?.name, notification?.workspace?.name].filter(Boolean).join(" · ");

const time = (notification) => Date.parse(notification.createdAt) || 0;

// one list from several (loaded pages, stream events), each id once, newest first like the backend
// (createdAt, then id). The first copy of an id wins, so pass the fresher list first
export const mergeNotifications = (...lists) => {
  const byId = new Map();
  for (const notification of lists.flat()) {
    if (!byId.has(notification.id)) byId.set(notification.id, notification);
  }
  return [...byId.values()].sort((a, b) => time(b) - time(a) || b.id - a.id);
};

// the PUT body for "Reset to defaults": every unlocked category with its defaults (locked ones can't change)
export const preferenceDefaults = (preferences) =>
  preferences
    .filter((p) => !p.locked)
    .map((p) => ({ category: p.category, inApp: p.defaultInApp, email: p.defaultEmail }));

export const preferencesAtDefaults = (preferences) =>
  preferences.every((p) => p.locked || (p.inApp === p.defaultInApp && p.email === p.defaultEmail));
