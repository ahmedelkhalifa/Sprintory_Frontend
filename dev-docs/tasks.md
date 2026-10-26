# Tasks, backlog and sprint planning (assumed contract)

**Status: the backend has none of this yet.** There is no task or sprint code, doc or endpoint in `sprintory_backend`
(requirements R09, R13 and R14 aren't built). The frontend's Backlog tab is built against the shapes below and runs
on an in-browser mock ([src/mocks/tasksMock.js](../src/mocks/tasksMock.js)) when `VITE_MOCK_TASKS=true`.
**Backend: please implement these shapes, or tell us what changed**, then update this file and the
`ASSUMED` notes in [tasksApi.js](../src/api/tasksApi.js) / [sprintsApi.js](../src/api/sprintsApi.js).

Requirements: R09 (tasks with type, priority, assignee, status, estimate, labels, description), R13 (product backlog
for Scrum projects, ordered by priority, ordered by the Product Owner), R14 (sprint planning: create a sprint, set its
goal and capacity, pull items from the backlog). Starting a sprint is included; completing it and carrying work over
is R15 (the board).

## Shapes

```jsonc
// TaskResponse
{
  "id": 42, "projectId": 7,
  "key": "WR-12",                    // project key (story 8) + a per-project number
  "title": "Fix mobile layout",      // required, ≤ 200 chars
  "description": "",
  "type": "STORY",                   // STORY | TASK | BUG
  "priority": "MEDIUM",              // CRITICAL | HIGH | MEDIUM | LOW (default MEDIUM)
  "status": "TODO",                  // TODO | IN_PROGRESS | IN_REVIEW | DONE (the Scrum board's columns)
  "estimate": 3,                     // any number ≥ 0, or null; no unit enforced
  "labels": ["Frontend"],            // free text
  "assignee": { "userId": 5, "firstName": "Ada", "lastName": "Lovelace", "email": "ada@x.io" }, // or null; a project member
  "sprintId": null,                  // null = in the backlog
  "createdAt": "…", "updatedAt": "…"
}

// SprintResponse (inside the backlog response it also has "tasks": TaskResponse[] in order)
{
  "id": 3, "projectId": 7,
  "name": "WR Sprint 2",             // ≤ 100 chars; blank on create → "<key> Sprint <n>"
  "goal": "",
  "capacity": 20,                    // same unit as estimates, or null
  "startDate": "2026-10-25",         // date only; null while planning
  "endDate": "2026-11-08",
  "status": "PLANNED"                // PLANNED | ACTIVE | COMPLETED
}

// BacklogResponse
{ "sprints": [/* PLANNED and ACTIVE sprints, with tasks */], "backlog": [/* tasks in rank order, top = most important */] }
```

The backlog's order **is** the ranking (R13); `priority` is only a label.

## Endpoints

| Method and path | Permission | Notes |
| --- | --- | --- |
| `GET /projects/{id}/backlog` → BacklogResponse | `VIEW_WORK` | Scrum projects only (`400 BAD_REQUEST` for Kanban) |
| `POST /projects/{id}/tasks` `{ title, type?, priority?, description?, estimate?, labels?, assigneeId? }` → TaskResponse | `EDIT_TASKS` | `201`; added to the bottom of the backlog; `status` starts as `TODO` |
| `GET /tasks/{id}` → TaskResponse | `VIEW_WORK` | |
| `PATCH /tasks/{id}` (any subset of the fields above + `status`; `assigneeId: null` unassigns) → TaskResponse | `EDIT_TASKS` | |
| `DELETE /tasks/{id}` | `EDIT_TASKS` | `204` |
| `POST /projects/{id}/backlog/move` `{ taskId, sprintId, beforeTaskId }` | inside the backlog: `MANAGE_BACKLOG`; any sprint involved: `MANAGE_SPRINTS` | `sprintId` null = the backlog; `beforeTaskId` null = the end of that list. `204` |
| `POST /projects/{id}/sprints` `{ name?, goal?, capacity?, startDate?, endDate? }` → SprintResponse | `MANAGE_SPRINTS` | `201`, status `PLANNED` |
| `PATCH /sprints/{id}` (same fields) → SprintResponse | `MANAGE_SPRINTS` | an active sprint keeps both dates |
| `DELETE /sprints/{id}` | `MANAGE_SPRINTS` | `PLANNED` only (`409 CONFLICT` otherwise); its tasks go back to the **top** of the backlog in their order |
| `POST /sprints/{id}/start` `{ startDate, endDate, goal? }` → SprintResponse | `MANAGE_SPRINTS` | `PLANNED` only; `409 SPRINT_ALREADY_ACTIVE` if another sprint of the project is active |

Who holds those permissions is the matrix in [roles.md](roles.md): ordering the backlog is the Product Owner's,
sprint planning the Scrum Master's, editing tasks every role but Viewer. A workspace admin who isn't a project member
has no `VIEW_WORK` and gets `403` on every read here.

## Errors

| Code | Status | When |
| --- | --- | --- |
| `VALIDATION_ERROR` | 400 | `fieldErrors` on `title`, `estimate`, `name`, `capacity`, `startDate`, `endDate` (end before start, missing dates on start) |
| `BAD_REQUEST` | 400 | backlog of a Kanban project; assignee not a project member |
| `ACCESS_DENIED` | 403 | missing the permission in the table |
| `RESOURCE_NOT_FOUND` | 404 | task, sprint or project doesn't exist or isn't visible |
| `CONFLICT` | 409 | deleting/starting a sprint that isn't planned; moving into a completed sprint |
| `SPRINT_ALREADY_ACTIVE` | 409 | **new code**: starting a sprint while another one is active |
| `WORKSPACE_ARCHIVED` / `PROJECT_ARCHIVED` | 409 | any change in an archived workspace / project |

## The mock

- On with `VITE_MOCK_TASKS=true` (in `.env.local`). Needs the real backend for login and projects: it reads the real
  `GET /projects/{id}` for the caller's permissions and `GET /projects/{id}/members` for seed assignees.
- Data is kept in `localStorage` under `sprintory.mock.tasks`, seeded per project on first open (16 tasks, one planned
  sprint). Clear that key to start over.
- It follows the rules above, except that it can't see whether the **workspace** is archived (the UI hides changes anyway).
