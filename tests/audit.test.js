import process from "node:process";
import test from "node:test";
import assert from "node:assert/strict";
import { AUDIT_ACTIONS, AUDIT_ACTION_GROUPS } from "../src/constants/audit.js";
import {
  EMPTY_AUDIT_FILTERS,
  actorLabel,
  auditActionLabel,
  auditQuery,
  auditSentence,
  dayRangeToInstants,
  filtersFromSearchParams,
  filtersToSearchParams,
  formatUtc,
  hasAuditFilters,
  sentenceCoversChanges,
  truncateText,
  validateDayRange,
  visibleChanges,
} from "../src/utils/audit.js";

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

test("only role and template values get labels; free text stays as written", () => {
  const changes = visibleChanges(
    entry(1, "2026-11-02T14:05:31Z", {
      action: "PROJECT_CREATED",
      changes: [
        { field: "template", oldValue: null, newValue: "SCRUM" },
        { field: "description", oldValue: null, newValue: "Ask a VIEWER, MEMBER or admin" },
      ],
    }),
  );
  assert.deepEqual(changes.map((c) => c.newText), ["Scrum", "Ask a VIEWER, MEMBER or admin"]);
});

test("each entry reads as one sentence on a phone, with the names stored in it", () => {
  assert.equal(
    auditSentence(entry(1, "2026-11-02T14:05:31Z")),
    'Ada Lovelace changed Linus Torvalds\'s roles in "Mobile App" from Member to Project Manager, Member',
  );
  assert.equal(
    auditSentence(
      entry(2, "2026-11-02T14:05:31Z", {
        action: "PROJECT_MEMBER_ADDED",
        changes: [
          { field: "roles", oldValue: null, newValue: "MEMBER" },
          { field: "viaTeam", oldValue: null, newValue: "Backend" },
        ],
      }),
    ),
    'Ada Lovelace added Linus Torvalds to "Mobile App" (via team "Backend")',
  );
  assert.equal(
    auditSentence(
      entry(3, "2026-11-02T14:05:31Z", {
        action: "LOGIN_FAILED_REPEATED",
        area: "SECURITY",
        actor: null,
        project: null,
        changes: [{ field: "failedAttempts", oldValue: null, newValue: "5" }],
      }),
    ),
    "5 failed sign-in attempts for Linus Torvalds",
  );
  assert.equal(
    auditSentence(
      entry(4, "2026-11-02T14:05:31Z", {
        action: "WORKSPACE_ROLE_CHANGED",
        area: "WORKSPACE",
        project: null,
        changes: [{ field: "role", oldValue: "WORKSPACE_MEMBER", newValue: "WORKSPACE_ADMIN" }],
      }),
    ),
    "Ada Lovelace changed Linus Torvalds's workspace role from Member to Admin",
  );
  assert.equal(
    auditSentence(
      entry(5, "2026-11-02T14:05:31Z", {
        action: "TASK_DELETED",
        area: "TASK",
        target: { type: "TASK", id: 42, name: "MOB-42 Fix login" },
        changes: [],
      }),
    ),
    'Ada Lovelace deleted MOB-42 Fix login in "Mobile App"',
  );
  // an action the app doesn't know yet still reads
  assert.equal(
    auditSentence(entry(6, "2026-11-02T14:05:31Z", { action: "BOARD_COLUMN_MOVED" })),
    "Ada Lovelace · Board column moved · Linus Torvalds",
  );
});

test("the phone view lists the changes only where the sentence doesn't say them", () => {
  assert.equal(sentenceCoversChanges("PROJECT_ROLES_CHANGED"), true);
  assert.equal(sentenceCoversChanges("PROJECT_SETTINGS_CHANGED"), false);
  assert.equal(sentenceCoversChanges("BOARD_COLUMN_MOVED"), false);
});
