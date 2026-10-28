# Teams

Source: `sprintory_backend/docs/teams-docs.md`, as of 23 Oct 2026. Shared rules (errors, pagination) are in [README.md](README.md).

## Basics

- A team is a named group of people inside **one** workspace (e.g. "Backend").
- Only workspace members can be in a team. A person can be in several teams.
- **Only workspace admins manage teams:** create, rename, delete, add and remove people.
- **Private:**
  - Admins see every team.
  - Plain members see only the teams they're in.
  - Everyone else gets `404`.
- Adding a team to a project **copies** its current members once (see [projects.md](projects.md#add-a-team)). Later team changes don't affect the project.
- Archived workspace: teams are readable, every change gets `409 WORKSPACE_ARCHIVED`.

## Who can do what

| Action | Not in workspace | Member, not in team | Member, in team | Admin |
| --- | --- | --- | --- | --- |
| Create a team | 404 | 403 | 403 | ✓ (active) |
| List the workspace's teams | 404 | own teams only | own teams only | all teams |
| Get a team / list its members | 404 | 404 | ✓ | ✓ |
| Rename, delete, add/remove people | 404 | 404 | 403 | ✓ (active) |

Not logged in is always `401`.

## Endpoints

| Method | Path | Body | Success | Frontend |
| --- | --- | --- | --- | --- |
| POST | `/workspaces/{workspaceId}/teams` | `{ name }` | `201` TeamResponse | `createTeam` |
| GET | `/workspaces/{workspaceId}/teams?q=&page=&size=` | — | `200` PageResponse<TeamResponse> | `listTeams` |
| GET | `/teams/{teamId}` | — | `200` TeamResponse | `getTeam` |
| PATCH | `/teams/{teamId}` | `{ name }` | `200` TeamResponse | `renameTeam` |
| DELETE | `/teams/{teamId}` | — | `204` | `deleteTeam` |
| GET | `/teams/{teamId}/members?q=&page=&size=` | — | `200` PageResponse<TeamMemberResponse> | `listTeamMembers` |
| POST | `/teams/{teamId}/members` | `{ userIds: [...] }` | `204` | `addTeamMembers` |
| DELETE | `/teams/{teamId}/members/{userId}` | — | `204` | `removeTeamMember` |

Frontend functions are in [src/api/teamsApi.js](../src/api/teamsApi.js). The page is [TeamsPage](../src/pages/teams/TeamsPage.jsx) at `/workspaces/:workspaceSlug/teams`.

```jsonc
// TeamResponse (nothing else: no description, no member count)
{ "id": 4, "workspaceId": 3, "name": "Backend" }

// TeamMemberResponse
{ "userId": 7, "firstName": "Ada", "lastName": "Lovelace", "email": "ada@example.com" }
```

| Field | Rules |
| --- | --- |
| `name` | required, not blank, ≤ 100 chars, trimmed. **Unique within the workspace** but **case-sensitive** ("Backend" and "backend" are different names) |
| `userIds` | 1–100 ids, no `null`, duplicates count once. Every id must be a member of the team's workspace |

- Team list: `q` matches the name, sorted by name. Plain members only get their own teams, and `totalElements` counts only those.
- Member list: `q` matches first name, last name or email, sorted by first name, then last name.

## Behaviour

- **Create** makes an empty team. Add members with a separate request.
- **Rename** to the current name succeeds and changes nothing.
- **Delete** is a hard delete of the group only. Everyone keeps their workspace and project access, so say so in the confirmation.
- **Add people** is all or nothing. If any id isn't a workspace member, you get `400 BAD_REQUEST` "Some users are not members of this workspace." and nobody is added. The error doesn't say which ids, on purpose. People already in the team are skipped, so re-sending is safe. Reload the member list after `204`.
- **Remove** someone who isn't in the team still returns `204`. An admin may remove themselves; they can still manage the team.

## Frontend flows

1. Teams page: `GET /workspaces/{id}` for `role`, then the paginated team list. Show Create/Rename/Delete/Manage members only for admins of an active workspace. An empty list for a plain member means they're in no team yet.
2. Team details: `GET /teams/{id}` plus its members. `404` means it was deleted or isn't visible, so go back to the list.
3. Add people: a picker fed by `GET /workspaces/{workspaceId}/members?q=...`, then `POST /teams/{id}/members`. On `400 BAD_REQUEST`, someone left the workspace meanwhile: reload the picker.

## Errors

| Code | Status | When |
| --- | --- | --- |
| `VALIDATION_ERROR` | 400 | bad `name` or `userIds` |
| `BAD_REQUEST` | 400 | non-numeric id, malformed body, or a user isn't a workspace member |
| `ACCESS_DENIED` | 403 | a team member (not admin) tries a change |
| `RESOURCE_NOT_FOUND` | 404 | "Workspace not found." (create/list) or "Team not found." (everything else) |
| `CONFLICT` | 409 | the name is taken in this workspace (create/rename) |
| `WORKSPACE_ARCHIVED` | 409 | any change in an archived workspace |
