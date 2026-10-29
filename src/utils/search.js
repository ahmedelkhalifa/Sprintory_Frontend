import { parseWorkspaceId, workspacePath } from "./workspace.js";
import { projectPath } from "./project.js";
import { taskPath } from "./task.js";

// Universal search (GET /search, backend docs/search-docs.md): the top bar's dropdown and the /search page.

// the kinds of results, in the order the dropdown groups them
export const SEARCH_TYPES = ["WORKSPACE", "PROJECT", "TEAM", "TASK"];

export const SEARCH_TYPE_LABEL = {
  WORKSPACE: { one: "Workspace", many: "Workspaces" },
  PROJECT: { one: "Project", many: "Projects" },
  TEAM: { one: "Team", many: "Teams" },
  TASK: { one: "Task", many: "Tasks" },
};

// one character matches nearly everything; the backend refuses more than 255
export const MIN_QUERY_LENGTH = 2;
const MAX_QUERY_LENGTH = 255;

// what to send as `q`: the trimmed text, or "" (no request) while it's too short
export const searchQuery = (text) => {
  const q = (text ?? "").trim().slice(0, MAX_QUERY_LENGTH);
  return q.length >= MIN_QUERY_LENGTH ? q : "";
};

// Where the search looks. A project scope finds only that project and its tasks (no workspaces or teams).
export const EVERYWHERE = { id: "everywhere", label: "All workspaces", params: {}, types: SEARCH_TYPES };

export const workspaceScope = (workspace) => ({
  id: `workspace-${workspace.id}`,
  label: workspace.name,
  params: { workspaceId: workspace.id },
  types: SEARCH_TYPES,
});

export const projectScope = (projectId) => ({
  id: `project-${projectId}`,
  label: "This project",
  params: { projectId },
  types: ["PROJECT", "TASK"],
});

// the scopes to offer: everywhere, the current workspace (if any), the project on screen (if any)
export const searchScopes = ({ workspace, projectId }) =>
  [EVERYWHERE, workspace && workspaceScope(workspace), projectId && projectScope(projectId)].filter(Boolean);

// the scope a /search url names; a workspace that isn't in the user's list still works (the backend just finds nothing)
export const scopeFromParams = (params, workspaces) => {
  const projectId = parseWorkspaceId(params.get("projectId"));
  if (projectId) return projectScope(projectId);
  const workspaceId = parseWorkspaceId(params.get("workspaceId"));
  if (!workspaceId) return EVERYWHERE;
  return workspaceScope(workspaces.find((w) => w.id === workspaceId) ?? { id: workspaceId, name: "This workspace" });
};

// the /search page url; `type` is one of SEARCH_TYPES or null for all, `page` 0-based
export const searchPagePath = ({ q, scope = EVERYWHERE, type = null, page = 0 }) => {
  const params = new URLSearchParams({ q });
  Object.entries(scope.params).forEach(([name, value]) => params.set(name, String(value)));
  if (type) params.set("type", type);
  if (page > 0) params.set("page", String(page));
  return `/search?${params}`;
};

// the frontend route of a result. The response's `path` is the API path, so the route is built from the ids;
// a workspace missing from the user's list (e.g. joined a moment ago) goes by its id, which the guard redirects
export const searchResultPath = (result, workspaces) => {
  const workspaceId = result.type === "WORKSPACE" ? result.id : result.workspaceId;
  const workspace = workspaces.find((w) => w.id === workspaceId) ?? { slug: String(workspaceId) };
  switch (result.type) {
    case "WORKSPACE":
      return workspacePath(workspace);
    case "PROJECT":
      return projectPath(workspace, { id: result.id });
    case "TEAM":
      return `${workspacePath(workspace)}/teams?team=${result.id}`;
    default:
      return taskPath(workspace, { id: result.projectId }, result.id);
  }
};

// results grouped by kind in SEARCH_TYPES order, keeping the backend's best-match order inside each group
export const groupResults = (results) =>
  SEARCH_TYPES.map((type) => ({ type, items: results.filter((result) => result.type === type) })).filter(
    (group) => group.items.length > 0,
  );

// `text` cut into pieces, `match` marking each place that contains `q` (ignoring case, taken literally)
export const highlightParts = (text, q) => {
  const needle = (q ?? "").trim().toLowerCase();
  const lower = text.toLowerCase();
  // some letters change length when lowercased; then the positions wouldn't line up, so mark nothing
  if (!needle || lower.length !== text.length) return [{ text, match: false }];

  const parts = [];
  let from = 0;
  for (let at = lower.indexOf(needle); at !== -1; at = lower.indexOf(needle, from)) {
    if (at > from) parts.push({ text: text.slice(from, at), match: false });
    parts.push({ text: text.slice(at, at + needle.length), match: true });
    from = at + needle.length;
  }
  if (from < text.length) parts.push({ text: text.slice(from), match: false });
  return parts;
};
