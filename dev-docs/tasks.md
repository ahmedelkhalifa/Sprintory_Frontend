# Tasks, the board, the backlog and sprints

**Tasks and the board are real** (backend story 9 and story 8, `features/project-template-defaults`, 26 Oct 2026):
full contract in `sprintory_backend/docs/tasks-docs.md` and `projects-docs.md` §3.8. **Sprints are not in the backend
yet** (R14, R15): the frontend runs them on an in-browser mock against the **assumed** contract below.
**Backend: please implement the sprint shapes, or tell us what changed**, then update this file and the `ASSUMED`
notes in [sprintsApi.js](../src/api/sprintsApi.js).

## Tasks (real) — the parts the frontend uses

All under `/projects/{projectId}/tasks`, in [tasksApi.js](../src/api/tasksApi.js). Reading needs `VIEW_WORK`,
changing `EDIT_TASKS`; a workspace admin who isn't a member gets `403` on everything.

```jsonc
// TaskResponse
{ "id": 55, "projectId": 8, "key": "MOB-42", "title": "Login fails on Safari",
  "type": "BUG",                 // STORY | TASK | BUG (default TASK)
  "priority": "HIGH",            // HIGHEST | HIGH | MEDIUM | LOW | LOWEST (default MEDIUM)
  "statusId": 12, "statusName": "To Do",   // a board column; new tasks start in the first one
  "assigneeId": 7,               // a project member, or null; the name comes from GET /projects/{id}/members
  "estimate": 3,                 // whole story points >= 0, or null
  "labels": ["R09", "backend"],  // sorted; at most 20, each at most 50 characters
  "description": "…", "sprintId": null, "createdAt": "…", "updatedAt": "…" }
```

| Call | Endpoint | Notes |
| --- | --- | --- |
| list | `GET ?order=backlog\|board&page=&size=` | `size` at most 100; `listAllTasks` reads every page |
| create | `POST { title, type?, priority?, assigneeId?, estimate?, labels?, description? }` | title required, ≤ 255; last in its column and in the backlog |
| get / delete | `GET /{taskId}`, `DELETE /{taskId}` | delete is soft (key never reused) |
| edit | `PATCH /{taskId}` | only what changes; null = unchanged, so emptying uses `clearAssignee` / `clearEstimate` / `clearDescription` (`taskChanges` in [utils/task.js](../src/utils/task.js) builds it). Changing `statusId` puts the task last in that column |
| board move | `PUT /{taskId}/position { statusId, afterTaskId }` | `afterTaskId` = the card above it in that column, null = first. `EDIT_TASKS`, within and across columns |
| backlog rank | `PUT /{taskId}/backlog-rank { afterTaskId }` | `MANAGE_BACKLOG` (Product Owner only), Scrum only |

Board order and backlog order are stored separately: moving a card on the board never changes the backlog.

## Board (real)

`GET /projects/{id}/board` (`getBoard` in [projectsApi.js](../src/api/projectsApi.js)) →
`{ template, backlogEnabled, sprintsEnabled, wipLimitsEnabled, activeSprintId, columns: [{ id, name, position, wipLimit }] }`.
Scrum starts with To Do / In Progress / In Review / Done, Kanban with Backlog / To Do / In Progress / Done.
**Columns can't be edited yet** (R16, `CONFIGURE_BOARD`), so the Board tab shows them read-only. `activeSprintId`
stays null until the backend has sprints; the frontend reads the active sprint from the sprint mock instead.

**Done = the board's last column (ASSUMED).** Columns carry no "done" marker, so the sprint progress bar and
Complete sprint count tasks in the rightmost column as finished. Backend: keep that rule, or add a flag to columns.

## Sprints (assumed, mocked)

```jsonc
// SprintResponse
{ "id": 3, "projectId": 7,
  "name": "MOB Sprint 2",      // ≤ 100 chars; blank on create → "<KEY> Sprint <n>"
  "goal": "", "capacity": 20,  // capacity in story points, or null
  "startDate": "2026-10-25", "endDate": "2026-11-08",   // date only; null while planning
  "status": "PLANNED",         // PLANNED | ACTIVE | COMPLETED
  "taskIds": [55, 41, 60],     // the sprint's tasks, in sprint order
  "completedAt": null }
```

A Scrum task is in the backlog when no planned or active sprint holds it. Its backlog rank never changes while it
is in a sprint, so a task taken out of a sprint goes back to its old place in the backlog.

| Method and path | Permission | Notes |
| --- | --- | --- |
| `GET /projects/{id}/sprints` → SprintResponse[] | `VIEW_WORK` | planned and active only. Scrum only (`400 BAD_REQUEST`) |
| `POST /projects/{id}/sprints` `{ name?, goal?, capacity?, startDate?, endDate? }` | `MANAGE_SPRINTS` | `201`, `PLANNED` |
| `PATCH /sprints/{id}` (same fields) | `MANAGE_SPRINTS` | an active sprint keeps both dates; a completed one can't change (`409 CONFLICT`) |
| `DELETE /sprints/{id}` | `MANAGE_SPRINTS` | `PLANNED` only (`409 CONFLICT`); its tasks return to the backlog |
| `POST /sprints/{id}/start` `{ startDate, endDate, goal? }` | `MANAGE_SPRINTS` | `PLANNED` only; `409 SPRINT_ALREADY_ACTIVE` if another sprint is active |
| `POST /sprints/{id}/complete` `{ carryOverSprintId, createSprint }` → `{ sprint, carriedOver, toSprint }` | `MANAGE_SPRINTS` | `ACTIVE` only (`409 CONFLICT`). Done tasks stay with it; unfinished ones go to the top of the planned sprint `carryOverSprintId`, to a new planned sprint (`createSprint: true`), or to the backlog (neither) |
| `POST /projects/{id}/sprints/move` `{ taskId, sprintId, afterTaskId }` | `MANAGE_SPRINTS` | into a sprint after `afterTaskId` (null = first), or back to the backlog (`sprintId` null). `204`; `409 CONFLICT` for a completed sprint |

Errors are the usual ones (`VALIDATION_ERROR` with `fieldErrors` on `name`, `capacity`, `startDate`, `endDate`;
`ACCESS_DENIED`; `RESOURCE_NOT_FOUND`; `WORKSPACE_ARCHIVED`) plus the new `SPRINT_ALREADY_ACTIVE`.

## Who does what (roles matrix, [roles.md](roles.md))

| Action | Permission | Roles |
| --- | --- | --- |
| see tasks, board, sprints | `VIEW_WORK` | every project role, not a non-member workspace admin |
| create, edit, delete tasks; move cards on the board | `EDIT_TASKS` | PM, PO, SM, Developer |
| order the backlog | `MANAGE_BACKLOG` | Product Owner |
| plan, start, complete sprints; move tasks into or out of them | `MANAGE_SPRINTS` | Scrum Master |
| edit columns and WIP limits (not built) | `CONFIGURE_BOARD` | Project Manager |

## The sprint mock

- [src/mocks/sprintsMock.js](../src/mocks/sprintsMock.js), **on unless `VITE_MOCK_SPRINTS=false`**. It needs the real
  backend: it reads `GET /projects/{id}` for the caller's permissions, and the real board and tasks to tell done from
  unfinished on Complete sprint.
- Data is kept in `localStorage` under `sprintory.mock.sprints` (no seed data). Clear that key to start over; the old
  `sprintory.mock.tasks` key from the all-mock version isn't used any more.
- It follows the rules above, except that it can't see whether the **workspace** is archived (the UI hides changes anyway).
