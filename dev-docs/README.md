# Backend contract summaries (frontend view)

Short summaries of the backend API contracts, for whoever works on the frontend (people and Claude).
**Source of truth:** `sprintory_backend/docs/*.md`. These summaries match those docs as of **26 Oct 2026** (workspaces, teams and roles as of 24 Oct; tasks, comments, mentions, history, board, chat and notifications as of 6 Nov; attachments as of 7 Nov; sprints as of 9 Nov). When a backend doc changes, update the matching file here in the same PR.

| File | Covers | Backend doc |
| --- | --- | --- |
| [workspaces.md](workspaces.md) | workspaces, members, invitations, archive/delete | `workspaces-docs.md` |
| [teams.md](teams.md) | teams and team members | `teams-docs.md` |
| [projects.md](projects.md) | projects (key, description, settings), project members, adding a team | `projects-docs.md` |
| [roles.md](roles.md) | workspace and project roles, permissions, role endpoints | `roles-docs.md` |
| [tasks.md](tasks.md) | tasks, subtasks, descriptions with @mentions, comments, history and the board | `tasks-docs.md`, `board-docs.md`, `mentions-docs.md`, `comments-docs.md`, `task-history-docs.md` |
| [sprints.md](sprints.md) | sprints: planning, capacity suggestion and availability, start, close, scope changes; the Backlog, Board and Sprints tabs | `sprints-docs.md` |
| [attachments.md](attachments.md) | files on tasks and subtasks: upload, preview, download, delete (**backend not built yet**) | `attachments-docs.md` |
| [chat.md](chat.md) | the project chat (WebSocket / STOMP) and the workspace Chats page | `project-chat-docs.md` |
| [audit-log.md](audit-log.md) | the workspace audit log (admins only, read-only) | `audit-log-docs.md` |
| [search.md](search.md) | universal search (top bar and `/search` page) | `search-docs.md` |
| [notifications.md](notifications.md) | the bell, its live stream, preferences, watching a task | `notifications-docs.md` |

Auth (`/auth/**`, cookies, refresh) is summarized in [CLAUDE.md](../CLAUDE.md); full details are in `sprintory_backend/docs/auth-endpoints.md`.

---

## Shared rules

- **Base path** `/api/v1` (`VITE_API_URL` already includes it). JSON in camelCase. Every endpoint needs the `access_token` cookie unless noted otherwise.
- **Ids in paths are numeric** (`WorkspaceResponse.id`, not the slug). A non-number gets `400 BAD_REQUEST` "Invalid value for '…'".
- **Error shape:** `{ timestamp, status, code, message, path, fieldErrors? }`. Branch on `code`, never on `message`. Messages are safe to show. `VALIDATION_ERROR` has `fieldErrors` like `{ "name": "must not be blank" }` or `{ "emails[1]": "..." }`.
- **404 vs 403:** if you can't see something you get `404`, exactly as if it didn't exist (this is on purpose). If you can see it but aren't allowed to change it, you get `403 ACCESS_DENIED`. In the frontend, `WorkspaceAccessGuard` / `ProjectAccessGuard` ([ResourceAccessGuard.jsx](../src/components/general/ResourceAccessGuard.jsx)) turn a `404` on the workspace or project into one "not found" screen, so the pages under them never see it.
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
| Attachments are built from the contract, but the backend (PMP-141) isn't: until it is, the section on every task page shows a load error. Which history value holds the file name is assumed | [attachments.md](attachments.md) | [TaskAttachments](../src/components/tasks/attachments/TaskAttachments.jsx), `historyLine` in [utils/task.js](../src/utils/task.js) |
| The backend can't list ended sprints (`GET /projects/{id}/sprints` is planned and active only), so the Sprints tab's "Previous sprints" is empty. Backend: please add a list of completed and cancelled sprints | [sprints.md](sprints.md) | [SprintsTab](../src/components/sprints/SprintsTab.jsx) |
| Sprint close preview, Cancel sprint and the "Carried over ×N" marker aren't built (PMP-41); Complete sprint counts done / unfinished itself | [sprints.md](sprints.md#closing) | [CompleteSprintDialog](../src/components/board/CompleteSprintDialog.jsx), [sprintsApi.js](../src/api/sprintsApi.js) |
| A description's mentions show the label stored in the text, which can be out of date after a rename: the task response has no `mentions` list (comments and chat messages have one). Backend: please add it | [tasks.md](tasks.md#descriptions-and-mentions-real-backend-pmp-136-docsmentions-docsmd) | [TaskDescription](../src/components/tasks/TaskDescription.jsx) |
| Deleted tasks can only be restored right after the delete (the Undo snackbar): the backend has no list of deleted tasks | [tasks.md](tasks.md#tasks-real--the-parts-the-frontend-uses) | [UndoDeleteProvider](../src/context/UndoDeleteProvider.jsx) |
| Archive / restore / delete a project, project `status` / `createdAt`, and the Archived tab are built against **assumed** endpoints the backend doesn't have yet (R30) | [projects.md](projects.md#assumed-by-the-frontend-not-in-the-backend-yet) | the `ASSUMED` block in [projectsApi.js](../src/api/projectsApi.js) |
| The "Recent activity" cards on the workspace and project overviews still show sample data; they could read the first entries of the audit log (admins only) | [audit-log.md](audit-log.md) | [RecentActivity](../src/components/workspace/RecentActivity.jsx), [RecentActivityCard](../src/components/projects/overview/RecentActivityCard.jsx) |
| Notifications: no full notifications page (the bell has "Load more" only) and no workspace filter; a subtask's page has no Watch toggle. | [notifications.md](notifications.md) | [NotificationBell](../src/components/layouts/NotificationBell.jsx) |
| No UI for removing a workspace member or leaving a workspace (changing the workspace role is done: the Members page) | [roles.md](roles.md#endpoints) | `workspacesApi.js`, [WorkspaceMembersPage](../src/pages/workspace/WorkspaceMembersPage.jsx) |
