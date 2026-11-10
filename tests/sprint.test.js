import test from "node:test";
import assert from "node:assert/strict";
import {
  capacitySummary,
  carriedOverLabel,
  completeSprintRequest,
  countUnestimated,
  goalAchievedLabel,
  isSprintEnded,
  sprintEndedText,
  sprintPath,
  sprintRequest,
} from "../src/utils/sprint.js";
import { fieldErrorsAs, SPRINT_END_FIELD_TEXTS, validateCancelSprint, validateCompleteSprint } from "../src/utils/validation.js";

const values = (extra = {}) => ({ name: "", goal: "", capacity: "", startDate: "", endDate: "", ...extra });

test("countUnestimated counts tasks without points, and 0 is an estimate", () => {
  assert.equal(countUnestimated([{ estimate: null }, { estimate: 0 }, { estimate: 3 }, { estimate: "" }]), 2);
});

test("sprintRequest on create sends nulls so the backend names and dates the sprint", () => {
  assert.deepEqual(sprintRequest(values({ goal: " Ship login " })), {
    name: null,
    goal: "Ship login",
    capacity: null,
    startDate: null,
    endDate: null,
  });
  assert.deepEqual(sprintRequest(values({ name: "S1", capacity: "20", startDate: "2026-11-09", endDate: "2026-11-22" })), {
    name: "S1",
    goal: "",
    capacity: 20,
    startDate: "2026-11-09",
    endDate: "2026-11-22",
  });
});

test("sprintRequest on edit leaves out a blank name and clears an emptied capacity", () => {
  assert.deepEqual(sprintRequest(values({ goal: "Goal" }), { editing: true }), { goal: "Goal", clearCapacity: true });
  assert.deepEqual(
    sprintRequest(values({ name: "S2", capacity: "0", startDate: "2026-11-09", endDate: "2026-11-22" }), { editing: true }),
    { name: "S2", goal: "", capacity: 0, startDate: "2026-11-09", endDate: "2026-11-22" },
  );
});

// ----- completing and cancelling (PMP-41) -----

const close = (extra = {}) => ({ goalAchieved: "PARTIALLY", goalNote: "", destination: "backlog", plannedSprintId: null, ...extra });

test("completeSprintRequest: the backlog is no destination at all, and a blank note is null", () => {
  assert.deepEqual(completeSprintRequest(close({ goalNote: "   " })), {
    goalAchieved: "PARTIALLY",
    goalNote: null,
    carryOverSprintId: null,
    createSprint: false,
    confirmEarlyClose: false,
  });
});

test("completeSprintRequest: a planned sprint or a new one, never both", () => {
  const planned = completeSprintRequest(close({ destination: "planned", plannedSprintId: 43, goalNote: " Ran out of time " }));
  assert.equal(planned.carryOverSprintId, 43);
  assert.equal(planned.createSprint, false);
  assert.equal(planned.goalNote, "Ran out of time");

  const fresh = completeSprintRequest(close({ destination: "new", plannedSprintId: 43 }));
  assert.equal(fresh.carryOverSprintId, null);
  assert.equal(fresh.createSprint, true);

  // "planned" without a sprint picked falls back to the backlog rather than sending nothing valid
  const none = completeSprintRequest(close({ destination: "planned" }));
  assert.equal(none.carryOverSprintId, null);
  assert.equal(none.createSprint, false);
});

test("completeSprintRequest: confirms an early close only when the window warned about it", () => {
  assert.equal(completeSprintRequest(close()).confirmEarlyClose, false);
  assert.equal(completeSprintRequest(close(), { endsEarly: true }).confirmEarlyClose, true);
});

test("sprintEndedText: how many items moved, and where", () => {
  assert.equal(sprintEndedText({ carriedOver: 2, toSprint: null }), "Sprint completed. 2 items moved to the top of the backlog");
  assert.equal(sprintEndedText({ carriedOver: 1, toSprint: { name: "MOB Sprint 5" } }), "Sprint completed. 1 item moved to MOB Sprint 5");
  assert.equal(sprintEndedText({ carriedOver: 0, toSprint: null }), "Sprint completed");
  assert.equal(
    sprintEndedText({ carriedOver: 3, toSprint: null }, "cancelled"),
    "Sprint cancelled. 3 items moved to the top of the backlog",
  );
});

test("carriedOverLabel: only top-level tasks a sprint left unfinished", () => {
  assert.equal(carriedOverLabel({ carriedOverCount: 1, parentTaskId: null }), "Carried over ×1");
  assert.equal(carriedOverLabel({ carriedOverCount: 2 }), "Carried over ×2");
  assert.equal(carriedOverLabel({ carriedOverCount: 0 }), "");
  assert.equal(carriedOverLabel({}), "");
  assert.equal(carriedOverLabel({ carriedOverCount: 1, parentTaskId: 7 }), "");
});

test("sprintPath, isSprintEnded and goalAchievedLabel", () => {
  assert.equal(sprintPath({ slug: "acme" }, { id: 15 }, 42), "/workspaces/acme/projects/15/sprints/42");
  assert.equal(isSprintEnded({ status: "COMPLETED" }), true);
  assert.equal(isSprintEnded({ status: "CANCELLED" }), true);
  assert.equal(isSprintEnded({ status: "ACTIVE" }), false);
  assert.equal(goalAchievedLabel("PARTIALLY"), "Partially");
  assert.equal(goalAchievedLabel(null), "");
});

test("validateCompleteSprint: the goal answer is required, the note at most 1000 characters", () => {
  assert.deepEqual(validateCompleteSprint({ goalAchieved: "YES", goalNote: "" }), {});
  assert.deepEqual(validateCompleteSprint({ goalAchieved: "", goalNote: "" }), {
    goalAchieved: "Choose whether the sprint goal was achieved",
  });
  assert.ok(validateCompleteSprint({ goalAchieved: "NO", goalNote: "x".repeat(1001) }).goalNote);
  assert.deepEqual(validateCompleteSprint({ goalAchieved: "NO", goalNote: "x".repeat(1000) }), {});
});

test("validateCancelSprint: a reason is required, at most 1000 characters", () => {
  assert.deepEqual(validateCancelSprint({ reason: "Client dropped the feature" }), {});
  assert.deepEqual(validateCancelSprint({ reason: "   " }), { reason: "Enter a reason" });
  assert.ok(validateCancelSprint({ reason: "x".repeat(1001) }).reason);
});

test("fieldErrorsAs: the backend's validator texts become our own, unknown fields keep theirs", () => {
  assert.deepEqual(fieldErrorsAs({ reason: "must not be blank", other: "bad" }, SPRINT_END_FIELD_TEXTS), {
    reason: "Enter a reason of at most 1000 characters",
    other: "bad",
  });
  assert.deepEqual(fieldErrorsAs(undefined, SPRINT_END_FIELD_TEXTS), {});
});

test("capacitySummary explains the suggestion, or why there is none", () => {
  const base = { averageVelocity: null, normalPersonDays: 50, availablePersonDays: 45, workingDays: 10, members: [] };
  assert.deepEqual(capacitySummary({ ...base, suggestedCapacity: null }), {
    suggested: null,
    text: "No suggestion yet: it needs at least one completed sprint. 45 of 50 person-days available.",
  });
  assert.deepEqual(capacitySummary({ ...base, suggestedCapacity: 27, averageVelocity: 30 }), {
    suggested: 27,
    text: "Average velocity 30 points over the last completed sprints · 45 of 50 person-days available",
  });
});
