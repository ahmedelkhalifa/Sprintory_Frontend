import process from "node:process";
import test from "node:test";
import assert from "node:assert/strict";
import { AUDIT_ACTIONS, AUDIT_ACTION_GROUPS, AUDIT_ERROR_MESSAGES } from "../src/constants/audit.js";
import {
  EMPTY_AUDIT_FILTERS,
  actorLabel,
  auditActionLabel,
  auditQuery,
  dayRangeToInstants,
  filtersFromSearchParams,
  filtersToSearchParams,
  formatUtc,
  hasAuditFilters,
  truncateText,
  validateDayRange,
  visibleChanges,
} from "../src/utils/audit.js";
import { auditActors, auditQueryError, queryAuditEntries } from "../src/mocks/auditFilter.js";
import { errorMessage } from "../src/utils/apiError.js";

// the page's dates are local days: run in a fixed zone (UTC+3, no daylight saving) so the expected instants are exact
process.env.TZ = "Etc/GMT-3";

const entry = (id, occurredAt, extra = {}) => ({
  id,
  occurredAt,
  action: "PROJECT_ROLES_CHANGED",
  area: "PROJECT",
  actor: { id: 17, name: "Ada Lovelace", email: "ada@example.com" },
  target: { type: "USER", id: 23, name: "Linus Torvalds" },
  project: { id: 15, name: "Mobile App" },
  changes: [{ field: "roles", oldValue: "MEMBER", newValue: "PROJECT_MANAGER, MEMBER" }],
  ...extra,
});

test("every logged action belongs to an area and the filter lists each one once", () => {
  const listed = AUDIT_ACTION_GROUPS.flatMap((group) => group.actions);
  assert.deepEqual([...listed].sort(), Object.keys(AUDIT_ACTIONS).sort());
  assert.deepEqual(
    AUDIT_ACTION_GROUPS.map((group) => group.area),
    ["WORKSPACE", "TEAM", "PROJECT", "TASK", "SECURITY"],
  );
  assert.equal(AUDIT_ACTIONS.PROJECT_ROLES_CHANGED.area, "PROJECT");
});

test("an action the app doesn't know yet is still readable", () => {
  assert.equal(auditActionLabel("PROJECT_ROLES_CHANGED"), "Project roles changed");
  assert.equal(auditActionLabel("BOARD_COLUMN_MOVED"), "Board column moved");
});

test("the actor is the name stored in the entry; the system has none", () => {
  assert.equal(actorLabel(entry(1, "2026-11-02T14:05:31Z")), "Ada Lovelace");
  assert.equal(actorLabel(entry(2, "2026-11-02T14:05:31Z", { actor: null })), "System");
});

test("times are shown in UTC for the tooltip", () => {
  assert.equal(formatUtc("2026-11-02T14:05:31.218Z"), "2026-11-02 14:05:31 UTC");
  assert.equal(formatUtc("nonsense"), "");
  assert.equal(formatUtc(null), "");
});

test("local calendar days become the instants the backend expects, `to` being the start of the next day", () => {
  // the contract's example: "1 Nov - 2 Nov" in UTC+3
  assert.deepEqual(dayRangeToInstants("2026-11-01", "2026-11-02"), {
    from: "2026-10-31T21:00:00.000Z",
    to: "2026-11-02T21:00:00.000Z",
  });
  // one day only: from < to, so the backend accepts it
  assert.deepEqual(dayRangeToInstants("2026-11-02", "2026-11-02"), {
    from: "2026-11-01T21:00:00.000Z",
    to: "2026-11-02T21:00:00.000Z",
  });
  assert.deepEqual(dayRangeToInstants("", "2026-11-02"), { to: "2026-11-02T21:00:00.000Z" });
  assert.deepEqual(dayRangeToInstants("", ""), {});
  // month and year ends roll over correctly
  assert.equal(dayRangeToInstants("", "2026-12-31").to, "2026-12-31T21:00:00.000Z");
});

test("a date range that would make the backend answer 400 is refused first", () => {
  assert.equal(validateDayRange("2026-11-01", "2026-11-02"), "");
  assert.equal(validateDayRange("2026-11-02", "2026-11-02"), "");
  assert.equal(validateDayRange("", ""), "");
  assert.equal(validateDayRange("2026-11-03", "2026-11-02"), "The start date must not be after the end date.");
  assert.match(validateDayRange("2026-02-31", ""), /valid start date/);
  assert.match(validateDayRange("", "tomorrow"), /valid end date/);
});

test("the query leaves blank filters out and joins the actions", () => {
  assert.deepEqual(auditQuery(EMPTY_AUDIT_FILTERS), {});
  assert.deepEqual(
    auditQuery({
      from: "2026-11-01",
      to: "2026-11-02",
      actorId: "17",
      projectId: "15",
      actions: ["PROJECT_ROLES_CHANGED", "WORKSPACE_ROLE_CHANGED"],
    }),
    {
      from: "2026-10-31T21:00:00.000Z",
      to: "2026-11-02T21:00:00.000Z",
      actorId: "17",
      projectId: "15",
      actions: "PROJECT_ROLES_CHANGED,WORKSPACE_ROLE_CHANGED",
    },
  );
  assert.equal(hasAuditFilters(EMPTY_AUDIT_FILTERS), false);
  assert.equal(hasAuditFilters({ ...EMPTY_AUDIT_FILTERS, actions: ["TASK_DELETED"] }), true);
});

test("the filters survive a round trip through the page url", () => {
  const filters = { from: "2026-11-01", to: "2026-11-02", actorId: "17", projectId: "15", actions: ["TASK_DELETED", "TEAM_CREATED"] };
  const params = filtersToSearchParams(filters);
  assert.equal(params.toString(), "from=2026-11-01&to=2026-11-02&actor=17&project=15&actions=TASK_DELETED%2CTEAM_CREATED");
  assert.deepEqual(filtersFromSearchParams(params), filters);
  assert.equal(filtersToSearchParams(EMPTY_AUDIT_FILTERS).toString(), "");
});

test("a url with broken filters falls back to the whole log, it is user input", () => {
  const filters = filtersFromSearchParams(
    new URLSearchParams("from=soon&to=2026-11-02&actor=-5&project=abc&actions=NOPE,TASK_DELETED,TASK_DELETED"),
  );
  assert.deepEqual(filters, { from: "", to: "", actorId: "", projectId: "", actions: ["TASK_DELETED"] });
  // a reversed range is dropped too, so the backend never gets from > to
  assert.deepEqual(filtersFromSearchParams(new URLSearchParams("from=2026-11-05&to=2026-11-01")).from, "");
});

test("changes show roles by name and say whether something was added, removed or changed", () => {
  const changes = visibleChanges(
    entry(1, "2026-11-02T14:05:31Z", {
      changes: [
        { field: "roles", oldValue: "MEMBER", newValue: "PROJECT_MANAGER, MEMBER" },
        { field: "viaTeam", oldValue: null, newValue: "Backend" },
        { field: "role", oldValue: "WORKSPACE_MEMBER", newValue: null },
      ],
    }),
  );
  assert.deepEqual(
    changes.map(({ label, kind, oldText, newText }) => ({ label, kind, oldText, newText })),
    [
      { label: "Roles", kind: "changed", oldText: "Member", newText: "Project Manager, Member" },
      { label: "Via team", kind: "added", oldText: "", newText: "Backend" },
      { label: "Role", kind: "removed", oldText: "Member", newText: "" },
    ],
  );
  assert.deepEqual(visibleChanges(entry(2, "2026-11-02T14:05:31Z", { changes: [] })), []);
  assert.deepEqual(visibleChanges({}), []);
});

test("a change that looks like a password, token or link is never shown", () => {
  const changes = visibleChanges(
    entry(1, "2026-11-02T14:05:31Z", {
      action: "PASSWORD_RESET",
      changes: [
        { field: "password", oldValue: "old", newValue: "new" },
        { field: "resetToken", oldValue: null, newValue: "abc" },
        { field: "resetLink", oldValue: null, newValue: "http://x/reset?token=abc" },
        { field: "passwordHash", oldValue: "a", newValue: "b" },
        { field: "roles", oldValue: "MEMBER", newValue: "VIEWER" },
      ],
    }),
  );
  assert.deepEqual(changes.map((c) => c.label), ["Roles"]);
});

test("long values are cut for the table", () => {
  assert.deepEqual(truncateText("short"), { text: "short", truncated: false });
  const cut = truncateText("x".repeat(200));
  assert.equal(cut.truncated, true);
  assert.equal(cut.text.length, 60);
  assert.ok(cut.text.endsWith("…"));
});

test("only an admin's view has the log: a member's 403 reads as an admins-only message", () => {
  const forbidden = { response: { status: 403, data: { code: "ACCESS_DENIED", message: "You do not have access to this resource." } } };
  assert.equal(errorMessage(forbidden, undefined, AUDIT_ERROR_MESSAGES), "Only workspace admins can view the audit log.");
});

// ---- the mock's filtering follows audit-log-docs.md §3.1 ----

const LOG = [
  entry(1, "2026-11-01T10:00:00.000Z"),
  entry(2, "2026-11-02T10:00:00.000Z", { action: "TASK_DELETED", area: "TASK", target: { type: "TASK", id: 4, name: "MOB-4 Fix" }, changes: [] }),
  entry(3, "2026-11-02T10:00:00.000Z", { actor: { id: 31, name: "Grace Hopper", email: "grace@example.com" }, project: { id: 16, name: "Web" } }),
  entry(4, "2026-11-03T08:00:00.000Z", { action: "WORKSPACE_ROLE_CHANGED", area: "WORKSPACE", project: null }),
  entry(5, "2026-11-03T09:00:00.000Z", { action: "LOGIN_FAILED_REPEATED", area: "SECURITY", actor: null, project: null }),
];

test("the log comes newest first, ties by id descending", () => {
  assert.deepEqual(queryAuditEntries(LOG).content.map((e) => e.id), [5, 4, 3, 2, 1]);
});

test("filters combine with AND; actions and areas are OR inside; from is inclusive and to exclusive", () => {
  const ids = (query) => queryAuditEntries(LOG, query).content.map((e) => e.id);
  assert.deepEqual(ids({ from: "2026-11-02T10:00:00.000Z" }), [5, 4, 3, 2]);
  assert.deepEqual(ids({ to: "2026-11-02T10:00:00.000Z" }), [1]);
  assert.deepEqual(ids({ actorId: "31" }), [3]);
  assert.deepEqual(ids({ projectId: "15" }), [2, 1]);
  assert.deepEqual(ids({ actions: "task_deleted, workspace_role_changed" }), [4, 2]);
  assert.deepEqual(ids({ areas: "SECURITY,TASK" }), [5, 2]);
  assert.deepEqual(ids({ projectId: "15", actions: "PROJECT_ROLES_CHANGED" }), [1]);
  // an actor or project that doesn't exist is not an error, it matches nothing
  assert.deepEqual(ids({ actorId: "999" }), []);
  assert.deepEqual(ids({ projectId: "999" }), []);
  // the system never matches an actor filter
  assert.deepEqual(ids({ actorId: "5" }), []);
});

test("the log is paged, 0-based, the size capped at 100 and a page past the end empty", () => {
  const page = queryAuditEntries(LOG, { page: 1, size: 2 });
  assert.deepEqual(page.content.map((e) => e.id), [3, 2]);
  assert.deepEqual([page.page, page.size, page.totalElements, page.totalPages], [1, 2, 5, 3]);
  assert.equal(queryAuditEntries(LOG, { size: 500 }).size, 100);
  assert.equal(queryAuditEntries(LOG, { page: -4 }).page, 0);
  assert.deepEqual(queryAuditEntries(LOG, { page: 9, size: 2 }).content, []);
});

test("the mock refuses the queries the backend refuses with 400", () => {
  assert.match(auditQueryError({ from: "yesterday" }), /Invalid 'from'/);
  assert.equal(auditQueryError({ from: "2026-11-03T00:00:00Z", to: "2026-11-01T00:00:00Z" }), "'from' must be before 'to'.");
  assert.equal(auditQueryError({ from: "2026-11-01T00:00:00Z", to: "2026-11-01T00:00:00Z" }), "'from' must be before 'to'.");
  assert.equal(auditQueryError({ actorId: "-1" }), "'actorId' must be a positive ID.");
  assert.equal(auditQueryError({ actions: "FOO" }), "Invalid 'actions' filter: FOO.");
  assert.equal(auditQueryError({ areas: "NOPE" }), "Invalid 'areas' filter: NOPE.");
  assert.equal(auditQueryError({ actorId: "17", actions: "TASK_DELETED", areas: "TASK" }), "");
  assert.equal(auditQueryError({}), "");
});

test("the actor list has each person once, with their latest name, people who left included, the system left out", () => {
  const log = [
    entry(1, "2026-11-01T10:00:00.000Z", { actor: { id: 9, name: "Bob Old Name", email: "bob@example.com" } }),
    entry(2, "2026-11-02T10:00:00.000Z", { actor: { id: 9, name: "Bob Smith", email: "bob@example.com" } }),
    entry(3, "2026-11-02T11:00:00.000Z", { actor: { id: 17, name: "ada lovelace", email: "ada@example.com" } }),
    entry(4, "2026-11-02T12:00:00.000Z", { actor: null }),
  ];
  assert.deepEqual(auditActors(log), [
    { id: 17, name: "ada lovelace", email: "ada@example.com" },
    { id: 9, name: "Bob Smith", email: "bob@example.com" },
  ]);
});
