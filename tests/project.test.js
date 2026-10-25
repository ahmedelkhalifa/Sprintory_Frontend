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
} from "../src/utils/project.js";
import { validateProjectName } from "../src/utils/validation.js";

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
  assert.equal(projectsPath(3), "/workspaces/3/projects");
  assert.equal(projectPath({ id: 21, workspaceId: 3 }), "/workspaces/3/projects/21");
  assert.equal(parseProjectId("21"), 21);
  assert.equal(parseProjectId("abc"), null);
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
