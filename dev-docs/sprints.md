# Sprints (R14, R15)

Summary of the backend's `docs/sprints-docs.md` (PMP-119 planning, PMP-41 close / cancel, PMP-40 Scrum board;
backend PRs #27 and #28, 8 Nov 2026), for the frontend. All in [sprintsApi.js](../src/api/sprintsApi.js).

## Rules

- **Scrum only.** A sprint is `PLANNED`, `ACTIVE`, `COMPLETED` (closed) or `CANCELLED`; at most one is `ACTIVE`.
  An ended sprint (completed or cancelled) is read-only (`409 CONFLICT`).
- **Permissions:** reading `VIEW_WORK` (Viewers too); create, edit, delete, start, close, move tasks and availability
  `MANAGE_SPRINTS` (Scrum Master); cancel `CANCEL_SPRINTS` (Product Owner, Project Manager; **not** the Scrum Master).
  Archived workspace: `409 WORKSPACE_ARCHIVED` on every change.
- **Dates** are calendar dates, both ends count: end after start, at most 90 days, no overlap with another sprint.
  Dates in a request come **as a pair or not at all**. A new sprint without dates gets the next free period of the
  project's `sprintLengthDays` (default 14). The frontend checks all but the overlap (`validateSprint`).
- **Capacity** is story points, a whole number ≥ 0 or none. Over capacity and unestimated tasks are soft warnings.
- **Tasks:** a sprint holds top-level tasks (`taskIds`, in sprint order); subtasks follow their parent. A Scrum task
  is in the backlog when no planned or active sprint holds it; its backlog rank never changes while it is in one.

## Endpoints

| Method and path | Permission | Function | Notes |
| --- | --- | --- | --- |
| `GET /projects/{id}/sprints` | `VIEW_WORK` | `listSprints` | **planned and active only**, by number |
| `GET /sprints/{id}` | `VIEW_WORK` | `getSprint` | ended ones too |
| `POST /projects/{id}/sprints` `{ name?, goal?, capacity?, startDate?, endDate? }` | `MANAGE_SPRINTS` | `createSprint` | `201`; blank name → "KEY Sprint N" |
| `PATCH /sprints/{id}` (same, partial) + `clearCapacity: true` | `MANAGE_SPRINTS` | `updateSprint` | a null capacity means "unchanged" |
| `DELETE /sprints/{id}` | `MANAGE_SPRINTS` | `deleteSprint` | `PLANNED` only; its tasks go back to the backlog |
| `POST /sprints/{id}/start` `{ startDate, endDate, goal }` | `MANAGE_SPRINTS` | `startSprint` | needs a goal ("Add a Sprint Goal first.") and ≥ 1 task; `409 SPRINT_ALREADY_ACTIVE` |
| `POST /sprints/{id}/complete` | `MANAGE_SPRINTS` | `completeSprint` | see Closing |
| `POST /sprints/{id}/cancel` `{ reason }` | `CANCEL_SPRINTS` | — (PMP-41) | unfinished work to the top of the backlog |
| `GET /sprints/{id}/close-preview` | `VIEW_WORK` | — (PMP-41) | done / unfinished counts and items, `endsEarly`, planned sprints |
| `POST /projects/{id}/sprints/move` `{ taskId, sprintId, afterTaskId }` | `MANAGE_SPRINTS` | `moveToSprint` | `sprintId` null = backlog, `afterTaskId` null = first; `204` |
| `GET /sprints/{id}/capacity-suggestion` | `VIEW_WORK` | `getCapacitySuggestion` | see Capacity |
| `PUT /sprints/{id}/availability/{userId}` `{ availableDays }` | `MANAGE_SPRINTS` | `setAvailability` | answers the new suggestion; a Viewer → `400` |
| `GET /sprints/{id}/scope-history?page=&size=` | `VIEW_WORK` | `listScopeChanges` | PageResponse, newest first |
| `GET /sprints/{id}/commitment` | `VIEW_WORK` | — | the items and estimates frozen at the start |

`SprintResponse`: `id, projectId, name, goal, capacity, startDate, endDate, status, taskIds, completedAt,
committedPoints` (frozen at the start), `completedPoints, selectedPoints, unestimatedTaskIds, overCapacity,
unfinishedPoints, goalAchieved, goalNote, cancelReason` (the last four null until it ends).

## Closing

`POST /complete` `{ goalAchieved: YES | PARTIALLY | NO (required), goalNote? (≤ 1000), confirmEarlyClose?,
carryOverSprintId? | createSprint? }` → `{ sprint, carriedOver, toSprint }`. Done = a `DONE`-category column, no
partial credit. Unfinished items go to the top of the backlog (default), the front of a planned sprint, or a new
one; each gets `carriedOverCount + 1` and a `CARRIED_OVER` history entry. Before the end date without
`confirmEarlyClose: true` → `409 EARLY_CLOSE_CONFIRMATION_REQUIRED`.

## Capacity

`{ suggestedCapacity, averageVelocity, normalPersonDays, availablePersonDays, workingDays, members: [{ userId,
availableDays }] }`. Velocity is the average `completedPoints` of the last up to three **completed** sprints
(cancelled ones don't count); none yet → `suggestedCapacity: null`. Suggestion =
`round(averageVelocity × availablePersonDays / normalPersonDays)`. Working days are Monday–Friday; every non-Viewer
member counts with all of them until changed (0 to `workingDays`).

## History

A task's History shows `SPRINT_SCOPE_CHANGED` (added to / removed from an active sprint: the sprint's name in
`newValue` / `oldValue`) and `CARRIED_OVER` (`oldValue` the closed sprint, `newValue` the destination or null for
the backlog); `historyLine` in [utils/task.js](../src/utils/task.js) words them.

## How the frontend does it

- **Backlog tab** ([BacklogTab](../src/components/backlog/BacklogTab.jsx)): planned and active sprints above the
  backlog; create, edit, start, delete; drag or move tasks. The sprint header shows points / capacity and
  "N not estimated", counted from the tasks on screen so they follow moves at once.
- **Edit sprint** ([SprintDialog](../src/components/backlog/SprintDialog.jsx)) also shows
  [SprintCapacity](../src/components/backlog/SprintCapacity.jsx): the suggestion with "Use", and each member's days
  (saved when the field loses focus). Not in Create: the sprint must exist first. The body comes from `sprintRequest`
  in [utils/sprint.js](../src/utils/sprint.js).
- **Board tab:** the active sprint and Complete sprint ([CompleteSprintDialog](../src/components/board/CompleteSprintDialog.jsx):
  goal achieved, note, carry-over target; on `EARLY_CLOSE_CONFIRMATION_REQUIRED` it asks and resends).
- **Sprints tab** ([SprintsTab](../src/components/sprints/SprintsTab.jsx)), read-only: the current sprint (board
  header, committed / current points, capacity, unestimated, scope changes since the start), the planned ones in
  short, and an empty "Previous sprints" (no list endpoint for ended sprints yet).
- **Not built yet (PMP-41):** the close preview, Cancel sprint, the "Carried over ×N" marker on cards.
