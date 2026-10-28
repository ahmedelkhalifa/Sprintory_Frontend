import test from "node:test";
import assert from "node:assert/strict";
import { errorMessage } from "../src/utils/apiError.js";
import {
  can,
  isProjectArchived,
  isProjectManager,
  parseProjectId,
  projectPath,
  projectRoleLabel,
  projectsPath,
  projectTabOf,
  projectTabPath,
  suggestProjectKey,
} from "../src/utils/project.js";
import { validateNewProject, validateProjectKey, validateProjectName } from "../src/utils/validation.js";

const apiError = (data) => ({ response: { status: 400, data } });

test("permissions come from the project response, never from role names", () => {
  const project = { roles: [], permissions: ["VIEW_PROJECT", "MANAGE_MEMBERS"] };
  assert.equal(can(project, "MANAGE_MEMBERS"), true);
  assert.equal(can(project, "EDIT_TASKS"), false);
  assert.equal(can({ roles: ["PROJECT_MANAGER"] }, "MANAGE_MEMBERS"), false);
  assert.equal(can(null, "MANAGE_MEMBERS"), false);
});

test("MEMBER is shown as Developer only in Scrum projects", () => {
  assert.equal(projectRoleLabel("MEMBER", "SCRUM"), "Developer");
  assert.equal(projectRoleLabel("MEMBER", "KANBAN"), "Member");
  assert.equal(projectRoleLabel("PROJECT_MANAGER", "KANBAN"), "Project Manager");
  assert.equal(projectRoleLabel("SOMETHING_NEW", "SCRUM"), "SOMETHING_NEW");
});

test("project managers are found by their roles", () => {
  assert.equal(isProjectManager({ roles: ["MEMBER", "PROJECT_MANAGER"] }), true);
  assert.equal(isProjectManager({ roles: ["MEMBER"] }), false);
  assert.equal(isProjectManager({}), false);
});

test("a project without a status counts as active", () => {
  assert.equal(isProjectArchived({ status: "ARCHIVED" }), true);
  assert.equal(isProjectArchived({ status: "ACTIVE" }), false);
  assert.equal(isProjectArchived({}), false);
});

test("project urls live under their workspace", () => {
  const workspace = { id: 3, slug: "acme-engineering" };
  assert.equal(projectsPath(workspace), "/workspaces/acme-engineering/projects");
  assert.equal(projectPath(workspace, { id: 21, workspaceId: 3 }), "/workspaces/acme-engineering/projects/21");
  assert.equal(projectTabPath(workspace, { id: 21 }, "overview"), "/workspaces/acme-engineering/projects/21");
  assert.equal(projectTabPath(workspace, { id: 21 }, "board"), "/workspaces/acme-engineering/projects/21/board");
  assert.equal(parseProjectId("21"), 21);
  assert.equal(parseProjectId("abc"), null);
});

test("the project tab is read from the url segment after the project", () => {
  const base = "/workspaces/acme/projects/21";
  assert.equal(projectTabOf(base, base), "overview");
  assert.equal(projectTabOf(`${base}/`, base), "overview");
  assert.equal(projectTabOf(`${base}/members`, base), "members");
  assert.equal(projectTabOf(`${base}/board/extra`, base), "board");
});

test("project names are required and at most 100 characters", () => {
  assert.equal(validateProjectName("Mobile App"), "");
  assert.notEqual(validateProjectName("   "), "");
  assert.notEqual(validateProjectName("x".repeat(101)), "");
  assert.equal(validateProjectName(` ${"x".repeat(100)} `), "");
});

test("a page's own texts win over the shared ones", () => {
  const err = apiError({ code: "BAD_REQUEST", message: "Team not found in this workspace." });
  assert.equal(errorMessage(err, undefined, { BAD_REQUEST: "This team no longer exists." }), "This team no longer exists.");
  assert.equal(errorMessage(err), "Team not found in this workspace.");
  assert.equal(
    errorMessage(apiError({ code: "ACCESS_DENIED" }), undefined, { ACCESS_DENIED: "Only Project Managers can do this." }),
    "Only Project Managers can do this.",
  );
});

test("project keys: 2 to 10 letters or digits, starting with a letter", () => {
  assert.equal(validateProjectKey("MOB"), "");
  assert.equal(validateProjectKey("pmp2"), "");
  assert.equal(validateProjectKey(" MA "), "");
  assert.notEqual(validateProjectKey(""), "");
  assert.notEqual(validateProjectKey("M"), "");
  assert.notEqual(validateProjectKey("2MOB"), "");
  assert.notEqual(validateProjectKey("MO-B"), "");
  assert.notEqual(validateProjectKey("A".repeat(11)), "");
  assert.deepEqual(Object.keys(validateNewProject({ name: "", key: "" })).sort(), ["key", "name"]);
  assert.deepEqual(validateNewProject({ name: "Mobile App", key: "MA" }), {});
});

test("suggestProjectKey uses initials, or the start of a single word", () => {
  assert.equal(suggestProjectKey("Mobile App"), "MA");
  assert.equal(suggestProjectKey("Website"), "WEB");
  assert.equal(suggestProjectKey("the new mobile app v2"), "TNMAV");
  assert.equal(suggestProjectKey("2026 Launch Plan"), "LP");
  assert.equal(suggestProjectKey("R&D / Ops"), "RDO");
  assert.equal(suggestProjectKey("A"), "");
  assert.equal(suggestProjectKey("   "), "");
});
