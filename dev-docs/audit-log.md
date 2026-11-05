# Audit log

Source: `sprintory_backend/docs/audit-log-docs.md` (contract agreed 2 Nov 2026; implemented in the backend, PMP-128, merged into its main on 3 Nov 2026, PR #19). Shared rules are in [README.md](README.md).

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
- The project dropdown lists the first 100 projects the workspace has now (the backend caps `size` at 100). A project that was deleted since can only be filtered by putting its id in the url (`?project=<id>`).
- `areas` is never sent: the backend ANDs it with `actions`, so "all of Projects plus one Teams action" would match nothing. Picking every action of an area sends them as `actions`.
- The applied filters live in the page url (`?from=2026-11-01&to=2026-11-02&actor=17&project=15&actions=A,B`) so a filtered view can be reloaded or shared; the url is user input and invalid values are ignored (`filtersFromSearchParams`).

## Showing `changes`

`field: old → new`. Old `null` = added (show the new value), new `null` = removed (show the old value struck through). Only `role`, `roles` and `template` values get labels, the same ones as the rest of the app (`ROLE_LABEL` in utils/workspace.js, `projectRoleLabel` in utils/project.js, `TEMPLATES` in constants/projects.js); every other value is shown as stored. A set of project roles is one string, `", "`-separated. `MEMBER` is "Member" here (the entry doesn't say whether the project is Scrum). Long values (project descriptions) are cut, the full text is in a tooltip.

## Errors

`400 BAD_REQUEST` (invalid filter), `401` (refresh and retry), `403 ACCESS_DENIED` (not an admin: the page shows "Only workspace admins can view the audit log", not a toast), `404 RESOURCE_NOT_FOUND` (the page shows the workspace guard's "Workspace not found" screen), `405` for any method but GET. The page decides by `errorCode` from `usePagedList`, never by the message.

## Frontend

- Page: [AuditLogPage](../src/pages/workspace/AuditLogPage.jsx) at `/workspaces/:workspaceSlug/audit-log`, opened from the sidebar's **Audit log** entry, which shows only for workspace admins of the current workspace.
- On phones (below `sm`) the table becomes a list with one sentence per entry, the contract's suggested sentences (`auditSentence`); only settings changes and unknown actions also list their changes (`sentenceCoversChanges`).
- Pieces: [components/audit/](../src/components/audit/) (`AuditFilters`, `AuditLogTable`, `AuditLogCards`, `AuditChanges`), helpers in [utils/audit.js](../src/utils/audit.js), tests in [tests/audit.test.js](../tests/audit.test.js).
- Not done yet: the "Recent activity" cards on the workspace and project overviews still show sample data; they can read the first entries of this log (admins only) later.
