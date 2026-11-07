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
  "description": "{\"type\":\"doc\",…}",  // TipTap JSON as a string (see "Descriptions and @mentions"), or null
  "sprintId": null, "createdAt": "…", "updatedAt": "…" }
```

| Call | Endpoint | Notes |
| --- | --- | --- |
| list | `GET ?order=backlog\|board&page=&size=` | `size` at most 100; `listAllTasks` reads every page |
| create | `POST { title, type?, priority?, assigneeId?, estimate?, labels?, description? }` | title required, ≤ 255; last in its column and in the backlog |
| get / delete | `GET /{taskId}`, `DELETE /{taskId}` | delete is soft (key never reused) |
| restore | `POST /{taskId}/restore` → TaskResponse | `EDIT_TASKS`; same key, into the first column if its own was deleted; a parent gets back the subtasks its delete took; a subtask whose parent is still deleted → `404`. No list of deleted tasks, so the UI only offers it as Undo right after a delete |
| edit | `PATCH /{taskId}` | only what changes; null = unchanged, so emptying uses `clearAssignee` / `clearEstimate` / `clearDescription` (`taskChanges` in [utils/task.js](../src/utils/task.js) builds it). Changing `statusId` puts the task last in that column |
| board move | `PUT /{taskId}/position { statusId, afterTaskId, confirmOpenSubtasks? }` | `afterTaskId` = the card above it in that column, null = first. `EDIT_TASKS`, within and across columns |
| backlog rank | `PUT /{taskId}/backlog-rank { afterTaskId }` | `MANAGE_BACKLOG` (Product Owner only), Scrum only |

Board order and backlog order are stored separately: moving a card on the board never changes the backlog.

### Subtasks, restore and history on the task page (PMP-134; backend PMP-131/132/133, tasks-docs §10)

Subtasks and restore are in the backend's `main` (`features/task-restore-subtasks`). One level under a top-level
task, same project: own key, title, assignee, status and a time estimate **in minutes**, no story points.

| Call | Endpoint | Notes |
| --- | --- | --- |
| list | `GET /{parentId}/subtasks` | oldest first; the main task list never includes subtasks (no cards, no WIP counts) |
| create | `POST /{parentId}/subtasks { title, assigneeId?, statusId?, estimateMinutes? }` | `201`; no status = the first column |
| edit | `PATCH /{parentId}/subtasks/{subtaskId}` | `title`, `statusId`, `assigneeId`, `estimateMinutes`, `description`, `clearAssignee`, `clearEstimateMinutes`, `clearDescription` (`subtaskChanges`); never the task PATCH, whose `estimate` is story points |
| delete | `DELETE /{subtaskId}` | soft; deleting a parent takes its subtasks with it; `POST /{subtaskId}/restore` undoes it |

- TaskResponse adds `parentTaskId`, `estimateMinutes`, `subtaskTotal`, `subtaskDone` (done = a Done-category column).
- A parent moved into a Done column with open subtasks gets `409 OPEN_SUBTASKS_CONFIRMATION_REQUIRED`; the same request
  with `confirmOpenSubtasks: true` goes through (`PATCH /{taskId}` and `PUT /{taskId}/position`). The task page, the
  drawer and board drags all ask first ([OpenSubtasksDialog](../src/components/tasks/OpenSubtasksDialog.jsx)); on the
  board the card stays where it was dropped while the window is open, Cancel puts it back.
- UI ([TaskPage](../src/pages/tasks/TaskPage.jsx), [components/tasks/subtasks/](../src/components/tasks/subtasks/)):
  a parent's page has a Subtasks section ("3 / 5 done", status and assignee changed on the row, Add subtask) and an
  Activity area (Comments and History tabs, [TaskActivity](../src/components/tasks/TaskActivity.jsx)). A subtask's
  title opens its own page (`SubtaskView`: title, description, status, assignee, time, its own comments and history;
  "Subtask of …" back to the parent). Both pages save one field at a time with `useFieldSave`. Board cards show
  "3/5" for parents.
- Delete and Undo: [TaskDeleteAction](../src/components/tasks/TaskDeleteAction.jsx) (page, subtask page and rows,
  drawer) confirms (a parent's window says its subtasks go too), deletes, then
  [UndoDeleteProvider](../src/context/UndoDeleteProvider.jsx) shows "MOB-42 was deleted · Undo" for 8 s, above the
  pages so it survives leaving the task page. Undo calls restore, which fires `TASKS_CHANGED` on `window`;
  `useTasksChanged` makes the project page's Board / Backlog and a parent's subtask list reload.

### History (real, backend PMP-133, `docs/task-history-docs.md`)

`GET /{taskId}/history?order=&page=&size=` (`getTaskHistory`): a **PageResponse**, `size` default 20, at most 100.
`order` is `newest` (the default since 7 Nov: `occurredAt`, then `id`, descending) or `oldest`; anything else is
`400`, `sort` is ignored. We send `newest`. (Until 4 Nov it was a plain array of status moves; until 7 Nov oldest
first.)

```jsonc
{ "id": 501, "type": "FIELD_CHANGED", "field": "PRIORITY", "oldValue": "LOW", "newValue": "HIGH", "refId": null,
  "actor": { "id": 31, "name": "Damir Gabaidullin" }, "occurredAt": "2026-11-05T09:12:44Z" }
```

- `type`: `CREATED`, `FIELD_CHANGED`, `COMMENT_DELETED`, `SUBTASK_ADDED` / `SUBTASK_REMOVED` (on the parent, value =
  "KEY title"), `RESTORED`. `field`: `TITLE`, `TYPE`, `PRIORITY`, `STATUS` (column names), `ASSIGNEE` (names),
  `ESTIMATE`, `ESTIMATE_MINUTES`, `LABELS`, `DESCRIPTION` (no values). Values and `actor.name` are snapshots from
  the time; enums come as stored. A subtask has its own feed.
- `historyLine` in [utils/task.js](../src/utils/task.js) turns an entry into words (null = "None", unknown types
  → "updated the task"); [TaskHistory](../src/components/tasks/TaskHistory.jsx) shows the latest 20 first with
  "Load older" at the bottom, and reloads page 0 after each save so new entries appear on top (`mergeHistory` keeps
  each entry once, newest first; what the old page 0 showed stays).

### Descriptions and @mentions (real, backend PMP-136, `docs/mentions-docs.md`)

- A description (task and subtask, create and edit) is a **TipTap document sent as a JSON string**
  (`JSON.stringify(doc)`). The backend checks it and returns its normalized copy; plain text is refused with
  `400 INVALID_RICH_TEXT`, a mention of someone outside the project with `400 INVALID_MENTION` (both shown under the
  description, the draft stays; `isRichTextError`). An empty document is stored as no description.
- Allowed: paragraphs, headings 1–3, bulleted / numbered lists, quotes, code blocks, rules, hard breaks; bold,
  italic, underline, strike, code, links (http, https, mailto only); `mention` nodes `{ kind: "user" | "team", id,
  label }`.
- `GET /projects/{projectId}/mentionables?q=` (`getMentionables` in [mentionsApi.js](../src/api/mentionsApi.js)):
  `{ users: [{ id, name, email }], teams: [{ id, name, membersInProject }] }`, at most 10 people (not the caller) and 5
  teams. A workspace admin outside the project gets `403`.
- Descriptions saved before 4 Nov 2026 may still be plain text: they are shown as paragraphs, and saving through the
  editor converts them.
- The task response has no `mentions` list (comments and chat messages do), so a description shows each mention's
  stored label, which can be out of date after a rename.
- One editor for descriptions, comments and the chat, in [components/editor/](../src/components/editor/):
  `RichTextEditor` (toolbar, link window, @ suggestions after a 200 ms pause, Ctrl/⌘+Enter), `RichText` (read-only,
  drawn node by node, never as HTML), helpers in [utils/richText.js](../src/utils/richText.js) (`toDoc`,
  `richTextValue`, `isEmptyDoc`, `safeHref`, `mentionName`).

### Comments (real, backend PMP-133/136, `docs/comments-docs.md`)

`/projects/{projectId}/tasks/{taskId}/comments` ([commentsApi.js](../src/api/commentsApi.js)); a subtask uses its own id.

| Call | Endpoint | Notes |
| --- | --- | --- |
| list | `GET ?page=&size=` | PageResponse, **oldest first**; deleted ones stay as placeholders (`deleted`, `body: null`) |
| post | `POST { body }` | `COMMENT` (not Viewers); `body` = TipTap JSON string, not empty, at most 10,000 characters; the author starts watching |
| edit | `PATCH /{commentId} { body }` | the author only; sets `editedAt` ("(edited)") |
| delete | `DELETE /{commentId}` | the author, or `MODERATE_COMMENTS` (Project Manager); soft; writes `COMMENT_DELETED` to the history |

```jsonc
{ "id": 77, "taskId": 230, "author": { "id": 7, "name": "Ada Lovelace" },  // author null if the account is gone
  "body": "{\"type\":\"doc\",…}", "mentions": [{ "kind": "user", "id": 31, "name": "Damir Gabaidullin" }],
  "createdAt": "…", "editedAt": null, "deleted": false, "deletedAt": null, "canEdit": true, "canDelete": true }
```

- [TaskComments](../src/components/tasks/TaskComments.jsx) in the task page's Activity (it opens first): 20 at a time,
  Load more at the bottom, the box for a new comment last (only with `COMMENT`, nothing archived). Edit and Delete
  follow `canEdit` / `canDelete`; Delete asks first. Mentions show `mentions[].name` (the current name).
- Posted, edited and deleted comments replace the loaded copies (`mergeComments` in
  [utils/comment.js](../src/utils/comment.js)), so a later page never shows one twice.

### Filters (real) — the Board and Backlog filter bar

Backend §3.2: `GET …/tasks?q=&type=&priority=&statusId=&assigneeId=&label=&order=`, all optional, every one that is
set narrows the list, **one value per filter**. `q` matches the title or the key (`mob-4` finds `MOB-42`); `type`,
`priority` and `label` ignore case. Values in [utils/taskFilters.js](../src/utils/taskFilters.js) (`EMPTY_TASK_FILTERS`,
`taskFilterParams`).

- The bar ([components/tasks/filters/](../src/components/tasks/filters/)) has the search box and a Filter button
  (badge = how many are set) that opens a two-pane window, Jira style: Assignee / Type / Priority / Status (board
  columns) / Label on the left, the picked one's options on the right (Assignee and Label are searchable). Picking
  applies at once; set filters also show as removable chips under the bar. Its state lives in `ProjectPage`, so it's
  shared by the Board and Backlog.
- Both tabs still load every task (`loadWork`); [useTaskFilterMatches](../src/hooks/useTaskFilterMatches.js) asks
  the backend which ids match (`listAllTasks` with the filters, same `order`) and the tabs show only those. So counts,
  WIP limits, sprint progress and Complete sprint keep counting every task, and the backend alone decides what matches.
- Board: dragging works while filtered; drop positions are worked out on the full column. Backlog: dragging is off
  while filtered (a drop "before" a row would be ambiguous); the row menu's moves still work.
- Not possible with today's API: several values for one filter (e.g. two assignees) and "Unassigned".

## Board (real)

`GET /projects/{id}/board` (`getBoard` in [projectsApi.js](../src/api/projectsApi.js)) →
`{ template, backlogEnabled, sprintsEnabled, wipLimitsEnabled, activeSprintId, columns: [{ id, name, position, category,
wipLimit, taskCount, wipExceeded, subtaskCount }] }` (`taskCount` = top-level tasks, the WIP count; `subtaskCount`
separately). `VIEW_WORK` **or** `CONFIGURE_BOARD`, so a workspace admin outside the project can read it. Scrum starts with To Do / In Progress / In Review / Done, Kanban with
Backlog / To Do / In Progress / Done. `activeSprintId` stays null until the backend has sprints; the frontend reads
the active sprint from the sprint mock instead.

**Done = a column of category `DONE`** (`TODO` / `IN_PROGRESS` / `DONE`, independent of the name). The sprint
progress bar, Complete sprint and the task stage chips go by category (`columnCategory` in
[utils/task.js](../src/utils/task.js)); a board from before R16 without categories falls back to "last column = done".

### Configuring columns (real, R16, backend `docs/board-docs.md`)

All need `CONFIGURE_BOARD` (Project Manager, workspace admin) and answer the whole board; functions in projectsApi.js.

| Method and path | Body | Notes |
| --- | --- | --- |
| `POST /projects/{id}/board/columns` | `{ name, category, afterColumnId? }` | `201`; no `afterColumnId` = at the end |
| `PATCH /projects/{id}/board/columns/{columnId}` | `{ name?, category?, wipLimit? }` or `{ clearWipLimit: true }` | a limited column that becomes `DONE` sends `clearWipLimit` with it |
| `PUT /projects/{id}/board/columns/order` | `{ columnIds }` | every column once; the Kanban backlog stays first |
| `DELETE /projects/{id}/board/columns/{columnId}` | `{ targetColumnId }` if it holds tasks or subtasks (`taskCount + subtaskCount > 0`) | `204`; soft delete, no restore; they move to the target |

- Rules (the backend answers `400 BAD_REQUEST` with a readable message): 2–10 columns; names unique ignoring case,
  at most 100 characters; always one `TODO` and one `DONE` column; the Kanban backlog (first column) can't move,
  be deleted, change category or get a limit; WIP limits only on Kanban, never on the backlog or a `DONE` column.
  The frontend hides what these rules forbid (`columnRules` in [utils/board.js](../src/utils/board.js)).
- UI, only with `CONFIGURE_BOARD`, both through [useColumnConfig](../src/components/board/useColumnConfig.jsx):
  - the Board tab: each column's "⋯" menu (Edit column, Move left / right, WIP limit, Delete column) and an Add
    column box after the last column;
  - the Settings tab's **Board columns** section ([BoardColumnsSection](../src/components/board/BoardColumnsSection.jsx)):
    the same menus on a list, loaded with `GET /board` only. It is the way in for a Scrum project without an active
    sprint (the Board tab's "No active sprint" links to it) and for a workspace admin outside the project (no
    `VIEW_WORK`, so the Board tab shows "no access").
  - Every change reloads the board, also after a refused one.
- WIP limits are soft: `PUT /tasks/{id}/position` and a `PATCH` that changes `statusId` still move the task and
  answer `wipWarning: { columnId, count, limit, message }` (else null); the board, the drawer and the task page show
  a warning (`wipWarningText`) and the column's "4 / 3" turns red until it drops back. Scrum never shows WIP
  (`wipLimitsEnabled` false).

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
| see tasks, board, sprints | `VIEW_WORK` | every project role, not a non-member workspace admin (who can still read the board's columns) |
| create, edit, delete, restore tasks; move cards on the board | `EDIT_TASKS` | PM, PO, SM, Developer |
| order the backlog | `MANAGE_BACKLOG` | Product Owner |
| plan, start, complete sprints; move tasks into or out of them | `MANAGE_SPRINTS` | Scrum Master |
| add, edit, move, delete columns; WIP limits | `CONFIGURE_BOARD` | Project Manager, workspace admin |
| comment, edit / delete own comments and chat messages | `COMMENT` | every project role except Viewer |
| delete anyone's comment or chat message | `MODERATE_COMMENTS` | Project Manager |

## The sprint mock

- [src/mocks/sprintsMock.js](../src/mocks/sprintsMock.js), **on unless `VITE_MOCK_SPRINTS=false`**. It needs the real
  backend: it reads `GET /projects/{id}` for the caller's permissions, and the real board and tasks to tell done from
  unfinished on Complete sprint.
- Data is kept in `localStorage` under `sprintory.mock.sprints` (no seed data). Clear that key to start over; the old
  `sprintory.mock.tasks` key from the all-mock version isn't used any more.
- It follows the rules above, except that it can't see whether the **workspace** is archived (the UI hides changes anyway).
