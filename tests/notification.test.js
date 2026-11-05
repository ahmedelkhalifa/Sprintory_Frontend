import test from "node:test";
import assert from "node:assert/strict";
import {
  mergeNotifications,
  notificationTargetPath,
  notificationWhere,
  preferenceDefaults,
  preferencesAtDefaults,
} from "../src/utils/notification.js";

const workspaces = [{ id: 4, slug: "acme", name: "Acme" }];
const note = (id, createdAt, extra = {}) => ({ id, createdAt, read: false, message: `n${id}`, ...extra });

test("notificationTargetPath: a task opens the task page under the workspace slug", () => {
  const target = { kind: "TASK", workspaceId: 4, projectId: 15, taskId: 230, taskKey: "MOB-42" };
  assert.equal(notificationTargetPath(target, workspaces), "/workspaces/acme/projects/15/tasks/230");
});

test("notificationTargetPath: a project (membership, roles, sprints) opens the project", () => {
  const target = { kind: "PROJECT", workspaceId: 4, projectId: 15, taskId: null };
  assert.equal(notificationTargetPath(target, workspaces), "/workspaces/acme/projects/15");
});

test("notificationTargetPath: a workspace not in the list yet uses its id (the guard redirects it)", () => {
  const target = { kind: "TASK", workspaceId: 9, projectId: 2, taskId: 7 };
  assert.equal(notificationTargetPath(target, workspaces), "/workspaces/9/projects/2/tasks/7");
  assert.equal(notificationTargetPath({ kind: "PROJECT", workspaceId: 9, projectId: 2 }), "/workspaces/9/projects/2");
});

test("notificationTargetPath: nothing to open", () => {
  assert.equal(notificationTargetPath({ kind: "NONE", workspaceId: null, projectId: null }, workspaces), null);
  assert.equal(notificationTargetPath({ kind: "TASK", workspaceId: 4, projectId: null }, workspaces), null);
  assert.equal(notificationTargetPath({ kind: "OTHER", workspaceId: 4, projectId: 1 }, workspaces), null);
  assert.equal(notificationTargetPath(null, workspaces), null);
});

test("notificationWhere: project and workspace, only the workspace, or nothing", () => {
  assert.equal(
    notificationWhere({ project: { id: 15, name: "Mobile App" }, workspace: { id: 4, name: "Acme" } }),
    "Mobile App · Acme",
  );
  assert.equal(notificationWhere({ project: null, workspace: { id: 4, name: "Acme" } }), "Acme");
  assert.equal(notificationWhere({ project: null, workspace: null }), "");
});

test("mergeNotifications: newest first, each id once, the first copy wins", () => {
  const loaded = [note(2, "2026-11-03T10:00:00Z", { read: true }), note(1, "2026-11-03T09:00:00Z")];
  const streamed = note(3, "2026-11-03T11:00:00Z");
  const again = note(2, "2026-11-03T10:00:00Z", { read: false });

  const merged = mergeNotifications([streamed], loaded, [again]);
  assert.deepEqual(merged.map((n) => n.id), [3, 2, 1]);
  assert.equal(merged[1].read, true);
});

test("mergeNotifications: the same time is ordered by id, like the backend", () => {
  const at = "2026-11-03T10:00:00Z";
  assert.deepEqual(mergeNotifications([note(5, at)], [note(8, at), note(6, at)]).map((n) => n.id), [8, 6, 5]);
  assert.deepEqual(mergeNotifications([], []), []);
});

const prefs = [
  { category: "ASSIGNMENT", inApp: true, email: false, locked: false, defaultInApp: true, defaultEmail: true },
  { category: "COMMENT", inApp: true, email: false, locked: false, defaultInApp: true, defaultEmail: false },
  { category: "SECURITY", inApp: true, email: true, locked: true, defaultInApp: true, defaultEmail: true },
];

test("preferenceDefaults: every unlocked category with its defaults", () => {
  assert.deepEqual(preferenceDefaults(prefs), [
    { category: "ASSIGNMENT", inApp: true, email: true },
    { category: "COMMENT", inApp: true, email: false },
  ]);
});

test("preferencesAtDefaults: locked rows don't count", () => {
  assert.equal(preferencesAtDefaults(prefs), false);
  assert.equal(preferencesAtDefaults(prefs.slice(1)), true);
});
