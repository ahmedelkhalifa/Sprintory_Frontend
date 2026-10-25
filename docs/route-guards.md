# Protected workspace and project routes

The app uses two layers of client-side guards:

- `ProtectedRoute` checks the login session with `AuthProvider`. Anonymous visitors are redirected to `/login` with the original URL (including search and hash) in router state. A successful email login returns them to that URL. An expired session after failed token refresh also clears auth state so the same redirect applies.
- `WorkspaceAccessGuard` and `ProjectAccessGuard` wait for private-resource API responses before rendering their child pages. They use `GET /api/v1/workspaces/{workspaceId}` and `GET /api/v1/projects/{projectId}`. A 403/404 yields a non-disclosing denial, a 401 redirects to login, and network/server failures allow retry without granting access. Invalid IDs are rejected locally. Backend authorization remains mandatory.

Guarded URLs:

- `/workspaces/:workspaceId` and `/workspaces/:workspaceId/teams`
- `/teams?workspaceId=<id>` when an ID is supplied (`/teams` without an ID still shows the workspace-selection message)
- `/projects/:projectId` and `/workspaces/:workspaceId/projects/:projectId`

The repository does **not** yet contain a project-details UI; those URLs intentionally render a placeholder **after** an API access check. `/projects` itself is an authenticated shell placeholder and `/workspaces` lists only the signed-in user's workspaces.

## Manual checks

Set `VITE_SKIP_AUTH=false` (or omit it) and point `VITE_API_URL` to the running backend. Test:

1. Signed out: navigate directly to `/workspaces/3/teams` or `/projects/21?tab=board`; confirm redirect to login and return to that URL after signing in.
2. Signed in, nonmember: open a foreign workspace or project ID; confirm no protected content renders and no distinction is exposed between nonexistent and private resources.
3. Signed in, member: open allowed workspace and project URLs; confirm the workspace page loads and the project placeholder appears.
4. Change an ID while a request is in flight: confirm the previous resource content does not flash.
5. Block the API temporarily: confirm a retryable error, not a fabricated denial or access grant.
6. Expire the access and refresh cookies: confirm the login redirect preserves the requested URL.

Unit tests: `node --test tests/routeAccess.test.mjs tests/teamsApiHelpers.test.mjs`.
Run `npm ci && npm run lint && npm run build` before pushing.
