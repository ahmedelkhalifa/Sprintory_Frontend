# Task dependencies (PMP-45 / PMP-163)

Summary of the backend's `docs/dependencies-docs.md` (PMP-162, branch `features/task-dependencies-pmp-45`, 24 Nov 2026), for the
frontend. API calls in [dependenciesApi.js](../src/api/dependenciesApi.js), pure helpers in
[utils/dependency.js](../src/utils/dependency.js).

## Rules

- One directed link: **A blocks B** (B is blocked by A). The same link shows on both tasks.
- Only live **top-level** tasks (Story, Task, Bug) of the **same project**. No subtasks, no deleted tasks, no
  self-links, no duplicates, no cycles (direct or through other tasks). Scrum and Kanban; sprints don't matter.
- **Blocked is computed**, never stored: a task is blocked while at least one live blocker is in a column whose
  **category** is not `DONE`. Renaming a column changes nothing. A soft-deleted blocker doesn't count; restoring it
  brings the link back.
- **Soft blocking:** moving a blocked task forward is allowed after a warning (§ Moving below).
- **Permissions:** reading needs project membership (a non-member, a workspace admin outside the project too, gets
  `404`). Adding and removing need `DEPENDENCY_MANAGE` (every project role except Viewer). Archived workspace or a
  completed / archived project: read-only (`409`).

## Endpoints

| Method and path | Function | Notes |
| --- | --- | --- |
| `GET /tasks/{id}/dependencies` | `getDependencies` | `{ blocked, blockedBy: [{ id, task }], blocks: [{ id, task }], openBlockers: [task], canManage }` |
| `POST /tasks/{id}/dependencies` `{ blockerId, blockedId }` | `addDependency` | `201` `{ id, blocker, blocked }`; the path task must be one of the two |
| `DELETE /dependencies/{id}` | `removeDependency` | `204`; the **link's** id from the lists, not a task id |

A task summary is `{ id, key, title, statusName, statusCategory }` (`TODO | IN_PROGRESS | DONE`). `blockedBy` and
`blocks` include DONE tasks; only `openBlockers` leaves them out. `canManage` already combines the permission, a
top-level task and a writable project / workspace: the controls follow it. A subtask answers empty lists and
`canManage: false`.

"Add blocker" on task 11 sends `{ blockerId: picked, blockedId: 11 }`; "Add blocked task" on task 10 sends
`{ blockerId: 10, blockedId: picked }` (`dependencyRequest`).

**Every task response** (list, detail, board, backlog) also has `blocked` and `openBlockers` (empty: `false`, `[]`).
`GET /projects/{id}/tasks?blockedOnly=true` keeps only blocked tasks, before pagination, combined with the other
filters.

## Errors

| Code | Status | When |
| --- | --- | --- |
| `BAD_REQUEST` | 400 | self-link, a subtask, a deleted task, a task of another project, the path task not in the body |
| `ACCESS_DENIED` | 403 | a Viewer adding or removing |
| `RESOURCE_NOT_FOUND` | 404 | missing or private task / link; a link already removed |
| `DEPENDENCY_ALREADY_EXISTS` | 409 | the same link again |
| `DEPENDENCY_CYCLE` | 409 | would close a cycle; `cyclePath: ["PMP-12", "PMP-10", "PMP-11", "PMP-12"]` and the path in `message` |
| `BLOCKED_TASK_CONFIRMATION_REQUIRED` | 409 | a blocked task moved forward without `confirmBlocked`; `openBlockers` in the body |
| `WORKSPACE_ARCHIVED` / `CONFLICT` | 409 | archived workspace / completed or archived project |

## Moving

A forward move (`TODO → IN_PROGRESS`, `TODO → DONE`, `IN_PROGRESS → DONE`) of a task with open blockers, through
`PUT /projects/{id}/tasks/{taskId}/position` (board drag) or `PATCH /projects/{id}/tasks/{taskId}` with a new
`statusId` (task page, drawer), answers `409 BLOCKED_TASK_CONFIRMATION_REQUIRED` with `openBlockers`. After "Move
anyway" the **same request** goes again with `confirmBlocked: true`. If it then answers
`OPEN_SUBTASKS_CONFIRMATION_REQUIRED`, keep `confirmBlocked` and add `confirmOpenSubtasks: true` after that
confirmation (`moveConfirmation` / `confirmedMove`). Reorders, moves within a category and backward moves never ask.

## History and notifications

- History types `DEPENDENCY_ADDED` (value in `newValue`) and `DEPENDENCY_REMOVED` (in `oldValue`), `field: null`,
  `refId` = the other task. The value is a snapshot from this task's side: `"Blocked by PMP-10"` or
  `"Blocks PMP-11"`. `dependencyHistoryLine` words it ("added blocker PMP-10") and the feed links the key.
- Notification `TASK_UNBLOCKED`, "PMP-15 is no longer blocked.", to the task's assignee (even when they caused it),
  category `STATUS_CHANGE`, opens the task like any task notification.

## How the frontend does it

- **Task page:** a Dependencies section under the subtasks ([TaskDependencies](../src/components/tasks/dependencies/TaskDependencies.jsx)):
  "Blocked by" and "Blocks", each row with the key (a link to the task), title and status chip, a Blocked chip in the
  header, and Add blocker / Add blocked task / Remove while `canManage`. Not shown on subtasks.
- **Adding** ([AddDependencyDialog](../src/components/tasks/dependencies/AddDependencyDialog.jsx)): a search over the
  project's top-level tasks (`GET …/tasks?q=`), without the task itself and existing links of that direction. A
  refusal stays in the window; a cycle shows its whole path.
- **Board cards and backlog rows:** a Blocked icon ([BlockedMark](../src/components/tasks/dependencies/BlockedMark.jsx))
  with the open blockers in its tooltip, from the task responses (no extra requests).
- **Filter bar:** "Blocked only" (`blockedOnly` in the filters, sent as `blockedOnly=true`).
- **Moves:** the board, the task page and the drawer ask with
  [MoveConfirmDialog](../src/components/tasks/MoveConfirmDialog.jsx) (blocked task or open subtasks) and resend with
  the flag.
