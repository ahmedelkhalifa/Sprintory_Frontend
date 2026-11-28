# Timeline / schedule (PMP-48, backend PMP-153)

Summary of the backend's `docs/schedule-docs.md` (with milestones, PMP-46; as of 27 Nov 2026), for the frontend. API in
[scheduleApi.js](../src/api/scheduleApi.js), pure helpers in [utils/schedule.js](../src/utils/schedule.js), screens in
[src/components/timeline/](../src/components/timeline/).

## Task dates

- `startDate` / `dueDate` (`YYYY-MM-DD`) on create and on the task PATCH, **both or neither**, due on or after start (the
  same day is fine). Remove both with `clearDates: true`; omitted means unchanged. One date alone or a reversed pair:
  `400 BAD_REQUEST` ("Set both dates or none."). They come back on every `TaskResponse`.
- `EDIT_TASKS`; a Viewer gets `403`. Archived workspace `409 WORKSPACE_ARCHIVED`; a completed or archived project `409
  CONFLICT` ("Task dates are read-only in this project state.") for date changes only.
- History: `FIELD_CHANGED` with `field` `START_DATE` / `DUE_DATE` (ISO dates or null), and `MILESTONE` (names).
- Frontend: `validateTask` checks the pair, `taskChanges` sends both together or `clearDates`
  ([utils/task.js](../src/utils/task.js)); the task page's [TaskDateFields](../src/components/tasks/TaskDateFields.jsx)
  saves the pair when the focus leaves it; [CreateTaskDialog](../src/components/tasks/CreateTaskDialog.jsx) takes them too.

## `GET /projects/{projectId}/schedule`

Members only (`VIEW_WORK`); anyone else, a workspace admin outside the project too, gets `404`. Read-only states can read.
Optional filters (AND): `assigneeId`, `statusId`, `statusCategory`, `milestoneId`, `sprintId`, `type`, `hideDone=true`,
`from` / `to`. They narrow the scheduled rows only; `unscheduled` and `milestones` stay project-wide.

```jsonc
{
  "today": "2026-11-26", "earliestStartDate": "2026-11-08", "latestDueDate": "2026-11-12", // project-wide bounds
  "canEditDates": true, "milestonesAvailable": true,
  "tasks": [{ "id": 10, "key": "PMP-10", "title": "Backend", "startDate": "2026-11-08", "dueDate": "2026-11-10",
              "statusCategory": "IN_PROGRESS", "statusId": 2, "statusName": "In Progress", "type": "TASK",
              "assigneeId": 7, "assignee": "Ada Lovelace", "sprintId": 4, "milestoneId": null }],   // start date, then id
  "dependencies": [{ "id": 21, "blockerId": 10, "blockedId": 11 }],                          // both ends shown
  "milestones": [{ "id": 4, "name": "Beta release", "targetDate": "2026-11-20" }],
  "conflicts": [{ "type": "DEPENDENCY", "taskIds": [10, 11], "dependencyId": 21, "milestoneId": null,
                  "message": "PMP-11 starts before PMP-10 ends" }],
  "unscheduled": [{ "id": 12, "key": "PMP-12", "title": "Testing", "hint": "blocked by PMP-11, set dates to see it on the chart" /* … */ }]
}
```

- A bar runs from its start day to the **end** of its due day (inclusive). An arrow goes from the end of the blocker's
  bar to the start of the blocked one's.
- Conflicts are computed by the backend: a blocked task starting on or before its open blocker's due day
  (`DEPENDENCY`, ids `[blocker, blocked]`), an open task ending after its milestone's target day (`MILESTONE`). A DONE
  blocker never conflicts. They are only shown; saving is never blocked.
- `canEditDates` is false for Viewers and read-only states. The chart is view-only for everyone.

## How the frontend does it

- **Tab:** Timeline (`timeline`, members only, Scrum and Kanban): [TimelineTab](../src/components/timeline/TimelineTab.jsx)
  loads the schedule (filters as params) and the members / columns / sprints for the filters.
- **Chart:** [TimelineChart](../src/components/timeline/TimelineChart.jsx), laid out once per answer and zoom by
  `timelineLayout`: sticky task list and date header, Day / Week / Month zoom (36 / 14 / 4 px a day, remembered), a
  Today line and Go to today, one SVG for the arrows (red for a conflict), milestone diamonds with a dashed line, red
  ring and warning icon on conflict bars, one shared hover card. Each bar only sets its position inline, so 500 rows stay light.
- **Clicking a bar** opens the task page **in a new browser tab**; coming back (the tab shows again, or the window gets
  the focus) reloads the schedule, so fixed dates and conflicts show at once. There is a Refresh button too.
- **Panels:** [ConflictsPanel](../src/components/timeline/ConflictsPanel.jsx) (pick one to scroll to it: the blocked row,
  else the blocker) and [UnscheduledPanel](../src/components/timeline/UnscheduledPanel.jsx) (the hint, Set dates / Open).
- **Filters:** [TimelineFilters](../src/components/timeline/TimelineFilters.jsx) reuses the Board's Filter window:
  Assignee, Milestone, Type, Status, Sprint (Scrum), plus Hide done.

## Not done yet

- A milestone diamond doesn't link anywhere: the frontend has no milestone page yet (PMP-46 frontend).
- The task page can't tell that a project is completed (the project response has no status yet, PMP-63), so it shows
  the date fields and the backend's `409` message explains the refusal.
