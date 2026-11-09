# Project charter (PMP-116 backend, PMP-117 frontend)

Source: `sprintory_backend/docs/project-charter-docs.md`, as of 9 Nov 2026. Shared rules (errors, pagination) are in [README.md](README.md).

A lightweight project charter on the project's **Charter** tab (`.../projects/:projectId/charter`): goals, in / out of scope, the stakeholder register and the goal / scope history. Every project has one, empty at first; the project works fine with it empty.

## Access

- **Read:** project members only, Viewers included. Anyone else (also a workspace admin outside the project) gets `404`, so the tab is `membersOnly` in [tabList.js](../src/components/projects/overview/tabList.js), like Chat.
- **Edit:** `EDIT_CHARTER` = the Project Manager, and the Product Owner in Scrum. Others get `403 ACCESS_DENIED`.
- **Read-only:** a `COMPLETED` / `ARCHIVED` project answers `409 CHARTER_READ_ONLY`, an archived workspace `409 WORKSPACE_ARCHIVED`. Reading still works.
- The frontend shows edit controls from the charter's own `canEdit` (it covers permission, project state and workspace state), plus the project page's `writable`. There are no project state transitions yet (PMP-63), so a locked project only shows up through `canEdit` / `readOnly`.

## Endpoints ([charterApi.js](../src/api/charterApi.js))

| Method | Path | Body | Answer |
| --- | --- | --- | --- |
| GET | `/projects/{id}/charter` | — | `{ projectId, canEdit, readOnly, inScope, outOfScope, goals, stakeholders }` |
| GET | `/projects/{id}/charter/history?page&size` | — | `PageResponse` of `{ id, actorId, actorName, occurredAt, changeType, oldValue, newValue }`, newest first |
| POST / PUT | `/projects/{id}/charter/goals[/{goalId}]` | `{ title, successMeasure }` | the goal `{ id, title, successMeasure, order }` (201 on create) |
| DELETE | `/projects/{id}/charter/goals/{goalId}` | — | `204`; the rest are renumbered 0..n-1 |
| PUT | `/projects/{id}/charter/goals/order` | `{ goalIds }` (all of them, once each) | the ordered goals |
| PUT | `/projects/{id}/charter/scope` | `{ inScope, outOfScope }` | the whole charter |
| POST / PUT | `/projects/{id}/charter/stakeholders[/{id}]` | `{ name, organization, projectRole, interest, influence, contactEmail, linkedUserId }` | the stakeholder (+ `linkedUserName`) |
| DELETE | `/projects/{id}/charter/stakeholders/{id}` | — | `204` |

## Rules

- **Goals:** title required, trimmed, at most 200; success measure optional, at most 1000 (blank = null). Manual order, zero-based. A reorder sends the complete id list.
- **Scope:** two TipTap documents as **JSON strings** (like descriptions), checked by the backend's rich-text parser (`400 INVALID_RICH_TEXT`). Always send both: a missing one is cleared; empty = `null`. Drawn with `RichText` (node by node, never HTML). The editor has no @mentions here: scope is not a notification source.
- **Stakeholders:** name required (200), organization (200), role in the project (100, free text), interest / influence `LOW` / `MEDIUM` / `HIGH` or null, contact email (valid, 254), optional `linkedUserId` of a **workspace** member (else `400 BAD_REQUEST`). No account needed.
- **Privacy:** contact emails come only from this endpoint. Keep them in the tab's own state: never in a shared store, telemetry or a notification. Stakeholder changes are not in the history and notify nobody.
- **History:** goal and scope changes only. `GOAL_*` old/new are goal snapshots (JSON strings), `GOALS_REORDERED` JSON id arrays, `*_SCOPE_CHANGED` TipTap JSON strings. No entry for a no-op. `charterHistoryLine` in [utils/charter.js](../src/utils/charter.js) turns an entry into words and old → new pairs.

## Frontend

- [CharterTab](../src/components/charter/CharterTab.jsx) loads the charter and holds the optimistic goal order; [CharterGoals](../src/components/charter/CharterGoals.jsx) (drag with `@dnd-kit`, keyboard included, or Move up / down), [CharterScope](../src/components/charter/CharterScope.jsx), [CharterStakeholders](../src/components/charter/CharterStakeholders.jsx), [CharterHistory](../src/components/charter/CharterHistory.jsx) (paged, "Load older").
- A linked stakeholder's name opens [LinkedUserLink](../src/components/charter/LinkedUserLink.jsx): the app has no user profile page yet, so it shows the user's workspace profile (from the member list) and links to the Members page. Replace it with a link once a profile route exists.
