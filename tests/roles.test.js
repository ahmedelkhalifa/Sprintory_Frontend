import test from "node:test";
import assert from "node:assert/strict";
import { PROJECT_ERROR_MESSAGES, ROLE_MESSAGES } from "../src/constants/projects.js";
import { WORKSPACE_ERROR_MESSAGES } from "../src/constants/workspaces.js";
import {
  can,
  projectRoleLabel,
  projectRoleOptions,
  sameRoles,
  sortProjectRoles,
  toggleProjectRole,
  validateProjectRoles,
} from "../src/utils/project.js";
import { errorMessage } from "../src/utils/apiError.js";

const apiError = (data) => ({ response: { status: 409, data } });

test("a Scrum project offers all five roles, Developer instead of Member", () => {
  const options = projectRoleOptions("SCRUM");
  assert.deepEqual(options, ["PROJECT_MANAGER", "PRODUCT_OWNER", "SCRUM_MASTER", "MEMBER", "VIEWER"]);
  assert.equal(projectRoleLabel("MEMBER", "SCRUM"), "Developer");
});

test("a Kanban project offers only Project Manager, Member and Viewer", () => {
  assert.deepEqual(projectRoleOptions("KANBAN"), ["PROJECT_MANAGER", "MEMBER", "VIEWER"]);
  assert.equal(projectRoleLabel("MEMBER", "KANBAN"), "Member");
  assert.deepEqual(projectRoleOptions("SOMETHING"), []);
});

test("roles can be combined and are kept in picker order", () => {
  let roles = ["MEMBER"];
  roles = toggleProjectRole(roles, "SCRUM_MASTER", "SCRUM");
  roles = toggleProjectRole(roles, "PRODUCT_OWNER", "SCRUM");
  assert.deepEqual(roles, ["PRODUCT_OWNER", "SCRUM_MASTER", "MEMBER"]);
  assert.deepEqual(toggleProjectRole(roles, "SCRUM_MASTER", "SCRUM"), ["PRODUCT_OWNER", "MEMBER"]);
});

test("Viewer is exclusive in both directions", () => {
  assert.deepEqual(toggleProjectRole(["MEMBER", "SCRUM_MASTER"], "VIEWER", "SCRUM"), ["VIEWER"]);
  assert.deepEqual(toggleProjectRole(["VIEWER"], "MEMBER", "SCRUM"), ["MEMBER"]);
});

test("unticking the last role gives an empty set, which is refused with the spec text", () => {
  const roles = toggleProjectRole(["MEMBER"], "MEMBER", "KANBAN");
  assert.deepEqual(roles, []);
  assert.equal(validateProjectRoles(roles, "KANBAN"), "A member must have at least one role.");
  assert.equal(ROLE_MESSAGES.EMPTY, "A member must have at least one role.");
});

test("a role set is valid only if the template offers every role and Viewer stands alone", () => {
  assert.equal(validateProjectRoles(["PROJECT_MANAGER", "MEMBER"], "KANBAN"), "");
  assert.equal(validateProjectRoles(["PRODUCT_OWNER", "SCRUM_MASTER"], "SCRUM"), "");
  assert.equal(validateProjectRoles(["VIEWER"], "SCRUM"), "");
  assert.match(validateProjectRoles(["VIEWER", "MEMBER"], "SCRUM"), /Viewer/);
  assert.equal(validateProjectRoles(["SCRUM_MASTER"], "KANBAN"), "Scrum Master is not available in this project.");
});

test("roles from the API are sorted and compared without caring about order", () => {
  assert.deepEqual(sortProjectRoles(["MEMBER", "PROJECT_MANAGER"], "KANBAN"), ["PROJECT_MANAGER", "MEMBER"]);
  assert.equal(sameRoles(["MEMBER", "PROJECT_MANAGER"], ["PROJECT_MANAGER", "MEMBER"]), true);
  assert.equal(sameRoles(["MEMBER"], ["MEMBER", "VIEWER"]), false);
});

test("refused role changes show the texts the spec asks for", () => {
  assert.equal(
    errorMessage(apiError({ code: "LAST_PROJECT_MANAGER", message: "x" }), undefined, PROJECT_ERROR_MESSAGES),
    "A project must have at least one Project Manager. Make someone else Project Manager first.",
  );
  assert.equal(
    errorMessage(apiError({ code: "LAST_WORKSPACE_ADMIN", message: "x" }), undefined, WORKSPACE_ERROR_MESSAGES),
    "A workspace must have at least one admin.",
  );
  assert.equal(
    errorMessage(apiError({ code: "ACCESS_DENIED", message: "x" }), undefined, PROJECT_ERROR_MESSAGES),
    "You don't have permission to do this.",
  );
  // INVALID_PROJECT_ROLES shows the backend's own message, which names the broken rule
  assert.equal(
    errorMessage(
      apiError({ code: "INVALID_PROJECT_ROLES", message: "A member must have at least one role." }),
      undefined,
      PROJECT_ERROR_MESSAGES,
    ),
    "A member must have at least one role.",
  );
});

test("what a role may do is decided by the permissions on the project response", () => {
  const scrumMaster = { permissions: ["VIEW_PROJECT", "VIEW_WORK", "MANAGE_SPRINTS", "EDIT_TASKS"] };
  const viewer = { permissions: ["VIEW_PROJECT", "VIEW_WORK"] };
  const developer = { permissions: ["VIEW_PROJECT", "VIEW_WORK", "EDIT_TASKS"] };
  assert.equal(can(scrumMaster, "MANAGE_SPRINTS"), true);
  assert.equal(can(viewer, "EDIT_TASKS"), false);
  assert.equal(can(developer, "MANAGE_SPRINTS"), false);
  assert.equal(can(developer, "MANAGE_ROLES"), false);
});
