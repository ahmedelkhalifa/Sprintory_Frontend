# Projects

Source: `sprintory_backend/docs/projects-docs.md` (and `roles-docs.md` §3), as of 24 Oct 2026. Shared rules (errors, pagination) are in [README.md](README.md). Roles and permissions are in [roles.md](roles.md).

## Basics

- A project lives in one workspace. It has a `name` (not unique) and a **`template`**, `SCRUM` or `KANBAN`. The template is required at creation and **can never change**.
- **Any member of an active workspace can create a project** and becomes its **Project Manager** (`PROJECT_MANAGER`).
- Access comes from membership: a project's members can see it, and so can the workspace admins, who can manage it.
- Each member has one or more project roles ([roles.md](roles.md)). People added to a project, one by one or through a team, get `MEMBER`.
- Project Managers **and** workspace admins manage membership. A project always keeps at least one Project Manager.
- Private: anyone else gets `404`. Archived workspace: readable, every change gets `409 WORKSPACE_ARCHIVED`.
- Not available yet: renaming or editing a project (story 8), archiving a project (R30), deleting a single project.

## Who can do what

| Action | Not in workspace | Workspace member, not in project | In project, not PM | PM | Workspace admin |
| --- | --- | --- | --- | --- | --- |
| Create a project | 404 | ✓ (active) | ✓ | ✓ | ✓ |
| List projects | 404 | own projects only | own only | own only | all projects |
| Get a project / list its members | 404 | 404 | ✓ | ✓ | ✓ |
| Add people, add a team, remove people | 404 | 404 | 403 | ✓ (active) | ✓ (active) |

These membership changes need the `MANAGE_MEMBERS` permission.

## Endpoints

| Method | Path | Body | Success | Frontend |
| --- | --- | --- | --- | --- |
| POST | `/workspaces/{workspaceId}/projects` | `{ name, template }` | `201` ProjectResponse | `createProject` ⚠ sends no `template` yet |
| GET | `/workspaces/{workspaceId}/projects?q=&page=&size=` | — | `200` PageResponse<ProjectResponse> | `listProjects` |
| GET | `/projects/{projectId}` | — | `200` ProjectResponse | *not built* |
| GET | `/projects/{projectId}/members?q=&page=&size=` | — | `200` PageResponse<ProjectMemberResponse> | `listProjectMembers` |
| POST | `/projects/{projectId}/members` | `{ userIds: [...] }` | `204` | *not built* |
| POST | `/projects/{projectId}/teams` | `{ teamId }` | `204` | *not built* |
| DELETE | `/projects/{projectId}/members/{userId}` | — | `204` | *not built* |
| PUT | `/projects/{projectId}/members/{userId}/roles` | `{ roles: [...] }` | `200` ProjectMemberResponse | *not built*, see [roles.md](roles.md#endpoints) |

Frontend functions are in [src/api/projectsApi.js](../src/api/projectsApi.js).

```jsonc
// ProjectResponse: roles and permissions are the CALLER's in this project
{ "id": 21, "workspaceId": 3, "name": "Mobile App", "template": "SCRUM",
  "roles": ["PROJECT_MANAGER"],
  "permissions": ["VIEW_PROJECT", "VIEW_WORK", "EDIT_SETTINGS", "ARCHIVE_PROJECT", "MANAGE_MEMBERS",
                  "MANAGE_ROLES", "CONFIGURE_BOARD", "EDIT_TASKS", "COMMENT", "LOG_TIME"] }

// ProjectMemberResponse: that member's profile and project roles
{ "userId": 7, "firstName": "Ada", "lastName": "Lovelace", "email": "ada@example.com", "roles": ["MEMBER"] }
```

A workspace admin who isn't a project member gets `roles: []`, but `permissions` still contains the admin grants.

| Field | Rules |
| --- | --- |
| `name` | required, not blank, ≤ 100 chars, trimmed. **Not unique** (story 8's project key will be) |
| `template` | required, `"SCRUM"` or `"KANBAN"`. Missing → `400 VALIDATION_ERROR`, any other value → `400 BAD_REQUEST` |
| `userIds` | 1–100 ids, no `null`. Each must be a workspace member |
| `teamId` | required. A team of the **same** workspace |

- Project list: `q` matches the name, sorted by name. Plain members never see projects they're not in, even with `q`.
- Member list: `q` matches first name, last name or email.

## Behaviour

- <a id="create"></a>**Create:** the caller becomes the project's Project Manager and shows up in the member list with `PROJECT_MANAGER`. The create dialog needs a Scrum/Kanban choice.
- **Add people:** all or nothing. If any id isn't a workspace member, you get `400 BAD_REQUEST` "Some users are not members of this workspace." New members get `MEMBER`. People already in the project are skipped and keep their roles. Reload members after `204`.
- <a id="add-a-team"></a>**Add a team:** everyone currently in the team is added as `MEMBER`. It's a **one-time copy**, not a link: people who join the team later aren't added, and leaving the team or deleting it doesn't remove anyone. Adding the team again only adds the missing people. An empty team returns `204`. A team from another workspace, or one that doesn't exist, gets `400 BAD_REQUEST` "Team not found in this workspace." Tell the admin it's a one-time copy.
- **Remove:** access is lost immediately (the next request gets `404`). The person stays in the workspace and their teams. The **last Project Manager can't be removed** (`409 LAST_PROJECT_MANAGER`). Removing someone who isn't in the project returns `204`.
- **Admins and project work:** from story 9 on, a workspace admin manages members and settings but doesn't see tasks, comments or sprints unless they are a member (`VIEW_WORK`).

## Frontend flows

1. Projects list: `GET /workspaces/{id}` for `role`, then the paginated list. Show **Create project** to every member of an active workspace.
2. Project page: `GET /projects/{id}` plus its members. Show Add people / Add team / Remove when `permissions` includes `MANAGE_MEMBERS`. `404` means it's gone or the user was just removed, so go back to the list.
3. Add people: picker fed by `GET /workspaces/{workspaceId}/members?q=...`. Add a team: picker fed by `GET /workspaces/{workspaceId}/teams?q=...`.

## Errors

| Code | Status | When |
| --- | --- | --- |
| `VALIDATION_ERROR` | 400 | bad `name`, missing `template`, bad `userIds`, missing `teamId` |
| `BAD_REQUEST` | 400 | invalid `template` value, non-numeric id, user not in the workspace, team not in this workspace |
| `ACCESS_DENIED` | 403 | a project member without `MANAGE_MEMBERS` tries a membership change |
| `RESOURCE_NOT_FOUND` | 404 | "Workspace not found." (create/list) or "Project not found." |
| `LAST_PROJECT_MANAGER` | 409 | removing the last Project Manager |
| `WORKSPACE_ARCHIVED` | 409 | any change in an archived workspace |

## Coming later

| Story | Adds |
| --- | --- |
| 7 (R04) | the visibility rule applied to everything inside a project (`VIEW_WORK`) |
| 8 (R06) | project key (unique per workspace), default board columns per template, editing name and description, settings page |
| 9 (R09) | tasks (`EDIT_TASKS` / `VIEW_WORK`) |
| R30 | completing and archiving a project |
