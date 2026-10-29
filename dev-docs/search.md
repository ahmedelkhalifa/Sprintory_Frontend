# Universal search (real)

Backend: `sprintory_backend/docs/search-docs.md`. Frontend: [searchApi.js](../src/api/searchApi.js) (`search`),
[utils/search.js](../src/utils/search.js), [components/search/](../src/components/search/),
[SearchPage](../src/pages/search/SearchPage.jsx).

## Contract

`GET /search?q=&types=&workspaceId=&projectId=&page=&size=` → `PageResponse<UniversalSearchResult>`

| Param | Rules |
| --- | --- |
| `q` | required, trimmed, 1–255 chars, case-insensitive "contains" (`%` / `_` literal). We send it from 2 chars (`searchQuery`). |
| `types` | comma list of `WORKSPACE`, `PROJECT`, `TEAM`, `TASK`; default all |
| `workspaceId` | that workspace and everything in it |
| `projectId` | that project and its tasks only (no workspaces, no teams) |
| `page`, `size` | as everywhere (size ≤ 100) |

Result: `{ type, id, title, subtitle, path, workspaceId, projectId, taskKey }`. `subtitle` is the workspace name
(project, team), `KEY · project name` (task) or `null` (workspace). `path` is the **API** path; the frontend builds its
own route from `type` and the ids (`searchResultPath`).

- Matches names, titles and keys (projects `MOB`, tasks `MOB-42`); not descriptions, labels or people.
- Order: exact match, then prefix, then contains; inside each, by name, kind, id. Pages never overlap.
- Only what the caller can see. Tasks only from projects the caller is a member of, **even for a workspace admin**.
  Archived workspaces are searched too. A scope the caller can't see is an empty page, never an error.
- Errors: `400 BAD_REQUEST` (q missing / blank / too long, bad `types`, id ≤ 0), `401`.

## In the frontend

- **Top bar** ([GlobalSearch](../src/components/search/GlobalSearch.jsx), in `AppShell`): waits 300 ms, then asks for
  10 hits and shows them grouped by kind (`groupResults`), matched text in bold (`highlightParts`), then
  "See all N results". Enter on the text opens the results page. Ctrl/⌘+K or "/" (outside a text field) focuses it.
  On phones it's a search button that opens the field over the whole top bar (back button or Esc closes it).
- **Scope** ([useSearchScope](../src/hooks/useSearchScope.js)): the current workspace by default (also on a project
  page), else everywhere. Picked with chips at the top of the dropdown (All workspaces / the workspace / This project
  on a project page); the results page uses [ScopeMenu](../src/components/search/ScopeMenu.jsx). Opening another
  workspace or project goes back to the default. With no hits in a scope, the dropdown offers "Search all workspaces".
- **Results page** `/search?q=&workspaceId=|projectId=&type=&page=`: all state in the url; tabs per kind (`types`
  with one value), 20 per page.
- **Where a hit goes:** workspace → its page, project → its Overview, team → `/workspaces/<slug>/teams?team=<id>`
  (TeamsPage selects it, also when it isn't on the loaded page, and drops the param), task → the task page
  (`taskPath`). A workspace not in the user's list yet is linked by id; the guard redirects to the slug.
