// The audit log's filtering, paging and validation as audit-log-docs.md §3.1 describes them, on a plain array of
// entries. Only the in-browser mock uses it (the real backend does this itself); it has no imports so tests can run it.

import { AUDIT_ACTIONS } from "../constants/audit.js";

const list = (value) =>
  String(value ?? "")
    .split(",")
    .map((part) => part.trim().toUpperCase())
    .filter(Boolean);

const positiveId = /^[1-9]\d*$/;

// "" when the query is fine, otherwise the backend's 400 message
export const auditQueryError = (query) => {
  const { from, to, actorId, projectId, actions, areas } = query;
  const instant = (value) => value != null && value !== "" && Number.isNaN(new Date(value).getTime());
  if (instant(from)) return "Invalid 'from': use an ISO-8601 instant such as 2026-11-01T00:00:00Z.";
  if (instant(to)) return "Invalid 'to': use an ISO-8601 instant such as 2026-11-01T00:00:00Z.";
  if (from && to && !(new Date(from) < new Date(to))) return "'from' must be before 'to'.";
  if (actorId != null && actorId !== "" && !positiveId.test(String(actorId))) return "'actorId' must be a positive ID.";
  if (projectId != null && projectId !== "" && !positiveId.test(String(projectId))) return "'projectId' must be a positive ID.";
  const unknownAction = list(actions).find((code) => !AUDIT_ACTIONS[code]);
  if (unknownAction) return `Invalid 'actions' filter: ${unknownAction}.`;
  const areaCodes = new Set(Object.values(AUDIT_ACTIONS).map((action) => action.area));
  const unknownArea = list(areas).find((code) => !areaCodes.has(code));
  if (unknownArea) return `Invalid 'areas' filter: ${unknownArea}.`;
  return "";
};

// entries matching every filter given (AND); inside `actions` and inside `areas` the values are OR.
// from is inclusive, to exclusive. Newest first, ties by id descending. `page` is 0-based, size capped at 100
export const queryAuditEntries = (entries, query = {}) => {
  const { from, to, actorId, projectId, actions, areas } = query;
  const actionCodes = list(actions);
  const areaCodes = list(areas);

  const matching = entries
    .filter((entry) => {
      const time = new Date(entry.occurredAt).getTime();
      if (from && time < new Date(from).getTime()) return false;
      if (to && time >= new Date(to).getTime()) return false;
      if (actorId && String(entry.actor?.id) !== String(actorId)) return false;
      if (projectId && String(entry.project?.id) !== String(projectId)) return false;
      if (actionCodes.length > 0 && !actionCodes.includes(entry.action)) return false;
      if (areaCodes.length > 0 && !areaCodes.includes(entry.area)) return false;
      return true;
    })
    .sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt) || b.id - a.id);

  const size = Math.min(Math.max(Number(query.size) || 20, 1), 100);
  const page = Math.max(Number(query.page) || 0, 0);
  return {
    content: matching.slice(page * size, page * size + size),
    page,
    size,
    totalElements: matching.length,
    totalPages: Math.ceil(matching.length / size),
  };
};

// each person who is the actor of an entry, once, with the name and email of their most recent entry,
// sorted by name (case-insensitive) then id; the system (no actor) is left out
export const auditActors = (entries) => {
  const latest = new Map();
  for (const entry of [...entries].sort((a, b) => new Date(a.occurredAt) - new Date(b.occurredAt) || a.id - b.id)) {
    if (entry.actor) latest.set(entry.actor.id, { id: entry.actor.id, name: entry.actor.name, email: entry.actor.email });
  }
  return [...latest.values()].sort(
    (a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }) || a.id - b.id,
  );
};
