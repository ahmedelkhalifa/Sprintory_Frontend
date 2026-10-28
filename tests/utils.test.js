import test from "node:test";
import assert from "node:assert/strict";
import { errorCode, errorMessage, isAbort } from "../src/utils/apiError.js";
import { initials, memberLabel } from "../src/utils/people.js";
import {
  findWorkspace,
  isWorkspaceAdmin,
  isWorkspaceArchived,
  parseWorkspaceId,
  workspacePath,
} from "../src/utils/workspace.js";
import { validateResetPassword } from "../src/utils/validation.js";
import { invitePath, sameEmail } from "../src/utils/invitation.js";

const apiError = (data) => ({ response: { status: 400, data } });

test("workspace ids from the url must be positive safe integers", () => {
  assert.equal(parseWorkspaceId("3"), 3);
  for (const value of ["", "0", "-1", "abc", "1.2", "9007199254740992", null, undefined]) {
    assert.equal(parseWorkspaceId(value), null);
  }
});

test("workspace urls use the slug; old id links are still found", () => {
  const acme = { id: 3, slug: "acme" };
  // a slug can look like a number, and then it wins over another workspace's id
  const numeric = { id: 9, slug: "3" };
  assert.equal(workspacePath(acme), "/workspaces/acme");
  assert.deepEqual(findWorkspace([acme], "acme"), { workspace: acme, bySlug: true });
  assert.deepEqual(findWorkspace([acme], "3"), { workspace: acme, bySlug: false });
  assert.deepEqual(findWorkspace([acme, numeric], "3"), { workspace: numeric, bySlug: true });
  assert.deepEqual(findWorkspace([acme], "other"), { workspace: null, bySlug: false });
  assert.deepEqual(findWorkspace([acme], undefined), { workspace: null, bySlug: false });
});

test("admin and archived checks read the workspace response", () => {
  assert.equal(isWorkspaceAdmin({ role: "WORKSPACE_ADMIN" }), true);
  assert.equal(isWorkspaceAdmin({ role: "WORKSPACE_MEMBER" }), false);
  assert.equal(isWorkspaceAdmin(null), false);
  assert.equal(isWorkspaceArchived({ archivedAt: "2026-10-22T01:00:00Z" }), true);
  assert.equal(isWorkspaceArchived({ archivedAt: null }), false);
});

test("member labels fall back from name to email to id", () => {
  assert.equal(memberLabel({ userId: 9, firstName: "Ada", lastName: "Lovelace" }), "Ada Lovelace");
  assert.equal(memberLabel({ userId: 9, email: "ada@example.com" }), "ada@example.com");
  assert.equal(memberLabel({ userId: 9 }), "User 9");
});

test("initials use two words, or the first two letters of one", () => {
  assert.equal(initials("Ada Lovelace"), "AL");
  assert.equal(initials("Backend"), "BA");
  assert.equal(initials("ada@example.com"), "AE");
  assert.equal(initials(""), "");
});

test("errors branch on the code, and fall back to the backend message", () => {
  assert.equal(errorCode({}), "NETWORK_ERROR");
  assert.equal(errorMessage({}), "Can't reach the server.");
  assert.equal(errorMessage(apiError({ code: "CONFLICT", message: "That value is already in use." })), "That name is already in use.");
  assert.equal(
    errorMessage(apiError({ code: "WORKSPACE_ARCHIVED", message: "This workspace is archived." })),
    "This workspace is archived.",
  );
  // a response without the standard error body (e.g. a proxy error page)
  assert.equal(errorMessage({ response: { status: 502, data: "<html>" } }, "Fallback"), "Fallback");
});

test("cancelled requests are recognised", () => {
  assert.equal(isAbort({ code: "ERR_CANCELED" }), true);
  assert.equal(isAbort(apiError({ code: "CONFLICT" })), false);
});

test("invitation emails compare like the server stores them", () => {
  assert.equal(sameEmail("Grace@Example.com ", "grace@example.com"), true);
  assert.equal(sameEmail("ada@example.com", "grace@example.com"), false);
  assert.equal(sameEmail(undefined, "grace@example.com"), false);
  assert.equal(sameEmail("", ""), false);
});

test("invite paths keep the token intact", () => {
  assert.equal(invitePath("abc-_123"), "/accept-invite?token=abc-_123");
  assert.equal(invitePath("a+b/c="), "/accept-invite?token=a%2Bb%2Fc%3D");
});

test("reset password validation uses the backend field names", () => {
  assert.deepEqual(validateResetPassword({ newPassword: "longenough", confirmPassword: "longenough" }), {});
  assert.deepEqual(Object.keys(validateResetPassword({ newPassword: "short", confirmPassword: "other" })), [
    "newPassword",
    "confirmPassword",
  ]);
});
