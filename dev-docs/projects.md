# Projects

Source: `sprintory_backend/docs/projects-docs.md` (and `roles-docs.md` §3), as of 26 Oct 2026. Shared rules (errors, pagination) are in [README.md](README.md). Roles and permissions are in [roles.md](roles.md). The board's columns and tasks are in [tasks.md](tasks.md).

## Basics

- A project lives in one workspace. It has a `name` (not unique), a **`key`** (e.g. `MOB`, unique in the workspace), an optional `description` and a **`template`**, `SCRUM` or `KANBAN`. **The key and the template are chosen at creation and never change**; the name and description can be edited.
- **The template prepares the board:** creating a project also creates its board with the template's default columns (Scrum: To Do, In Progress, In Review, Done; Kanban: Backlog, To Do, In Progress, Done).
- **Any member of an active workspace can create a project** and becomes its **Project Manager** (`PROJECT_MANAGER`).
- Access comes from membership: a project's members can see it, and so can the workspace admins, who can manage it (but not see its work, see [tasks.md](tasks.md)).
- Each member has one or more project roles ([roles.md](roles.md)). People added to a project, one by one or through a team, get `MEMBER`.
- Project Managers **and** workspace admins manage membership and settings. A project always keeps at least one Project Manager.
- Private: anyone else gets `404`. Archived workspace: readable, every change gets `409 WORKSPACE_ARCHIVED`.
- Not available yet: archiving a project (R30), deleting a single project, editing board columns (R16).

## Who can do what

| Action | Not in workspace | Workspace member, not in project | In project, not PM | PM | Workspace admin |
| --- | --- | --- | --- | --- | --- |
| Create a project | 404 | ✓ (active) | ✓ | ✓ | ✓ |
| List projects | 404 | own projects only | own only | own only | all projects |
| Get a project / list its members | 404 | 404 | ✓ | ✓ | ✓ |
| Edit name and description | 404 | 404 | 403 | ✓ (active) | ✓ (active) |
| Read the board | 404 | 404 | ✓ | ✓ | 403 unless also a member |
| Add people, add a team, remove people | 404 | 404 | 403 | ✓ (active) | ✓ (active) |

Membership changes need `MANAGE_MEMBERS`, editing settings `EDIT_SETTINGS`, reading the board `VIEW_WORK`.

## Endpoints

| Method | Path | Body | Success | Frontend |
| --- | --- | --- | --- | --- |
| POST | `/workspaces/{workspaceId}/projects` | `{ name, key, template, description? }` | `201` ProjectResponse | `createProject` |
| GET | `/workspaces/{workspaceId}/projects?q=&page=&size=` | — | `200` PageResponse<ProjectResponse> | `listProjects` |
| GET | `/projects/{projectId}` | — | `200` ProjectResponse | `getProject` |
| PATCH | `/projects/{projectId}` | `{ name?, description? }` | `200` ProjectResponse | `updateProject` |
| GET | `/projects/{projectId}/board` | — | `200` ProjectBoardResponse ([tasks.md](tasks.md#board-real)) | `getBoard` |
| GET | `/projects/{projectId}/members?q=&page=&size=` | — | `200` PageResponse<ProjectMemberResponse> | `listProjectMembers` |
| POST | `/projects/{projectId}/members` | `{ userIds: [...] }` | `204` | `addProjectMembers` |
| POST | `/projects/{projectId}/teams` | `{ teamId }` | `204` | `addTeamToProject` |
| DELETE | `/projects/{projectId}/members/{userId}` | — | `204` | `removeProjectMember` |
| PUT | `/projects/{projectId}/members/{userId}/roles` | `{ roles: [...] }` | `200` ProjectMemberResponse | *not built*, see [roles.md](roles.md#endpoints) |

Frontend functions are in [src/api/projectsApi.js](../src/api/projectsApi.js).

```jsonc
// ProjectResponse: roles and permissions are the CALLER's in this project; description may be null
{ "id": 21, "workspaceId": 3, "name": "Mobile App", "key": "MOB",
  "description": "The iOS and Android app.", "template": "SCRUM",
  "roles": ["PROJECT_MANAGER"],
  "permissions": ["VIEW_PROJECT", "VIEW_WORK", "EDIT_SETTINGS", "ARCHIVE_PROJECT", "MANAGE_MEMBERS",
                  "MANAGE_ROLES", "CONFIGURE_BOARD", "EDIT_TASKS", "COMMENT", "LOG_TIME"] }

// ProjectMemberResponse: that member's profile and project roles
{ "userId": 7, "firstName": "Ada", "lastName": "Lovelace", "email": "ada@example.com", "roles": ["MEMBER"] }
```

A workspace admin who isn't a project member gets `roles: []`, but `permissions` still contains the admin grants.

| Field | Rules |
| --- | --- |
| `name` | required on create, not blank, ≤ 100 chars, trimmed. On update: optional, but if sent not blank. **Not unique** |
| `key` | create only. Required, 2–10 letters or digits starting with a letter (`MOB`, `PMP2`), stored **upper-case**, **unique in the workspace**, never changes (task keys like `MOB-42` are built from it). The create dialog suggests one from the name (`suggestProjectKey`) |
| `description` | optional, no length limit, trimmed; blank is stored as `null`. On update: left out = unchanged, `""` clears it |
| `template` | create only. Required, `"SCRUM"` or `"KANBAN"`. Missing → `400 VALIDATION_ERROR`, any other value → `400 BAD_REQUEST` |
| `userIds` | 1–100 ids, no `null`. Each must be a workspace member |
| `teamId` | required. A team of the **same** workspace |

- Project list: `q` matches the name, sorted by name. Plain members never see projects they're not in, even with `q`.
- Member list: `q` matches first name, last name or email.
- Projects created before the key existed got `P` + their id (`P12`) as key.

## Behaviour

- <a id="create"></a>**Create:** the caller becomes the project's Project Manager, and the board gets the template's columns. The create dialog asks for name, key, template and an optional description, and says the key and template can't change later. `409 PROJECT_KEY_TAKEN` is shown under the key field.
- **Edit:** name and description only; the key and template are shown read-only.
- **Add people:** all or nothing. If any id isn't a workspace member, you get `400 BAD_REQUEST` "Some users are not members of this workspace." New members get `MEMBER`. People already in the project are skipped and keep their roles. Reload members after `204`.
- <a id="add-a-team"></a>**Add a team:** everyone currently in the team is added as `MEMBER`. It's a **one-time copy**, not a link: people who join the team later aren't added, and leaving the team or deleting it doesn't remove anyone. Adding the team again only adds the missing people. An empty team returns `204`. A team from another workspace, or one that doesn't exist, gets `400 BAD_REQUEST` "Team not found in this workspace." Tell the admin it's a one-time copy.
- **Remove:** access is lost immediately (the next request gets `404`), and the person is unassigned from the project's tasks. They stay in the workspace and their teams. The **last Project Manager can't be removed** (`409 LAST_PROJECT_MANAGER`). Removing someone who isn't in the project returns `204`.
- **Admins and project work:** a workspace admin manages members and settings but doesn't see the board, tasks or sprints unless they are a member (`VIEW_WORK`).

## Errors

| Code | Status | When |
| --- | --- | --- |
| `VALIDATION_ERROR` | 400 | bad `name` or `key`, missing `template`, bad `userIds`, missing `teamId` |
| `BAD_REQUEST` | 400 | invalid `template` value, non-numeric id, user not in the workspace, team not in this workspace |
| `ACCESS_DENIED` | 403 | a project member without the permission (membership, settings); a non-member admin reading the board |
| `RESOURCE_NOT_FOUND` | 404 | "Workspace not found." (create/list) or "Project not found." |
| `PROJECT_KEY_TAKEN` | 409 | "The key MOB is already used in this workspace." |
| `CONFLICT` | 409 | rare: two requests created the same key at the same moment |
| `LAST_PROJECT_MANAGER` | 409 | removing the last Project Manager |
| `WORKSPACE_ARCHIVED` | 409 | any change in an archived workspace |

## Coming later

| Story | Adds |
| --- | --- |
| R13–R15 | sprints; `activeSprintId` on the board gets a value |
| R16 | adding, renaming, reordering board columns and WIP limits (`CONFIGURE_BOARD`) |
| R30 | completing and archiving a project (`ARCHIVE_PROJECT`) |

### Assumed by the frontend (not in the backend yet)

The projects pages already have UI for R30, built against the shapes below (the `ASSUMED` block in [projectsApi.js](../src/api/projectsApi.js)). They copy the workspace (archive/restore) and team (DELETE) patterns. **Backend: please implement these shapes, or tell us what changed.** Until then, these buttons fail with an error and the Archived tab shows every project.

| Method | Path | Body | Success | Needs | Frontend |
| --- | --- | --- | --- | --- | --- |
| POST | `/projects/{projectId}/archive` | — | `200` ProjectResponse | `ARCHIVE_PROJECT` | `archiveProject` |
| POST | `/projects/{projectId}/restore` | — | `200` ProjectResponse | `ARCHIVE_PROJECT` | `restoreProject` |
| DELETE | `/projects/{projectId}` | — | `204` | `ARCHIVE_PROJECT` (no delete permission exists yet) | `deleteProject` |
| GET | `/workspaces/{workspaceId}/projects?status=ACTIVE\|ARCHIVED` | — | filtered list; no `status` = all | — | `listProjects` |

- Assumed `ProjectResponse` fields: `createdAt` (the details card shows "—" without it) and `status` (`ACTIVE` / `ARCHIVED`; missing = active).
- Assumed error: `409 PROJECT_ARCHIVED` for any change to an archived project other than restore and delete.
