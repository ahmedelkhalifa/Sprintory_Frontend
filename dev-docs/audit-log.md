# Audit log

Source: `sprintory_backend/docs/audit-log-docs.md` (contract agreed 2 Nov 2026; **the backend is not built yet**, PMP-128). Shared rules are in [README.md](README.md).

## Basics

- One log per workspace, **read-only and for workspace admins only**. There is no endpoint to create, edit or delete an entry, so the frontend has none and no edit / delete control exists on the page.
- Only successful actions are logged; names (actor, target, project) are **snapshots**: show the stored names, never look them up again (a person who left, or a renamed project, keeps the old name). Never hide an entry because its actor or target is gone, and don't link to a target.
- Times are UTC instants (`...Z`): the table shows local time, the tooltip the UTC time.
- Passwords, tokens and links are never stored. The frontend drops any change whose field looks like one anyway (`SENSITIVE_FIELD`).
- Admin or not is `WorkspaceResponse.role`. Members get `403 ACCESS_DENIED`, people outside the workspace `404`. Archived workspaces stay readable.

## Endpoints

| Action | Method and path | Query | Success |
| --- | --- | --- | --- |
| Read the log | `GET /workspaces/{workspaceId}/audit-log` | `from`, `to`, `actorId`, `projectId`, `actions`, `areas`, `page`, `size` | `200` PageResponse of entries, newest first |
| Read the actor list (for the filter) | `GET /workspaces/{workspaceId}/audit-log/actors` | none | `200` array of `{ id, name, email }`, includes people who left |

In the frontend: `listAuditLog`, `listAuditActors` in [auditApi.js](../src/api/auditApi.js).

```jsonc
// entry
{ "id": 412, "occurredAt": "2026-11-02T14:05:31.218Z", "action": "PROJECT_ROLES_CHANGED", "area": "PROJECT",
  "actor": { "id": 17, "name": "Ada Lovelace", "email": "ada@example.com" },   // null = the system (repeated failed logins)
  "target": { "type": "USER", "id": 23, "name": "Linus Torvalds" },            // id is null only for INVITATION
  "project": { "id": 15, "name": "Mobile App" },                                // null outside project and task actions
  "changes": [{ "field": "roles", "oldValue": "MEMBER", "newValue": "PROJECT_MANAGER, MEMBER" }] }  // strings or null
```

## Filters

All optional, combined with AND; `actions` / `areas` are comma-separated and OR inside.

- `from` is inclusive, `to` **exclusive**, both ISO instants from `toISOString()`. The user picks **local calendar days**: `from` is the local start of the first day, `to` the local start of the day **after** the last one (`dayRangeToInstants` in [utils/audit.js](../src/utils/audit.js)). `from >= to` is a `400`, so the page disables Apply instead of sending it.
- `actorId` comes from the actors endpoint, `projectId` from `GET /workspaces/{id}/projects`, `actions` from the catalogue in [constants/audit.js](../src/constants/audit.js) (no endpoint lists them).
- An unknown `actorId` / `projectId` is not an error, it matches nothing. Any filter change goes back to page 0.
- The applied filters live in the page url (`?from=2026-11-01&to=2026-11-02&actor=17&project=15&actions=A,B`) so a filtered view can be reloaded or shared; the url is user input and invalid values are ignored (`filtersFromSearchParams`).

## Showing `changes`

`field: old → new`. Old `null` = added (show the new value), new `null` = removed (show the old value struck through). Role enum values are shown by name (`AUDIT_VALUE_LABELS`); a set of project roles is one string, `", "`-separated. `MEMBER` is "Member" here (the entry doesn't say whether the project is Scrum). Long values (project descriptions) are cut, the full text is in a tooltip.

## Errors

`400 BAD_REQUEST` (invalid filter), `401` (refresh and retry), `403 ACCESS_DENIED` (not an admin: the page shows "Only workspace admins can view the audit log", not a toast), `404` (the workspace guard shows its not-found screen), `405` for any method but GET.

## Frontend

- Page: [AuditLogPage](../src/pages/workspace/AuditLogPage.jsx) at `/workspaces/:workspaceSlug/audit-log`. The sidebar's **Audit Log** entry (it replaced Backlog) shows only for workspace admins; `/backlog` redirects to the current workspace's audit log ([AuditLogRedirect](../src/pages/workspace/AuditLogRedirect.jsx)).
- Pieces: [components/audit/](../src/components/audit/) (`AuditFilters`, `AuditLogTable`, `AuditChanges`), helpers in [utils/audit.js](../src/utils/audit.js), tests in [tests/audit.test.js](../tests/audit.test.js).
- **Mock.** Until the endpoints exist, [auditMock.js](../src/mocks/auditMock.js) answers instead (on unless `VITE_MOCK_AUDIT=false`): made-up entries built from the workspace's real members and projects, the contract's filters, paging, 400 messages and the caller's real role (members get 403). Its filtering is in [auditFilter.js](../src/mocks/auditFilter.js) and is unit-tested. **When the backend ships:** set `VITE_MOCK_AUDIT=false`, check the page against the real API, then delete the mock files and the `MOCK` branches in `auditApi.js`.
- Not done yet: the "Recent activity" cards on the workspace and project overviews still show sample data; they can read the first entries of this log (admins only) later.
