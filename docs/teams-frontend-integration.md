# Teams frontend integration — R02

Source of truth: backend `docs/teams-docs.md` (23 October 2026).

## Implemented

- API requests go through `src/api/teamsApi.js` / `workspacesApi.js` and the shared `src/api/client.js` (cookies and refresh already handled there).
- Workspace-scoped team list, backend search (`q`), fixed sort and pagination (`page`/`size`).
- View a team's members; server-side member search and paginated loading.
- Workspace admins can create and rename teams and delete teams after confirmation.
- Workspace admins can add existing workspace members (up to 100 per request) and remove team memberships.
- Role and `archivedAt` control write actions in the UI; the server remains authoritative.
- Error codes `RESOURCE_NOT_FOUND`, `ACCESS_DENIED`, `CONFLICT`, `WORKSPACE_ARCHIVED`, etc. get their text from the shared `src/utils/apiError.js` (same text as the workspace pages).

## Explicit dependencies / limitations

- The page lives at `/workspaces/<id>/teams`. The sidebar "Teams" link points there for the current workspace (from `WorkspaceProvider`: the workspace in the url, else the last one opened); with no workspace it goes to `/workspaces` to pick one.
- Workspace role is read from `GET /api/v1/workspaces/{id}`; the workspace member picker calls `GET /api/v1/workspaces/{id}/members?q=&page=&size=` (both in `workspacesApi.js`). Fields match backend `workspaces-docs.md` (`role`, `archivedAt`, `WorkspaceMemberResponse`).
- `TeamResponse` contains only `id`, `workspaceId`, `name`. Team descriptions, per-team project assignments, invitation flows, and sortable team lists are **not** part of R02 and were removed from the preview.
- Team creation is initially empty; member addition happens as a separate request. Name uniqueness is case-sensitive on the server.
- `VITE_SKIP_AUTH=true` bypasses frontend route protection only. It does not authenticate API requests. Running against a real backend requires a login session cookie, a configured `VITE_API_URL`, and appropriate CORS credentials support.
- Back-end R02 unit/integration tests were marked pending in `teams-docs.md`; verify actual endpoint behavior before shipping.

## Manual checks

1. Visit `/workspaces/<id>/teams` while authenticated. Verify admin sees all teams, member sees only their teams, nonmember receives the unavailable message.
2. Search, page forward/back, open a team on desktop and mobile.
3. As admin in active workspace: create, rename, delete, add members, remove a member.
4. As member or in an archived workspace, verify write controls are absent and server rejects writes.
5. Verify 400/401/403/404/409 messages and long names at 320px mobile width.
