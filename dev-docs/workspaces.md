# Workspaces

Source: `sprintory_backend/docs/workspaces-docs.md`, as of 23–24 Oct 2026. Shared rules (errors, pagination) are in [README.md](README.md).

## Basics

- A workspace is the top-level container. Teams and projects live inside it.
- Any logged-in user can create a workspace and becomes its **admin**. A user can belong to many workspaces.
- **Roles are per workspace:** `WORKSPACE_ADMIN` or `WORKSPACE_MEMBER`, read from `WorkspaceResponse.role`. The same person can be an admin in one workspace and a member in another.
- People join **only by invitation**, as `WORKSPACE_MEMBER`.
- Private: non-members get `404`. Members without the admin role get `403` on admin actions.
- **Archive before delete.** Archiving makes the workspace read-only and can be undone. Permanent delete is only allowed once archived.
- A workspace always keeps at least one admin (see [roles.md](roles.md)).

| Role | Can do |
| --- | --- |
| `WORKSPACE_ADMIN` | everything a member can, plus rename, archive, restore, delete, invite, change roles, remove members, see and manage every team, see every project and manage its members/roles |
| `WORKSPACE_MEMBER` | see the workspace and its member list, see their own teams and projects, create projects, leave |

## Who can do what

| Action | Not logged in | Not a member | Member | Admin |
| --- | --- | --- | --- | --- |
| Create a workspace | 401 | ✓ | ✓ | ✓ |
| List my workspaces | 401 | ✓ (own list) | ✓ | ✓ |
| Get a workspace, list its members | 401 | 404 | ✓ | ✓ |
| Rename | 401 | 404 | 403 | ✓ (active only) |
| Archive, restore | 401 | 404 | 403 | ✓ |
| Delete permanently | 401 | 404 | 403 | ✓ (archived only) |
| Invite people | 401 | 404 | 403 | ✓ (active only) |
| Look up an invitation | ✓ (no login) | ✓ | ✓ | ✓ |
| Accept an invitation | 401 | ✓ if the email matches | ✓ if the email matches | ✓ if the email matches |

## Endpoints

| Method | Path | Body | Success | Frontend |
| --- | --- | --- | --- | --- |
| POST | `/workspaces` | `{ name }` | `201` WorkspaceResponse | `createWorkspace` |
| GET | `/workspaces` | — | `200` WorkspaceResponse[] | `listWorkspaces` |
| GET | `/workspaces/{id}` | — | `200` WorkspaceResponse | `getWorkspace` |
| GET | `/workspaces/{id}/members?q=&page=&size=` | — | `200` PageResponse<WorkspaceMemberResponse> | `listWorkspaceMembers` |
| PATCH | `/workspaces/{id}` | `{ name }` | `200` WorkspaceResponse | `renameWorkspace` |
| POST | `/workspaces/{id}/archive` | — | `200` WorkspaceResponse | `archiveWorkspace` |
| POST | `/workspaces/{id}/restore` | — | `200` WorkspaceResponse | `restoreWorkspace` |
| DELETE | `/workspaces/{id}` | — | `204` | `deleteWorkspace` |
| POST | `/workspaces/{id}/invitations` | `{ emails: [...] }` | `201` InvitationsSentResponse | `inviteMembers` |
| POST | `/invitations/lookup` | `{ token }` | `200` InvitationLookupResponse | `lookupInvitation` |
| POST | `/invitations/accept` | `{ token }` | `200` WorkspaceResponse | `acceptInvitation` |

Role changes, removing members and leaving: see [roles.md](roles.md#endpoints).

Frontend functions are in [src/api/workspacesApi.js](../src/api/workspacesApi.js). Mutations fire `WORKSPACES_CHANGED`, and [WorkspaceProvider](../src/context/WorkspaceProvider.jsx) then reloads the list.

### Field rules

| Field | Rules |
| --- | --- |
| `name` | required, not blank, ≤ 100 chars, trimmed by the server |
| `emails` | 1–50 valid emails; trimmed, lower-cased and de-duplicated by the server |
| `token` | required, not blank |

### Responses

```jsonc
// WorkspaceResponse: the workspace as the caller sees it, with the caller's role
{ "id": 3, "name": "Acme Engineering", "slug": "acme-engineering",
  "role": "WORKSPACE_ADMIN", "archivedAt": null }   // archivedAt: ISO instant once archived

// WorkspaceMemberResponse
{ "userId": 7, "firstName": "Ada", "lastName": "Lovelace", "email": "ada@example.com", "role": "WORKSPACE_MEMBER" }

// InvitationsSentResponse
{ "invited": ["grace@example.com"], "alreadyMembers": ["ada@example.com"] }

// InvitationLookupResponse
{ "workspaceName": "Acme Engineering", "email": "grace@example.com" }
```

- `GET /workspaces` is sorted by name, **not paginated**, and **includes archived** workspaces. Use `archivedAt` to show them separately.
- Members list: `q` matches first name, last name or email. Sorted by first name, then last name.
- The slug never changes, even after a rename. The API always uses the numeric id.

## Flows

**Opening workspaces.** After login, call `GET /workspaces`. To open one, call `GET /workspaces/{id}` (and the members list). Show admin controls only when `role === "WORKSPACE_ADMIN"` (`isWorkspaceAdmin` in [utils/workspace.js](../src/utils/workspace.js)). A `404` means the workspace is gone or the user was never in it, so send them back to the list.

**Archive / restore / delete.**
- **Archive** sets `archivedAt`. It's idempotent (`200` again). Everything stays readable; every change gets `409 WORKSPACE_ARCHIVED`.
- **Restore** clears `archivedAt` (idempotent).
- **Delete** only works on an archived workspace, otherwise `409 WORKSPACE_NOT_ARCHIVED`. It removes everything inside and can't be undone. Confirm first, e.g. by typing the workspace name. There's no waiting period.

**Inviting** (admin, active workspace).
- Addresses that are already members are skipped and returned in `alreadyMembers`.
- Each other address gets a new 7-day invitation, which replaces any older link for that address.
- The email links to `/accept-invite?token=...` (`INVITE_PATH`). The address doesn't need an account yet.
- If any email fails to send, nothing is kept (`503`). The admin retries the whole list.

### Accepting an invitation

Page at `/accept-invite?token=...`: [AcceptInvitePage](../src/pages/workspace/AcceptInvitePage.jsx), a public route. While the invitee signs in or registers, the token waits in localStorage ([utils/invitation.js](../src/utils/invitation.js); not sessionStorage, because the verify-email link opens a new tab and Google sign-in is a full-page redirect), and `ProtectedRoute` sends them back to the page once they're logged in. The invited email is prefilled on login / register. A wrong account is caught before calling accept and offered a sign-out; joining is an explicit "Join workspace" click.
1. `POST /invitations/lookup { token }`, which works without login. `200` → show "Join {workspaceName}?" with the invited `email`. `404` → "This invitation has expired or was already used."
2. Check login (`GET /auth/me`, i.e. `useAuth().user`).
3. **Logged in with the invited email:** `POST /invitations/accept`. `200` returns the workspace (also when they were already a member), so open it.
4. **Logged in with another email:** `403`. Say the invite was for `email` and offer to log out.
5. **Not logged in:** keep the token (e.g. in `sessionStorage`), send them to login, or to register **with the invited email**, then come back and accept. Google sign-in also works if the Google account's email matches.
6. A link works once; afterwards lookup returns `404`. Accepting in an archived workspace gets `409 WORKSPACE_ARCHIVED`.

## Errors by endpoint

| Endpoint | Possible errors |
| --- | --- |
| `POST /workspaces` | 400 `VALIDATION_ERROR`, 401, 409 `CONFLICT` (slug race, retry) |
| `GET /workspaces` | 401 |
| `GET /workspaces/{id}`, `/members` | 401, 404 |
| `PATCH /workspaces/{id}` | 400, 401, 403, 404, 409 `WORKSPACE_ARCHIVED` |
| archive / restore | 401, 403, 404 |
| `DELETE /workspaces/{id}` | 401, 403, 404, 409 `WORKSPACE_NOT_ARCHIVED` |
| invitations | 400, 401, 403, 404, 409 `WORKSPACE_ARCHIVED`, 503 `SERVICE_UNAVAILABLE` |
| `/invitations/lookup` | 400, 404 |
| `/invitations/accept` | 400, 401, 403 (email mismatch), 404, 409 `WORKSPACE_ARCHIVED` |
