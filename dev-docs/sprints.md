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
| `POST /sprints/{id}/complete` | `MANAGE_SPRINTS` | `completeSprint` | see Completing |
| `POST /sprints/{id}/cancel` `{ reason }` | `CANCEL_SPRINTS` | `cancelSprint` | reason required, ≤ 1000; unfinished work to the top of the backlog; `toSprint` always null |
| `GET /sprints/{id}/close-preview` | `VIEW_WORK` | `getClosePreview` | `ACTIVE` only (else `409 CONFLICT`); see Completing |
| `POST /projects/{id}/sprints/move` `{ taskId, sprintId, afterTaskId }` | `MANAGE_SPRINTS` | `moveToSprint` | `sprintId` null = backlog, `afterTaskId` null = first; `204` |
| `GET /sprints/{id}/capacity-suggestion` | `VIEW_WORK` | `getCapacitySuggestion` | see Capacity |
| `PUT /sprints/{id}/availability/{userId}` `{ availableDays }` | `MANAGE_SPRINTS` | `setAvailability` | answers the new suggestion; a Viewer → `400` |
| `GET /sprints/{id}/scope-history?page=&size=` | `VIEW_WORK` | `listScopeChanges` | PageResponse, newest first |
| `GET /sprints/{id}/commitment` | `VIEW_WORK` | — | the items and estimates frozen at the start |

`SprintResponse`: `id, projectId, name, goal, capacity, startDate, endDate, status, taskIds, completedAt,
committedPoints` (frozen at the start), `completedPoints, selectedPoints, unestimatedTaskIds, overCapacity,
unfinishedPoints, goalAchieved, goalNote, cancelReason` (the last four null until it ends).

## Completing (the brief's "close")

`POST /complete` `{ goalAchieved: YES | PARTIALLY | NO (required), goalNote? (≤ 1000), confirmEarlyClose?,
carryOverSprintId? | createSprint? }` → `{ sprint, carriedOver, toSprint }`. Done = a `DONE`-category column, no
partial credit. Unfinished items go to the top of the backlog (default), the front of a planned sprint, or a new
one; each gets `carriedOverCount + 1` and a `CARRIED_OVER` history entry. Before the end date without
`confirmEarlyClose: true` → `409 EARLY_CLOSE_CONFIRMATION_REQUIRED`.

`GET /close-preview` (both windows use it): `{ sprintId, name, endDate, doneCount, donePoints, unfinishedCount,
unfinishedPoints, unfinished: [{ taskId, key, title, estimate, statusName, openSubtasks }], endsEarly, daysLeft,
plannedSprints: [{ id, name, startDate }] }`. Unfinished items are in sprint order; a partly done story is
unfinished with 0 points.

**Cancel** (`POST /cancel { reason }`, Product Owner or Project Manager; the Scrum Master gets `403`): the same split
and carry-over, always to the top of the backlog, no early-close check. `completedPoints` is still saved, but a
cancelled sprint never counts toward velocity. The reason is on the sprint (`cancelReason`) and in the audit log,
never in the notification.

**Errors to expect:**
- `400 VALIDATION_ERROR` with `fieldErrors.goalAchieved` / `goalNote` / `reason`;
- `400 BAD_REQUEST` (both destinations, a destination that is no longer planned, no free dates for a new sprint);
- `403`, `404`;
- `409 CONFLICT` ("Only an active sprint can be closed.", or the project is read-only);
- `409 EARLY_CLOSE_CONFIRMATION_REQUIRED`, `409 WORKSPACE_ARCHIVED`.

**After the end** the sprint is read-only and drops out of `GET /projects/{id}/sprints`; `GET /sprints/{id}` still
reads it, with `completedAt`, `completedPoints`, `unfinishedPoints`, `goalAchieved`, `goalNote` and `cancelReason`.
Its `taskIds` are then its done items.

**Notifications:**
- `SPRINT_COMPLETED` / `SPRINT_CANCELLED` go to every member except the one who ended it.
- `SPRINT_OVERDUE` goes daily at 09:00 UTC to the Scrum Masters while the active sprint is past its end date, with no
  actor.
- All are in the `SPRINT` preference category.

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
- **Board tab:** the active sprint's header ([SprintBoardHeader](../src/components/board/SprintBoardHeader.jsx)):
  - progress, time left, or a **"Past end date"** badge from the board's `activeSprint.overdue`;
  - **Complete sprint** (`MANAGE_SPRINTS`) and **Cancel sprint** (`CANCEL_SPRINTS`), each only in a writable project.
    Someone holding both roles sees both buttons.
  - After either, the Board goes to the sprint's page with the result as a message (`sprintEndedText`), e.g. "Sprint
    completed. 2 items moved to the top of the backlog". Nothing is patched by hand: the other tabs load fresh.
- **Complete sprint** ([CompleteSprintDialog](../src/components/board/CompleteSprintDialog.jsx)):
  - It loads the close preview ([useClosePreview](../src/components/board/useClosePreview.js)) and shows "20 done /
    6 unfinished" in points, with item counts, then the unfinished items in sprint order: key, title, column, open
    subtasks, points or "not estimated".
  - **Sprint Goal achieved?** is Yes / Partially / No, none preselected; the button stays off until one is picked.
    Note: optional, ≤ 1000 characters.
  - **Unfinished work goes to:** the top of the backlog (default), the next planned sprint (hidden without one), or a
    new sprint.
  - `endsEarly` shows the warning up front and the button reads "Complete early" (the request sends
    `confirmEarlyClose: true`). A `409 EARLY_CLOSE_CONFIRMATION_REQUIRED` anyway (the dates changed) shows it and
    the next press confirms.
  - The body comes from `completeSprintRequest`, which never sends both destinations.
- **Cancel sprint** ([CancelSprintDialog](../src/components/board/CancelSprintDialog.jsx)): red title, the brief's
  explanation, the preview's numbers, and a required reason (≤ 1000). **Keep sprint** / **Cancel sprint**; the
  latter stays off while the reason is blank.
- **Errors in both windows:**
  - `VALIDATION_ERROR` shows on the fields, with our own texts (`fieldErrorsAs`, since the backend's are validator
    defaults);
  - `409 CONFLICT` (someone ended it meanwhile, or the project became read-only) closes the window, shows the
    backend's message and reloads the board;
  - anything else shows in the window and keeps the input.
- **Sprint page** (`…/sprints/:sprintId`, [SprintSummaryPage](../src/components/sprints/SprintSummaryPage.jsx) →
  [SprintSummary](../src/components/sprints/SprintSummary.jsx)), under the Sprints tab:
  - Reads `GET /sprints/{id}`, any status: status, planned dates, when it ended, and the frozen points (done with
    item count, carried over, committed).
  - For a close, "Goal achieved: …" and the note; for a cancel, the reason.
  - Opened right after ending a sprint and from a task's history ("carried it over from … (see the sprint)", via
    `refId`).
  - A sprint of another project, or one the caller can't see, shows "not found". `SprintSummary` only draws, so it
    can move into a window if that's ever preferred.
- **"Carried over ×N"** (`carriedOverLabel`, from `carriedOverCount`) on board cards and backlog rows; never on
  subtasks.
- **Notifications** have no sprint id: `SPRINT_STARTED` / `SPRINT_OVERDUE` open the Board, `SPRINT_COMPLETED` /
  `SPRINT_CANCELLED` the Sprints tab (`notificationTargetPath`).
- **Sprints tab** ([SprintsTab](../src/components/sprints/SprintsTab.jsx)), read-only:
  - the current sprint: board header (with "Past end date"), committed / current points, capacity, unestimated, and
    scope changes since the start;
  - the planned ones in short;
  - an empty "Previous sprints", since there's no list endpoint for ended sprints. Until there is, an ended sprint is
    reached from a task's history, or right after ending it.
