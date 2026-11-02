// TEMP in-browser stand-in for the audit log endpoints, until the backend has them (PMP-128, audit-log-docs.md §12).
// On unless VITE_MOCK_AUDIT=false. It answers with the contract's response shapes and error shape, checks the
// caller's real workspace role (GET /workspaces/{id}: members get 403, strangers 404) and filters, validates and
// pages like §3.1. The entries are made up (a fresh set per page load, built from the workspace's real members and
// projects, plus a person who has left and the system as actor), so nobody mistakes them for real history.
// Delete this file (and the MOCK branches in auditApi.js) once the endpoints exist.
import { getWorkspace, listWorkspaceMembers } from "../api/workspacesApi";
import { listProjects } from "../api/projectsApi";
import { AUDIT_ACTIONS } from "../constants/audit";
import { isWorkspaceAdmin } from "../utils/workspace";
import { auditActors, auditQueryError, queryAuditEntries } from "./auditFilter";

export const MOCK_AUDIT = import.meta.env.VITE_MOCK_AUDIT !== "false";

const DELAY_MS = 200;
const HOUR = 60 * 60 * 1000;

const wait = (signal) =>
  new Promise((resolve, reject) => {
    const abort = () => reject({ code: "ERR_CANCELED", message: "canceled" });
    if (signal?.aborted) return abort();
    const timer = setTimeout(resolve, DELAY_MS);
    signal?.addEventListener("abort", () => {
      clearTimeout(timer);
      abort();
    });
  });

// thrown errors look like axios errors from the real backend, so errorMessage / usePagedList work unchanged
const fail = (status, code, message) => {
  throw { response: { status, data: { status, code, message } } };
};

// small deterministic random numbers, so a workspace shows the same history while the page stays open
const seeded = (seed) => {
  let value = Number(seed) * 9301 + 49297;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
};

const person = (member) => ({
  id: member.userId,
  name: [member.firstName, member.lastName].filter(Boolean).join(" ") || member.email,
  email: member.email,
});

// someone who left the workspace: still the actor of old entries, but not in the members list any more
const FORMER = { id: 9001, name: "Bob Former", email: "bob.former@example.com" };
const LONG_DESCRIPTION =
  "Replace the legacy checkout with the new payment flow, migrate saved cards, update the receipts and keep the old " +
  "endpoints alive for two releases so the mobile apps can upgrade on their own schedule.";
const TEAMS = ["Backend", "Platform", "Design", "QA"];

// every logged action once or twice, spread over the last two weeks
const buildEntries = (workspace, members, projects) => {
  const random = seeded(workspace.id);
  const pick = (items) => items[Math.floor(random() * items.length)];
  const people = members.map(person);
  const admins = members.filter((m) => m.role === "WORKSPACE_ADMIN").map(person);
  const anyone = () => (random() < 0.15 ? FORMER : pick(people));
  const anAdmin = () => (admins.length > 0 ? pick(admins) : pick(people));
  const aProject = () => (projects.length > 0 ? pick(projects) : { id: 1, name: "Demo project", key: "DEMO", template: "SCRUM" });
  const user = (p) => ({ type: "USER", id: p.id, name: p.name });

  const makers = {
    WORKSPACE_RENAMED: () => ({
      actor: anAdmin(),
      target: { type: "WORKSPACE", id: workspace.id, name: workspace.name },
      changes: [{ field: "name", oldValue: `${workspace.name} (old)`, newValue: workspace.name }],
    }),
    MEMBER_INVITED: () => ({
      actor: anAdmin(),
      target: { type: "INVITATION", id: null, name: `new.hire${Math.floor(random() * 90) + 10}@example.com` },
      changes: [{ field: "role", oldValue: null, newValue: "WORKSPACE_MEMBER" }],
    }),
    MEMBER_JOINED: () => {
      const who = pick(people);
      return { actor: who, target: user(who), changes: [{ field: "role", oldValue: null, newValue: "WORKSPACE_MEMBER" }] };
    },
    MEMBER_REMOVED: () => ({
      actor: anAdmin(),
      target: user(FORMER),
      changes: [{ field: "role", oldValue: "WORKSPACE_MEMBER", newValue: null }],
    }),
    MEMBER_LEFT: () => ({
      actor: FORMER,
      target: user(FORMER),
      changes: [{ field: "role", oldValue: "WORKSPACE_MEMBER", newValue: null }],
    }),
    WORKSPACE_ROLE_CHANGED: () => ({
      actor: anAdmin(),
      target: user(pick(people)),
      changes: [{ field: "role", oldValue: "WORKSPACE_MEMBER", newValue: "WORKSPACE_ADMIN" }],
    }),
    TEAM_CREATED: () => {
      const name = pick(TEAMS);
      return { actor: anAdmin(), target: { type: "TEAM", id: 1, name }, changes: [{ field: "name", oldValue: null, newValue: name }] };
    },
    TEAM_RENAMED: () => ({
      actor: anAdmin(),
      target: { type: "TEAM", id: 1, name: "Platform" },
      changes: [{ field: "name", oldValue: "Backend", newValue: "Platform" }],
    }),
    TEAM_DELETED: () => ({
      actor: anAdmin(),
      target: { type: "TEAM", id: 2, name: "QA" },
      changes: [{ field: "name", oldValue: "QA", newValue: null }],
    }),
    TEAM_MEMBER_ADDED: () => ({
      actor: anAdmin(),
      target: user(pick(people)),
      changes: [{ field: "team", oldValue: null, newValue: "Backend" }],
    }),
    TEAM_MEMBER_REMOVED: () => ({
      actor: anAdmin(),
      target: user(pick(people)),
      changes: [{ field: "team", oldValue: "Backend", newValue: null }],
    }),
    PROJECT_CREATED: () => {
      const project = aProject();
      return {
        actor: anyone(),
        target: { type: "PROJECT", id: project.id, name: project.name },
        project: { id: project.id, name: project.name },
        changes: [
          { field: "name", oldValue: null, newValue: project.name },
          { field: "key", oldValue: null, newValue: project.key ?? "DEMO" },
          { field: "template", oldValue: null, newValue: project.template ?? "SCRUM" },
        ],
      };
    },
    PROJECT_SETTINGS_CHANGED: () => {
      const project = aProject();
      return {
        actor: anyone(),
        target: { type: "PROJECT", id: project.id, name: project.name },
        project: { id: project.id, name: project.name },
        changes:
          random() < 0.5
            ? [{ field: "description", oldValue: null, newValue: LONG_DESCRIPTION }]
            : [{ field: "name", oldValue: `${project.name} v1`, newValue: project.name }],
      };
    },
    PROJECT_MEMBER_ADDED: () => {
      const project = aProject();
      const viaTeam = random() < 0.4;
      return {
        actor: anyone(),
        target: user(pick(people)),
        project: { id: project.id, name: project.name },
        changes: [
          { field: "roles", oldValue: null, newValue: "MEMBER" },
          ...(viaTeam ? [{ field: "viaTeam", oldValue: null, newValue: "Backend" }] : []),
        ],
      };
    },
    PROJECT_MEMBER_REMOVED: () => {
      const project = aProject();
      return {
        actor: anyone(),
        target: user(pick(people)),
        project: { id: project.id, name: project.name },
        changes: [{ field: "roles", oldValue: "MEMBER", newValue: null }],
      };
    },
    PROJECT_ROLES_CHANGED: () => {
      const project = aProject();
      return {
        actor: anyone(),
        target: user(pick(people)),
        project: { id: project.id, name: project.name },
        changes: [{ field: "roles", oldValue: "MEMBER", newValue: "PROJECT_MANAGER, MEMBER" }],
      };
    },
    TASK_DELETED: () => {
      const project = aProject();
      return {
        actor: anyone(),
        target: { type: "TASK", id: 40 + Math.floor(random() * 50), name: `${project.key ?? "DEMO"}-${Math.floor(random() * 90) + 1} Fix login` },
        project: { id: project.id, name: project.name },
        changes: [],
      };
    },
    TASK_RESTORED: () => {
      const project = aProject();
      return {
        actor: anyone(),
        target: { type: "TASK", id: 41, name: `${project.key ?? "DEMO"}-7 Fix login` },
        project: { id: project.id, name: project.name },
        changes: [],
      };
    },
    PASSWORD_RESET: () => {
      const who = pick(people);
      return { actor: who, target: user(who), changes: [] };
    },
    LOGIN_FAILED_REPEATED: () => ({
      actor: null,
      target: user(pick(people)),
      changes: [{ field: "failedAttempts", oldValue: null, newValue: "5" }],
    }),
  };

  const now = Date.now();
  const entries = [];
  // 3 rounds over every action, each one a few hours apart: about 60 entries, so there is more than one page
  for (let round = 0; round < 3; round += 1) {
    for (const action of Object.keys(AUDIT_ACTIONS)) {
      const made = makers[action]();
      entries.push({
        action,
        area: AUDIT_ACTIONS[action].area,
        project: null,
        ...made,
        occurredAt: new Date(now - (round * 110 + random() * 100 + 1) * HOUR).toISOString(),
        actor: made.actor
          ? { id: made.actor.id, name: made.actor.name, email: made.actor.email }
          : null,
      });
    }
  }
  // ids grow with time, like the backend's
  return entries
    .sort((a, b) => new Date(a.occurredAt) - new Date(b.occurredAt))
    .map((entry, index) => ({ id: index + 1, ...entry }));
};

const cache = new Map(); // workspace id -> Promise<entries>

const entriesOf = (workspaceId) => {
  if (!cache.has(workspaceId)) {
    cache.set(
      workspaceId,
      Promise.all([
        getWorkspace(workspaceId),
        listWorkspaceMembers(workspaceId, { size: 100 }),
        listProjects(workspaceId, { size: 100 }),
      ]).then(([workspace, members, projects]) => buildEntries(workspace, members.content, projects.content)),
    );
    cache.get(workspaceId).catch(() => cache.delete(workspaceId));
  }
  return cache.get(workspaceId);
};

// the caller's real role decides, like the backend: strangers get the workspace's 404 from getWorkspace,
// members a 403
const requireAdmin = async (workspaceId) => {
  const workspace = await getWorkspace(workspaceId);
  if (!isWorkspaceAdmin(workspace)) fail(403, "ACCESS_DENIED", "You do not have access to this resource.");
};

export const listAuditLog = async (workspaceId, params = {}, signal) => {
  await wait(signal);
  await requireAdmin(workspaceId);
  const error = auditQueryError(params);
  if (error) fail(400, "BAD_REQUEST", error);
  return queryAuditEntries(await entriesOf(workspaceId), params);
};

export const listAuditActors = async (workspaceId, signal) => {
  await wait(signal);
  await requireAdmin(workspaceId);
  return auditActors(await entriesOf(workspaceId));
};
