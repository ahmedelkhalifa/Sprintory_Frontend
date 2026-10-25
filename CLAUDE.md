# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Vite dev server on http://localhost:5173 (must match the backend's `FRONTEND_URL`, or CORS/cookies fail)
- `npm run lint` — ESLint (flat config, `react-hooks` + `react-refresh` rules)
- `npm run build` — production build
- `npm run preview` — serve the built `dist/`

There is no test runner. CI ([.github/workflows/ci.yml](.github/workflows/ci.yml)) runs `npm ci`, `npm run lint`, `npm run build` on Node 24 for PRs and pushes to `main`; both must pass.

## Environment

Copy [.env.example](.env.example) to `.env` (gitignored):
- `VITE_API_URL` — backend base URL including the version prefix, e.g. `http://localhost:8080/api/v1`. API paths in code are relative to it (`/auth/register`).
- `VITE_SKIP_AUTH=true` (put it in `.env.local`) — TEMP dev bypass: `AuthProvider` skips `/auth/me` and uses a fake user so protected routes render without a backend.

## Stack

React 19 + Vite, plain JavaScript (`.jsx`, no TypeScript), MUI v9 with Emotion, React Router v7 (`BrowserRouter` / `<Routes>`, not the data router), axios.

## Architecture

**Backend contract.** The Spring backend (separate repo) owns the auth contract: everything under `/api/v1/auth`, JSON in camelCase, errors shaped `{ status, code, message, path, fieldErrors? }`. Branch on `err.response.data.code` (`VALIDATION_ERROR`, `CONFLICT`, `PROVIDER_MISMATCH`, `INVALID_TOKEN`, `AUTHENTICATION_ERROR`, ...), never on `message`; messages are safe to display. `VALIDATION_ERROR` carries `fieldErrors` as `{ field: message }`, which maps straight onto form `errors` state.

**Auth is cookie-based.** Access and refresh tokens live in HttpOnly cookies set by the backend; the frontend never reads or stores tokens. Login state is known only through `GET /auth/me`.
- [src/api/client.js](src/api/client.js) — the single axios instance (`withCredentials: true`). Its response interceptor does a single-flight `POST /auth/refresh` on `401` with code `AUTHENTICATION_ERROR` and retries once; other 401s (e.g. `INVALID_TOKEN` from email links) pass through to the caller. Endpoints in `AUTH_PATHS` are never refreshed. On refresh failure it hard-redirects to `/login` (except for `/auth/me`).
- [src/context/AuthProvider.jsx](src/context/AuthProvider.jsx) — calls `/auth/me` on mount and exposes `{ user, setUser, loading, logout }` through `useAuth()` ([AuthContext.js](src/context/AuthContext.js)).
- [src/components/general/ProtectedRoute.jsx](src/components/general/ProtectedRoute.jsx) — layout route in [App.jsx](src/App.jsx); everything nested under it requires a user and redirects to `/login` with `state.from`.

**Registration flow:** `/register` → `POST /auth/register` (no cookies, not logged in) → `/activate-account` ("check your inbox", email passed via router state) → user opens the emailed link `/verify-email?token=...` → `POST /auth/verify-email` once (guarded with a `useRef` because the token is single-use and StrictMode double-runs effects) → `/login` with `state.verified`. Re-registering an unverified email is how a user gets a new link; there is no resend endpoint. Google sign-in is a full-page navigation to `{backend origin}/oauth2/authorization/google`, outside `/api/v1`.

**API modules.** One file per backend area in [src/api/](src/api/) (see [authApi.js](src/api/authApi.js)), each importing the shared `api` client and returning `res.data`.

**Pages vs. components.** `src/pages/<area>/` holds route-level components that compose a layout and a card/form, e.g. `RegisterPage` = `AuthLayout` → `AuthCard` → `RegisterForm`. Form logic lives in `src/components/<area>/`; reusable inputs (`FormField`, `PasswordField`) in `src/components/forms/`. Validation helpers in [src/utils/validation.js](src/utils/validation.js) return `{ field: message }` with only the invalid fields, so the same object works for both client and server errors.

**Styling.** Use MUI components with `sx` and theme tokens from [src/theme/theme.js](src/theme/theme.js) (custom palette keys `navActive`, `ai`; buttons are not uppercased). For short viewports use the `SHORT_SCREEN` media-query key from [src/theme/media.js](src/theme/media.js) inside `sx`. `AuthLayout` is exactly one screen tall; only the form column scrolls.

## Conventions

- Functional components as `const X = () => {}` with `export default X`, double quotes, semicolons.
- Short lowercase comments explaining *why*.
- Git: feature branches named like `pages/register-page`, `setup/skeleton-app`; PRs into `main`.
