# Backend contract summaries (frontend view)

Short summaries of the backend API contracts, for whoever works on the frontend (people and Claude).
**Source of truth:** `sprintory_backend/docs/*.md`. These summaries match those docs as of **26 Oct 2026** (workspaces, teams and roles as of 24 Oct). When a backend doc changes, update the matching file here in the same PR.

| File | Covers | Backend doc |
| --- | --- | --- |
| [workspaces.md](workspaces.md) | workspaces, members, invitations, archive/delete | `workspaces-docs.md` |
| [teams.md](teams.md) | teams and team members | `teams-docs.md` |
| [projects.md](projects.md) | projects (key, description, settings), project members, adding a team | `projects-docs.md` |
| [roles.md](roles.md) | workspace and project roles, permissions, role endpoints | `roles-docs.md` |
| [tasks.md](tasks.md) | tasks and the board (real), sprints (**assumed**: not in the backend yet) | `tasks-docs.md`, `projects-docs.md` §3.8 |

Auth (`/auth/**`, cookies, refresh) is summarized in [CLAUDE.md](../CLAUDE.md); full details are in `sprintory_backend/docs/auth-endpoints.md`.

---

## Shared rules

- **Base path** `/api/v1` (`VITE_API_URL` already includes it). JSON in camelCase. Every endpoint needs the `access_token` cookie unless noted otherwise.
- **Ids in paths are numeric** (`WorkspaceResponse.id`, not the slug). A non-number gets `400 BAD_REQUEST` "Invalid value for '…'".
- **Error shape:** `{ timestamp, status, code, message, path, fieldErrors? }`. Branch on `code`, never on `message`. Messages are safe to show. `VALIDATION_ERROR` has `fieldErrors` like `{ "name": "must not be blank" }` or `{ "emails[1]": "..." }`.
- **404 vs 403:** if you can't see something you get `404`, exactly as if it didn't exist (this is on purpose). If you can see it but aren't allowed to change it, you get `403 ACCESS_DENIED`.
- **Archived workspace:** everything can still be read, but every change returns `409 WORKSPACE_ARCHIVED`. Hide change controls when `WorkspaceResponse.archivedAt` is set.
- **Hiding controls is only for usability.** The backend enforces every rule anyway.
- Any endpoint can return `500 INTERNAL_ERROR` ("Something went wrong. Please try again.").

### Pagination and search

Used by every list that can grow: workspace members, teams, team members, projects, project members. (`GET /workspaces` itself is **not** paginated.)

| Param | Default | Rules |
| --- | --- | --- |
| `page` | `0` | 0-based; negative is treated as 0 |
| `size` | `20` | capped at `100` |
| `q` | none | case-insensitive "contains"; blank = no search. Each list says what it matches |
| `sort` | — | ignored; each list has a fixed order |

```jsonc
// PageResponse<T>
{ "content": [/* T */], "page": 0, "size": 20, "totalElements": 37, "totalPages": 2 }
```

A page past the end returns `200` with empty `content`. `totalElements` counts only what the caller may see. In the frontend, start from `EMPTY_PAGE` in [src/utils/page.js](../src/utils/page.js).

### Error codes across these areas

| Code | Status | Typical cause |
| --- | --- | --- |
| `VALIDATION_ERROR` | 400 | body breaks a field rule; see `fieldErrors` |
| `BAD_REQUEST` | 400 | malformed JSON, non-numeric id, or "Some users are not members of this workspace." / "Team not found in this workspace." |
| `INVALID_PROJECT_ROLES` | 400 | empty role set, Viewer combined with another role, or a role the template doesn't offer |
| `AUTHENTICATION_ERROR` | 401 | no valid access cookie; [client.js](../src/api/client.js) refreshes and retries |
| `ACCESS_DENIED` | 403 | can see it, but missing the role/permission |
| `RESOURCE_NOT_FOUND` | 404 | doesn't exist, or the caller can't see it |
| `CONFLICT` | 409 | team name already taken in the workspace (or a rare workspace slug race; retrying works) |
| `WORKSPACE_ARCHIVED` | 409 | any change in an archived workspace |
| `WORKSPACE_NOT_ARCHIVED` | 409 | deleting a workspace that isn't archived |
| `LAST_WORKSPACE_ADMIN` | 409 | would leave a workspace without an admin |
| `LAST_PROJECT_MANAGER` | 409 | would leave a project without a Project Manager (on leaving a workspace, the message names the projects) |
| `SERVICE_UNAVAILABLE` | 503 | invitation email couldn't be sent; nothing was kept, retry the whole list |

---

## Frontend status and gaps

Where the frontend is behind these contracts. Fix them, then update this table.

| Gap | Contract | Affects |
| --- | --- | --- |
| Sprints have no backend yet; the Backlog and Board tabs run them on an in-browser mock (on unless `VITE_MOCK_SPRINTS=false`). Tasks and the board are real | [tasks.md](tasks.md#sprints-assumed-mocked) | [sprintsApi.js](../src/api/sprintsApi.js), [sprintsMock.js](../src/mocks/sprintsMock.js) |
| Board columns are read-only: no add / rename / reorder / delete or WIP limits until the backend has R16 (`CONFIGURE_BOARD`) | [tasks.md](tasks.md#board-real) | [BoardTab](../src/components/board/BoardTab.jsx) |
| Archive / restore / delete a project, project `status` / `createdAt`, and the Archived tab are built against **assumed** endpoints the backend doesn't have yet (R30) | [projects.md](projects.md#assumed-by-the-frontend-not-in-the-backend-yet) | the `ASSUMED` block in [projectsApi.js](../src/api/projectsApi.js) |
| No accept-invite page (`/accept-invite?token=...`, the backend's default `INVITE_PATH`) | [workspaces.md](workspaces.md#accepting-an-invitation) | new route in [App.jsx](../src/App.jsx), `workspacesApi.js` needs `lookupInvitation` / `acceptInvitation` |
| No UI for changing a member's workspace role, removing a member, or leaving | [roles.md](roles.md#endpoints) | `workspacesApi.js`, a future People tab |
| No project role picker (`PUT /projects/{id}/members/{userId}/roles` exists in the backend now) | [roles.md](roles.md#endpoints) | Members tab, [MembersTable](../src/components/projects/MembersTable.jsx) |
| New error codes not handled specially: `LAST_WORKSPACE_ADMIN`, `LAST_PROJECT_MANAGER`, `INVALID_PROJECT_ROLES` (their backend messages are shown as-is via `errorMessage`, which is fine for now) | above | [utils/apiError.js](../src/utils/apiError.js) |
