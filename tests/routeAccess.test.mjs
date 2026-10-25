import test from "node:test";
import assert from "node:assert/strict";
import { accessFailure, matchesWorkspace, validResourceId } from "../src/utils/routeAccess.js";

test("workspace and project IDs are positive safe integers", () => {
  for (const id of ["1", "123", "9007199254740991"]) assert.equal(validResourceId(id), true);
  for (const id of [undefined, null, "", "0", "-1", "1.5", "1a", "01", "9007199254740992", "NaN"]) {
    assert.equal(validResourceId(id), false, `rejected: ${id}`);
  }
});

test("unauthenticated resource checks require login", () => {
  assert.equal(accessFailure({ response: { status: 401 } }), "login");
});

test("inaccessible resources fail closed without leaking whether they exist", () => {
  for (const status of [403, 404]) assert.equal(accessFailure({ response: { status } }), "denied");
});

test("network and server failures remain retryable rather than being treated as access denied", () => {
  assert.equal(accessFailure(new Error("Network Error")), "unavailable");
  assert.equal(accessFailure({ response: { status: 503 } }), "unavailable");
});

test("nested project routes must match the workspace in the project response", () => {
  assert.equal(matchesWorkspace({ workspaceId: 3 }, "3"), true);
  assert.equal(matchesWorkspace({ workspaceId: 4 }, "3"), false);
  assert.equal(matchesWorkspace({ workspaceId: 3 }, "invalid"), false);
  assert.equal(matchesWorkspace({ workspaceId: 3 }, undefined), true);
});
