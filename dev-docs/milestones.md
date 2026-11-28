# Milestones (PMP-150)

**Source of truth:** `sprintory_backend/docs/milestones-docs.md`.

Project-scoped target dates that group top-level tasks and track completion toward a release or demo. Available in both Scrum and Kanban projects.

## Endpoints

| Method | Path | Permission / Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/projects/{projectId}/milestones` | Project member (`VIEW_WORK`) | List active milestones ordered by `targetDate` ascending (`{ milestones, limit, canManage }`) |
| `POST` | `/projects/{projectId}/milestones` | `MILESTONE_MANAGE` | Create a milestone (`{ name, targetDate, description? }`, max 50 active per project) |
| `GET` | `/milestones/{milestoneId}` | Project member (`VIEW_WORK`) | Milestone details, progress, and `canManage` / `canLink` flags |
| `PUT` | `/milestones/{milestoneId}` | `MILESTONE_MANAGE` | Update `name`, `targetDate`, `description` |
| `DELETE` | `/milestones/{milestoneId}` | `MILESTONE_MANAGE` | Soft-delete milestone and unlink its tasks (`204`) |
| `POST` | `/milestones/{milestoneId}/restore` | `MILESTONE_MANAGE` | Restore a soft-deleted milestone (tasks stay unlinked) |
| `POST` | `/milestones/{milestoneId}/tasks` | `MILESTONE_LINK` | Bulk-link top-level tasks (`{ taskIds }`); moves tasks already in another milestone |
| `PUT` | `/tasks/{taskId}/milestone` | `MILESTONE_LINK` | Link (`{ milestoneId: 5 }`) or unlink (`{ milestoneId: null }`) a single top-level task |

Task lists (`GET /projects/{id}/tasks`) also support `milestoneId` and `noMilestone=true` (mutually exclusive; sending both returns `400`).

## Rules and UI behavior

- **Top-level tasks only:** subtasks cannot be linked directly and inherit their parent task's milestone (shown read-only on the subtask page).
- **Progress and status:** computed from top-level linked tasks (`basis: "POINTS"` when any linked task has an estimate, otherwise `"TASKS"`). Status is `EMPTY` (0 tasks), `REACHED` (all linked tasks in a `DONE` column), `OVERDUE` (`targetDate < today` with unfinished tasks), or `UPCOMING`.
- **Limits & conflicts:** up to `50` active milestones per project (`409 MILESTONE_LIMIT_REACHED`); unique active name per project case-insensitively (`409 MILESTONE_NAME_TAKEN`).
- **Audit actions:** `MILESTONE_CREATED`, `MILESTONE_UPDATED`, `MILESTONE_DELETED`, `MILESTONE_RESTORED` (target type `MILESTONE`).