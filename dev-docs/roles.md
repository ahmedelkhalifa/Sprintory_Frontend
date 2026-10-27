# Roles and permissions

Source: `sprintory_backend/docs/roles-docs.md`, as of 24 Oct 2026. Shared rules are in [README.md](README.md).

## Basics

- **Two levels:** one role per workspace (`WORKSPACE_ADMIN` / `WORKSPACE_MEMBER`), and one or more roles per project. Users have **no global role**.
- **Roles grant permissions.** The backend checks permissions, and so should the UI: hide or show controls based on `ProjectResponse.permissions`, never on role names.
- **Roles combine:** a person's permissions are the union of all their roles in that project.
- Project Manager, Product Owner and Scrum Master include every Member permission.
- **The template decides which roles exist.** Scrum offers all five; Kanban offers Project Manager, Member and Viewer only.
- There is always someone in charge: at least one workspace admin, and at least one Project Manager per project.

## Project roles

| API value | Shown as | Templates | Purpose |
| --- | --- | --- | --- |
| `PROJECT_MANAGER` | Project Manager | Scrum, Kanban | settings, members, roles, archiving, board |
| `PRODUCT_OWNER` | Product Owner | Scrum | owns and orders the backlog |
| `SCRUM_MASTER` | Scrum Master | Scrum | plans, starts and closes sprints |
| `MEMBER` | **Developer** in Scrum, **Member** in Kanban | Scrum, Kanban | works on tasks, comments, logs time |
| `VIEWER` | Viewer | Scrum, Kanban | read-only; **can't be combined** with any other role |

- The API always sends `MEMBER`. The frontend shows "Developer" when `template === "SCRUM"`.
- The project creator gets `PROJECT_MANAGER`. People added to a project (directly or via a team) get `MEMBER`.

## Permission matrix

| Permission | Allows | PM | PO | SM | Member | Viewer | WS admin |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `VIEW_PROJECT` | see the project and its members | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `VIEW_WORK` | see tasks, comments, attachments, sprints, reports | ✓ | ✓ | ✓ | ✓ | ✓ | |
| `EDIT_SETTINGS` | edit name, description, settings | ✓ | | | | | ✓ |
| `ARCHIVE_PROJECT` | complete and archive | ✓ | | | | | ✓ |
| `MANAGE_MEMBERS` | add people or a team, remove people | ✓ | | | | | ✓ |
| `MANAGE_ROLES` | change members' project roles | ✓ | | | | | ✓ |
| `CONFIGURE_BOARD` | board columns, WIP limits | ✓ | | | | | |
| `MANAGE_BACKLOG` | order and prioritize the backlog | | ✓ | | | | |
| `MANAGE_SPRINTS` | plan, start, close sprints | | | ✓ | | | |
| `EDIT_TASKS` | create, edit, delete tasks | ✓ | ✓ | ✓ | ✓ | | |
| `COMMENT` | comment on tasks | ✓ | ✓ | ✓ | ✓ | | |
| `LOG_TIME` | log time | ✓ | ✓ | ✓ | ✓ | | |

- **WS admin** is what a workspace admin gets in every project of their workspace, member or not. They manage the project but **don't see its work** unless they're also a member, in which case the two sets combine.
- **Strict Scrum:** only the Product Owner orders the backlog, and only the Scrum Master runs sprints. A Project Manager who should do either gives themselves that role too.
- Only `VIEW_PROJECT`, `MANAGE_MEMBERS` and `MANAGE_ROLES` are enforced today. The others arrive with their features.

## Endpoints

| Action | Method and path | Body | Success |
| --- | --- | --- | --- |
| Change a member's workspace role (admin) | `PATCH /workspaces/{workspaceId}/members/{userId}` | `{ "role": "WORKSPACE_ADMIN" }` | `200` WorkspaceMemberResponse |
| Remove a member (admin), or leave (own `userId`) | `DELETE /workspaces/{workspaceId}/members/{userId}` | — | `204` |
| Replace a member's project roles (`MANAGE_ROLES`) | `PUT /projects/{projectId}/members/{userId}/roles` | `{ "roles": ["PRODUCT_OWNER", "SCRUM_MASTER"] }` | `200` ProjectMemberResponse |

In the frontend: `changeWorkspaceMemberRole` (`workspacesApi.js`, used by the workspace Members page at `/workspaces/:id/members`) and `setProjectMemberRoles` (`projectsApi.js`, used by the "Change roles" window on the project's Members tab). Removing a member / leaving a workspace has no UI yet.

## Rules

**Workspace roles**
- Only an admin changes roles, and only in an active workspace (otherwise `403` / `409 WORKSPACE_ARCHIVED`).
- The person must be a member, otherwise `404` "Member not found."
- Demoting the **last admin** (yourself included) → `409 LAST_WORKSPACE_ADMIN`. Demoting an admin while another one remains is fine.
- Setting the role someone already has succeeds and changes nothing.

**Removing and leaving**
- An admin may remove anyone. A member may only remove themselves (leaving). Anything else gets `403`. The workspace must be active.
- Refused for the **last admin** (`409 LAST_WORKSPACE_ADMIN`).
- Refused for the **only Project Manager** of any project in the workspace (`409 LAST_PROJECT_MANAGER`). The message names those projects, so show it as-is.
- The only Scrum Master, Product Owner or Developer of a project **may** leave.
- Leaving or being removed takes the person out of every team and project of that workspace. Invited again, they come back as a plain member with nothing.

**Project roles** (`PUT .../roles`)
- Needs `MANAGE_ROLES` (Project Managers and workspace admins). A project member without it gets `403`; someone who can't see the project gets `404`.
- The person must be a project member, otherwise `404` "Project member not found."
- The new set **replaces** the old one completely.
- `400 INVALID_PROJECT_ROLES` when the set is empty ("A member must have at least one role."), when Viewer is combined with another role, or when the template doesn't offer a role (e.g. "Scrum Master is not available in Kanban projects.").
- Taking Project Manager from the last Project Manager (yourself included) → `409 LAST_PROJECT_MANAGER`.

## Frontend notes

- **Hide by permission:** e.g. "Start sprint" only with `MANAGE_SPRINTS`, edit controls only with `EDIT_TASKS`, member management only with `MANAGE_MEMBERS`. The backend refuses either way.
- **Role picker:**
  - Offer only the roles of the project's `template`.
  - Viewer is exclusive: selecting it clears the others, and vice versa.
  - Label `MEMBER` "Developer" in Scrum projects.
  - Don't allow an empty selection: the window keeps the last role ticked and shows "A member must have at least one role."
  - The helpers (`projectRoleOptions`, `toggleProjectRole`, `validateProjectRoles`) are in [utils/project.js](../src/utils/project.js), the role lists in [constants/projects.js](../src/constants/projects.js).
- **Leave workspace:** `DELETE` with the user's own id. On `409 LAST_PROJECT_MANAGER`, show the backend message (it lists the projects). Afterwards, reload workspaces and navigate away.
- **Create project:** `template` is required, see [projects.md](projects.md#create).
