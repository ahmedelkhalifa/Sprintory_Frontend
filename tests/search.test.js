import test from "node:test";
import assert from "node:assert/strict";
import {
  EVERYWHERE,
  groupResults,
  highlightParts,
  projectScope,
  scopeFromParams,
  searchPagePath,
  searchQuery,
  searchResultPath,
  searchScopes,
  workspaceScope,
} from "../src/utils/search.js";

const workspaces = [{ id: 3, slug: "acme", name: "Acme" }];
const hit = (type, id, extra = {}) => ({ type, id, title: `${type} ${id}`, workspaceId: 3, projectId: null, ...extra });

test("searchQuery: trims, and waits for two characters", () => {
  assert.equal(searchQuery("  auth "), "auth");
  assert.equal(searchQuery("a"), "");
  assert.equal(searchQuery("   "), "");
  assert.equal(searchQuery(undefined), "");
  assert.equal(searchQuery("x".repeat(300)).length, 255);
});

test("searchResultPath: each kind goes to its own page, by the workspace slug", () => {
  assert.equal(searchResultPath(hit("WORKSPACE", 3, { workspaceId: null }), workspaces), "/workspaces/acme");
  assert.equal(searchResultPath(hit("PROJECT", 8, { projectId: 8 }), workspaces), "/workspaces/acme/projects/8");
  assert.equal(searchResultPath(hit("TEAM", 4), workspaces), "/workspaces/acme/teams?team=4");
  assert.equal(searchResultPath(hit("TASK", 55, { projectId: 8 }), workspaces), "/workspaces/acme/projects/8/tasks/55");
});

test("searchResultPath: a workspace not in the list goes by its id", () => {
  assert.equal(searchResultPath(hit("PROJECT", 8, { workspaceId: 9, projectId: 8 }), workspaces), "/workspaces/9/projects/8");
  assert.equal(searchResultPath(hit("WORKSPACE", 9), workspaces), "/workspaces/9");
});

test("groupResults: kinds in a fixed order, the backend's order inside each", () => {
  const results = [hit("TASK", 1), hit("TEAM", 2), hit("TASK", 3), hit("WORKSPACE", 4)];
  const groups = groupResults(results);
  assert.deepEqual(groups.map((g) => g.type), ["WORKSPACE", "TEAM", "TASK"]);
  assert.deepEqual(groups[2].items.map((r) => r.id), [1, 3]);
});

test("highlightParts: every match, ignoring case", () => {
  assert.deepEqual(highlightParts("Auth: fix auth", "AUTH"), [
    { text: "Auth", match: true },
    { text: ": fix ", match: false },
    { text: "auth", match: true },
  ]);
  assert.deepEqual(highlightParts("Login", "xy"), [{ text: "Login", match: false }]);
  assert.deepEqual(highlightParts("Login", " "), [{ text: "Login", match: false }]);
});

test("highlightParts: special characters are taken literally", () => {
  assert.deepEqual(highlightParts("50% done (v1.2)", "% done (v1."), [
    { text: "50", match: false },
    { text: "% done (v1.", match: true },
    { text: "2)", match: false },
  ]);
  assert.deepEqual(highlightParts("a_b", "_"), [
    { text: "a", match: false },
    { text: "_", match: true },
    { text: "b", match: false },
  ]);
});

test("scopes: workspace and project params, project hides workspaces and teams", () => {
  const scopes = searchScopes({ workspace: workspaces[0], projectId: 8 });
  assert.deepEqual(scopes.map((s) => s.params), [{}, { workspaceId: 3 }, { projectId: 8 }]);
  assert.deepEqual(projectScope(8).types, ["PROJECT", "TASK"]);
  assert.equal(searchScopes({ workspace: null, projectId: null }).length, 1);
});

test("scopeFromParams and searchPagePath round-trip", () => {
  const path = searchPagePath({ q: "fix auth", scope: workspaceScope(workspaces[0]), type: "TASK", page: 2 });
  assert.equal(path, "/search?q=fix+auth&workspaceId=3&type=TASK&page=2");
  const params = new URLSearchParams(path.split("?")[1]);
  assert.equal(scopeFromParams(params, workspaces).label, "Acme");
  assert.equal(scopeFromParams(new URLSearchParams("projectId=8"), workspaces).id, "project-8");
  assert.equal(scopeFromParams(new URLSearchParams("workspaceId=abc"), workspaces), EVERYWHERE);
  assert.equal(searchPagePath({ q: "x" }), "/search?q=x");
});
