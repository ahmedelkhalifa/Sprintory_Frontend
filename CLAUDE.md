# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Vite dev server on http://localhost:5173 (must match the backend's `FRONTEND_URL`, or CORS/cookies fail)
- `npm run lint` — ESLint (flat config, `react-hooks` + `react-refresh` rules)
- `npm test` — unit tests for the pure helpers in `src/utils/` with Node's built-in runner (`node --test`, files in [tests/](tests/))
- `npm run build` — production build
- `npm run preview` — serve the built `dist/`

There are no component tests. CI ([.github/workflows/ci.yml](.github/workflows/ci.yml)) runs `npm ci`, `npm run lint`, `npm test`, `npm run build` on Node 24 for PRs and pushes to `main`; all must pass.

## Environment

Copy [.env.example](.env.example) to `.env` (gitignored):
- `VITE_API_URL` — backend base URL including the version prefix, e.g. `http://localhost:8080/api/v1`. API paths in code are relative to it (`/auth/register`).
- `VITE_SKIP_AUTH=true` (put it in `.env.local`) — TEMP dev bypass: `AuthProvider` skips `/auth/me` and uses a fake user so protected routes render without a backend.

## Stack

React 19 + Vite, plain JavaScript (`.jsx`, no TypeScript), MUI v9 with Emotion, React Router v7 (`BrowserRouter` / `<Routes>`, not the data router), axios.

## Architecture

**Backend contract.** The Spring backend (separate repo, `../sprintory_backend`, full docs in its `docs/`) owns every `/api/v1` contract. Frontend-focused summaries of the workspace, team, project and role contracts, plus a list of where the frontend is still behind them, are in [dev-docs/](dev-docs/) (start at [dev-docs/README.md](dev-docs/README.md)); read the relevant one before touching those API modules or pages, and update it when the backend doc changes. Auth: everything under `/api/v1/auth`, JSON in camelCase, errors shaped `{ status, code, message, path, fieldErrors? }`. Branch on `err.response.data.code` (`VALIDATION_ERROR`, `CONFLICT`, `PROVIDER_MISMATCH`, `INVALID_TOKEN`, `AUTHENTICATION_ERROR`, ...), never on `message`; messages are safe to display. `VALIDATION_ERROR` carries `fieldErrors` as `{ field: message }`, which maps straight onto form `errors` state.

**Auth is cookie-based.** Access and refresh tokens live in HttpOnly cookies set by the backend; the frontend never reads or stores tokens. Login state is known only through `GET /auth/me`.
- [src/api/client.js](src/api/client.js) — the single axios instance (`withCredentials: true`). Its response interceptor does a single-flight `POST /auth/refresh` on `401` with code `AUTHENTICATION_ERROR` and retries once; other 401s (e.g. `INVALID_TOKEN` from email links) pass through to the caller. Endpoints in `AUTH_PATHS` are never refreshed. On refresh failure it fires `AUTH_EXPIRED_EVENT` (except for `/auth/me`); `AuthProvider` clears the user and `ProtectedRoute` redirects, so the destination survives the login.
- [src/context/AuthProvider.jsx](src/context/AuthProvider.jsx) — calls `/auth/me` on mount and exposes `{ user, setUser, loading, logout }` through `useAuth()` ([AuthContext.js](src/context/AuthContext.js)).
- [src/components/general/ProtectedRoute.jsx](src/components/general/ProtectedRoute.jsx) — layout route in [App.jsx](src/App.jsx); everything nested under it requires a user and redirects to `/login` with `state.from`.

**Registration flow:** `/register` → `POST /auth/register` (no cookies, not logged in) → `/activate-account` ("check your inbox", email passed via router state) → user opens the emailed link `/verify-email?token=...` → `POST /auth/verify-email` once (guarded with a `useRef` because the token is single-use and StrictMode double-runs effects) → `/login` with `state.verified`. Re-registering an unverified email is how a user gets a new link; there is no resend endpoint. Google sign-in is a full-page navigation to `{backend origin}/oauth2/authorization/google`, outside `/api/v1`.

**Password reset:** `/reset-password` (linked from the login form) → `POST /auth/forgot-password`, which always answers `202` so the page never claims an email was sent → the emailed link opens `/reset-password?token=...` → `POST /auth/reset-password { token, newPassword }` → `/login` with `state.passwordReset`. `INVALID_TOKEN` means the link expired or was used.

**Invitations:** the emailed link opens the public `/accept-invite?token=...` ([AcceptInvitePage](src/pages/workspace/AcceptInvitePage.jsx)) → `POST /invitations/lookup` (no login) shows the workspace and invited email → signed in with that email: "Join workspace" → `POST /invitations/accept` → the workspace. Signed out: the token is kept in localStorage ([utils/invitation.js](src/utils/invitation.js)) and the user goes to login / register with the email prefilled; `ProtectedRoute` sends them back to the page once logged in (this also covers register → verify → login and Google). Signed in with another email: offer to sign out.

**Workspaces.** Roles are per workspace (`WORKSPACE_ADMIN` / `WORKSPACE_MEMBER`, read from the workspace response's `role`); an archived workspace (`archivedAt` set) is read-only. Workspace pages live under `/workspaces/:workspaceId/...`.
- [src/components/general/ResourceAccessGuard.jsx](src/components/general/ResourceAccessGuard.jsx) — layout routes in [App.jsx](src/App.jsx): `WorkspaceAccessGuard` wraps every `/workspaces/:workspaceId/...` page and `ProjectAccessGuard` (nested inside it) every `.../projects/:projectId/...` page. They load the workspace / project first and show not found (404, also for invalid ids), a retry, or redirect a project opened under the wrong workspace; a page only renders once it's loaded and remounts when the id changes. Pages don't fetch it themselves: they read `{ workspace, reloadWorkspace }` / `{ project, reloadProject }` with `useWorkspaceAccess()` / `useProjectAccess()` from [hooks/useResourceAccess.js](src/hooks/useResourceAccess.js) and call the reload after a change. A new page under a workspace or project goes inside these routes.
- [src/context/WorkspaceProvider.jsx](src/context/WorkspaceProvider.jsx) — wraps `AppShell`; loads `GET /workspaces` and exposes `{ workspaces, loading, error, current, currentId }` through `useWorkspaces()` ([WorkspaceContext.js](src/context/WorkspaceContext.js)). The current workspace is the one in the url, else the last one opened (localStorage). Sidebar links to workspace pages (e.g. Teams) are built from `currentId`.
- Mutations in [workspacesApi.js](src/api/workspacesApi.js) dispatch `WORKSPACES_CHANGED` and the provider reloads the list, so pages don't patch it by hand.
- Helpers: [utils/workspace.js](src/utils/workspace.js) (`isWorkspaceAdmin`, `isWorkspaceArchived`, `parseWorkspaceId`, `ROLE_LABEL`), [utils/people.js](src/utils/people.js) (`initials`, `memberLabel`), [utils/page.js](src/utils/page.js) (`EMPTY_PAGE` for paginated lists).

**Projects.** Pages at `/workspaces/:workspaceId/projects` and `/workspaces/:workspaceId/projects/:projectId` (`/projects` redirects to the current workspace's list). Show or hide controls with `can(project, permission)` from [utils/project.js](src/utils/project.js), using the caller's `permissions` on the project response, never role names; the same file has `projectRoleLabel` (MEMBER is "Developer" in Scrum), `projectPath` and `suggestProjectKey`. Creating takes name, key (2–10 letters/digits, unique in the workspace, `409 PROJECT_KEY_TAKEN`), template and an optional description; key and template never change, and editing (`PATCH`, `EDIT_SETTINGS`) covers name and description only. Archive / restore / delete and project `status` / `createdAt` are built against **assumed** endpoints listed in [dev-docs/projects.md](dev-docs/projects.md). The project pages use the hooks in [src/hooks/](src/hooks/): `useAsync` (load one thing), `usePagedList` (searchable PageResponse list) and `useSubmit` (a change plus its error text). Each passes an `AbortSignal` to the API call.

**Tasks, board, backlog and sprints.** Tasks ([tasksApi.js](src/api/tasksApi.js)) and the board (`getBoard` in projectsApi) are real; sprints are not in the backend yet, so [sprintsApi.js](src/api/sprintsApi.js) uses the in-browser mock [src/mocks/sprintsMock.js](src/mocks/sprintsMock.js) unless `VITE_MOCK_SPRINTS=false` (localStorage, real project permissions). Summary and the **assumed** sprint contract in [dev-docs/tasks.md](dev-docs/tasks.md). A task's status is a board column (`statusId`); "done" is the last column (assumed). The Scrum-only Backlog tab is in [src/components/backlog/](src/components/backlog/), the Board tab (Scrum: active sprint + Complete sprint; Kanban: all tasks, WIP limits; columns read-only) in [src/components/board/](src/components/board/), and what both share (`TaskDrawer`, `QuickAddTask`, `loadWork`, dnd ids) in [src/components/tasks/](src/components/tasks/). Each tab owns its data, drags with `@dnd-kit` and applies moves optimistically. Values in [constants/tasks.js](src/constants/tasks.js); pure helpers in [utils/task.js](src/utils/task.js) (`backlogView`, `moveInBacklog`, `taskChanges`, `describeTasks`, `movePermission`, ...) and [utils/board.js](src/utils/board.js). Moves use the backend's `afterTaskId` (null = first). Permissions: ranking the backlog `MANAGE_BACKLOG`, anything with a sprint `MANAGE_SPRINTS`, task edits and every board move `EDIT_TASKS`. `/workspaces/:id/projects/:id/tasks/:taskId` is a placeholder for the task page.

**API modules.** One file per backend area in [src/api/](src/api/), named `<area>Api.js` (`authApi`, `workspacesApi`, `teamsApi`, `projectsApi`, `tasksApi`, `sprintsApi`), each importing the shared `api` client and returning `res.data`. Don't redefine an endpoint in another area's file. List/get functions take an optional `AbortSignal` last; effects pass one and abort in their cleanup so a stale response never lands. For error text outside the auth forms use `errorMessage(err, fallback, overrides?)` (overrides are a page's own texts by code) / `isAbort(err)` from [utils/apiError.js](src/utils/apiError.js).

**Pages vs. components.** `src/pages/<area>/` holds route-level components that compose a layout and a card/form, e.g. `RegisterPage` = `AuthLayout` → `AuthCard` → `RegisterForm`. Form logic and page pieces live in `src/components/<area>/` (`auth`, `projects`, `teams`, `workspace`; shared pieces like `LoadState`, `Pager`, `ConfirmDialog` in `general`); reusable inputs (`FormField`, `PasswordField`) in `src/components/forms/`. Validation helpers in [src/utils/validation.js](src/utils/validation.js) return `{ field: message }` with only the invalid fields, so the same object works for both client and server errors.

**Styling.** Use MUI components with `sx` and theme tokens from [src/theme/theme.js](src/theme/theme.js) (custom palette keys `navActive`, `ai`; buttons are not uppercased). For short viewports use the `SHORT_SCREEN` media-query key from [src/theme/media.js](src/theme/media.js) inside `sx`. `AuthLayout` is exactly one screen tall; only the form column scrolls.

## Conventions

- Functional components as `const X = () => {}` with `export default X`, 2-space indent, double quotes, semicolons.
- MUI: use `slotProps` (`slotProps={{ input: ... }}`, `slotProps={{ paper: ... }}`), not the deprecated `InputProps` / `PaperProps` / `inputProps` / `primaryTypographyProps`.
- Short lowercase comments explaining *why*.
- Git: feature branches named like `pages/register-page`, `setup/skeleton-app`; PRs into `main`.
