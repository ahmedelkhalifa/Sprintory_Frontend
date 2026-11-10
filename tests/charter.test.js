import test from "node:test";
import assert from "node:assert/strict";
import {
  canEditCharter,
  charterFieldErrors,
  charterHistoryLine,
  charterReadOnlyReason,
  goalIds,
  goalRequest,
  goalTitles,
  memberSearchTerm,
  moveGoal,
  parseGoalOrder,
  parseGoalSnapshot,
  scopeRequest,
  sortGoals,
  stakeholderRequest,
  stakeholderValues,
  validateGoal,
  validateStakeholder,
} from "../src/utils/charter.js";

const doc = (text) => JSON.stringify({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text }] }] });
const EMPTY = JSON.stringify({ type: "doc", content: [{ type: "paragraph" }] });

test("canEditCharter needs canEdit and not readOnly", () => {
  assert.equal(canEditCharter({ canEdit: true, readOnly: false }), true);
  assert.equal(canEditCharter({ canEdit: false, readOnly: true }), false);
  assert.equal(canEditCharter({ canEdit: true, readOnly: true }), false);
  assert.equal(canEditCharter(null), false);
});

test("charterReadOnlyReason tells who may edit, or that the project is locked", () => {
  const charter = { canEdit: false, readOnly: true };
  assert.equal(charterReadOnlyReason({ canEdit: true, readOnly: false }, { permissions: ["EDIT_CHARTER"] }), "");
  assert.match(charterReadOnlyReason(charter, { template: "SCRUM", permissions: ["VIEW_WORK"] }), /Product Owner/);
  assert.equal(
    charterReadOnlyReason(charter, { template: "KANBAN", permissions: ["VIEW_WORK"] }),
    "Only the Project Manager can edit the charter.",
  );
  assert.match(charterReadOnlyReason(charter, { template: "SCRUM", permissions: ["EDIT_CHARTER"] }), /completed or archived/);
});

test("validateGoal requires a title of at most 200 characters and limits the measure", () => {
  assert.deepEqual(validateGoal({ title: "  ", successMeasure: "" }), { title: "Title is required" });
  assert.deepEqual(validateGoal({ title: "x".repeat(200), successMeasure: "" }), {});
  assert.deepEqual(validateGoal({ title: "x".repeat(201), successMeasure: "" }), { title: "Use at most 200 characters" });
  assert.deepEqual(validateGoal({ title: "Ok", successMeasure: "y".repeat(1001) }), {
    successMeasure: "Use at most 1000 characters",
  });
});

test("goalRequest trims and sends a blank success measure as null", () => {
  assert.deepEqual(goalRequest({ title: " Reduce onboarding time ", successMeasure: " Under 1 day " }), {
    title: "Reduce onboarding time",
    successMeasure: "Under 1 day",
  });
  assert.deepEqual(goalRequest({ title: "A", successMeasure: "   " }), { title: "A", successMeasure: null });
});

test("sortGoals orders by order then id, moveGoal renumbers", () => {
  const goals = [
    { id: 3, order: 1 },
    { id: 1, order: 0 },
    { id: 2, order: 2 },
  ];
  assert.deepEqual(goalIds(sortGoals(goals)), [1, 3, 2]);
  const moved = moveGoal(sortGoals(goals), 2, 0);
  assert.deepEqual(goalIds(moved), [2, 1, 3]);
  assert.deepEqual(moved.map((g) => g.order), [0, 1, 2]);
  // out of range or no move: the same list
  const same = sortGoals(goals);
  assert.equal(moveGoal(same, 0, 0), same);
  assert.equal(moveGoal(same, 0, 5), same);
});

test("scopeRequest always sends both fields and empties become null", () => {
  assert.deepEqual(scopeRequest({ inScope: doc("Web app"), outOfScope: "" }), { inScope: doc("Web app"), outOfScope: null });
  assert.deepEqual(scopeRequest({ inScope: EMPTY, outOfScope: null }), { inScope: null, outOfScope: null });
});

test("validateStakeholder requires a name and checks the optional email and lengths", () => {
  const base = { name: "Acme Corp", organization: "", projectRole: "", contactEmail: "" };
  assert.deepEqual(validateStakeholder(base), {});
  assert.deepEqual(validateStakeholder({ ...base, name: " " }), { name: "Name is required" });
  assert.deepEqual(validateStakeholder({ ...base, contactEmail: "not-an-email" }), { contactEmail: "Enter a valid email address" });
  assert.deepEqual(validateStakeholder({ ...base, contactEmail: "sponsor@acme.test" }), {});
  assert.deepEqual(validateStakeholder({ ...base, projectRole: "r".repeat(101) }), { projectRole: "Use at most 100 characters" });
  assert.deepEqual(validateStakeholder({ ...base, organization: "o".repeat(201) }), { organization: "Use at most 200 characters" });
});

test("stakeholderRequest matches the API body, blanks become null", () => {
  assert.deepEqual(
    stakeholderRequest({
      name: " Acme Corp ",
      organization: " Acme ",
      projectRole: "Sponsor",
      interest: "MEDIUM",
      influence: "HIGH",
      contactEmail: " sponsor@acme.test ",
      linkedUser: null,
    }),
    {
      name: "Acme Corp",
      organization: "Acme",
      projectRole: "Sponsor",
      interest: "MEDIUM",
      influence: "HIGH",
      contactEmail: "sponsor@acme.test",
      linkedUserId: null,
    },
  );
  assert.deepEqual(
    stakeholderRequest({ name: "Ada", organization: "", projectRole: " ", interest: "", influence: "BOGUS", contactEmail: "", linkedUser: { userId: 7 } }),
    { name: "Ada", organization: null, projectRole: null, interest: null, influence: null, contactEmail: null, linkedUserId: 7 },
  );
});

test("stakeholderValues opens a stakeholder in the form, with the linked user as an option", () => {
  const values = stakeholderValues({
    id: 30,
    name: "Acme Corp",
    organization: null,
    projectRole: "Sponsor",
    interest: null,
    influence: "HIGH",
    contactEmail: null,
    linkedUserId: 4,
    linkedUserName: "Ada Lovelace",
  });
  assert.equal(values.organization, "");
  assert.equal(values.interest, "");
  assert.deepEqual(values.linkedUser, { userId: 4, label: "Ada Lovelace" });
  assert.equal(stakeholderValues(null).name, "");
});

test("memberSearchTerm takes the first word of a name", () => {
  assert.equal(memberSearchTerm(" Ada  Lovelace "), "Ada");
  assert.equal(memberSearchTerm(""), "");
});

test("history snapshots are parsed defensively", () => {
  assert.deepEqual(parseGoalSnapshot('{"id":1,"title":"A","successMeasure":null,"order":0}'), {
    id: 1,
    title: "A",
    successMeasure: null,
    order: 0,
  });
  assert.equal(parseGoalSnapshot("not json"), null);
  assert.equal(parseGoalSnapshot("[1,2]"), null);
  assert.deepEqual(parseGoalOrder("[3,1]"), [3, 1]);
  assert.deepEqual(parseGoalOrder(null), []);
});

test("charterHistoryLine describes goal changes with old and new values", () => {
  const added = charterHistoryLine({ changeType: "GOAL_ADDED", oldValue: null, newValue: '{"id":1,"title":"Ship","successMeasure":"By May","order":0}' });
  assert.equal(added.text, "added the goal “Ship”");
  assert.deepEqual(added.changes, [{ label: "Success measure", from: null, to: "By May" }]);

  const updated = charterHistoryLine({
    changeType: "GOAL_UPDATED",
    oldValue: '{"id":1,"title":"Ship","successMeasure":"By May","order":0}',
    newValue: '{"id":1,"title":"Ship v2","successMeasure":"By May","order":0}',
  });
  assert.equal(updated.text, "updated the goal “Ship v2”");
  assert.deepEqual(updated.changes, [{ label: "Title", from: "Ship", to: "Ship v2" }]);

  const deleted = charterHistoryLine({ changeType: "GOAL_DELETED", oldValue: '{"id":1,"title":"Ship","successMeasure":null,"order":0}', newValue: null });
  assert.equal(deleted.text, "deleted the goal “Ship”");
  assert.deepEqual(deleted.changes, []);
});

test("charterHistoryLine names reordered goals, including deleted ones from snapshots", () => {
  const entries = [{ changeType: "GOAL_DELETED", oldValue: '{"id":9,"title":"Old goal","successMeasure":null,"order":2}', newValue: null }];
  const titles = goalTitles(entries, [
    { id: 1, title: "A" },
    { id: 2, title: "B" },
  ]);
  const line = charterHistoryLine({ changeType: "GOALS_REORDERED", oldValue: "[1,2,9]", newValue: "[2,1,9]" }, titles);
  assert.equal(line.text, "reordered the goals");
  assert.equal(line.changes[0].from, "1. A\n2. B\n3. Old goal");
  assert.equal(line.changes[0].to, "1. B\n2. A\n3. Old goal");
  // an id nobody knows anymore
  assert.match(charterHistoryLine({ changeType: "GOALS_REORDERED", oldValue: "[5]", newValue: "[5]" }).changes[0].to, /Goal #5/);
});

test("charterHistoryLine marks scope values as rich text", () => {
  const line = charterHistoryLine({ changeType: "OUT_OF_SCOPE_CHANGED", oldValue: null, newValue: doc("Mobile") });
  assert.equal(line.text, "changed Out of scope");
  assert.deepEqual(line.changes, [{ label: "Out of scope", from: null, to: doc("Mobile"), rich: true }]);
  assert.equal(charterHistoryLine({ changeType: "SOMETHING_NEW" }).text, "changed the charter");
});

test("charterFieldErrors maps a VALIDATION_ERROR onto the form's fields only", () => {
  const err = { response: { data: { code: "VALIDATION_ERROR", fieldErrors: { title: "must not be blank", other: "x" } } } };
  assert.deepEqual(charterFieldErrors(err, ["title", "successMeasure"]), { title: "must not be blank" });
  assert.equal(charterFieldErrors({ response: { data: { code: "BAD_REQUEST" } } }, ["title"]), null);
  assert.equal(charterFieldErrors(err, ["name"]), null);
});
