import test from "node:test";
import assert from "node:assert/strict";
import {
  parseWorkspaceId, isWorkspaceAdmin, isWorkspaceArchived, teamMemberLabel, errorMessage,
} from "../src/pages/teams/teamApiHelpers.js";

test("workspace IDs must be positive safe integers", () => {
  assert.equal(parseWorkspaceId("3"), 3);
  for (const value of ["", "0", "-1", "abc", "1.2", "9007199254740992", null]) assert.equal(parseWorkspaceId(value), null);
});
test("admin permission is workspace-specific", () => {
  assert.equal(isWorkspaceAdmin({ role: "WORKSPACE_ADMIN" }), true);
  assert.equal(isWorkspaceAdmin({ role: "WORKSPACE_MEMBER" }), false);
  assert.equal(isWorkspaceAdmin(null), false);
});
test("archived workspace is read-only", () => {
  assert.equal(isWorkspaceArchived({ archivedAt: "2026-10-22T01:00:00Z" }), true);
  assert.equal(isWorkspaceArchived({ archivedAt: null }), false);
});
test("member names use public profile fields", () => {
  assert.equal(teamMemberLabel({ userId: 9, firstName: "Ada", lastName: "Lovelace" }), "Ada Lovelace");
  assert.equal(teamMemberLabel({ userId: 9, email: "ada@example.com" }), "ada@example.com");
});
test("error handling uses codes, not brittle error-message matching", () => {
  assert.match(errorMessage({ response: { data: { code: "WORKSPACE_ARCHIVED" } } }), /archived/);
  assert.match(errorMessage({ response: { data: { code: "CONFLICT" } } }), /already exists/);
  assert.match(errorMessage({ response: { data: { code: "RESOURCE_NOT_FOUND" } } }), /unavailable/);
});
