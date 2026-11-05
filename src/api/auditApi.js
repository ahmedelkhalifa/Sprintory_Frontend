import api from "./client";

// The audit log API (audit-log-docs.md, summary in dev-docs/audit-log.md). Read-only: there is no endpoint to
// create, edit or delete an entry, so none exists here. Both calls are for workspace admins only
// (403 ACCESS_DENIED for members, 404 for people outside the workspace).

// params (all optional): { from, to, actorId, projectId, actions, areas, page, size }
// from / to are ISO instants (`to` exclusive, see dayRangeToInstants), actions / areas comma-separated.
// Newest first; returns a PageResponse of { id, occurredAt, action, area, actor, target, project, changes }
export const listAuditLog = (workspaceId, params, signal) =>
  api.get(`/workspaces/${workspaceId}/audit-log`, { params, signal }).then((res) => res.data);

// everyone who is the actor of at least one entry, including people who left; for the actor filter.
// A plain array of { id, name, email }, not paginated
export const listAuditActors = (workspaceId, signal) =>
  api.get(`/workspaces/${workspaceId}/audit-log/actors`, { signal }).then((res) => res.data);
