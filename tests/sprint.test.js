import test from "node:test";
import assert from "node:assert/strict";
import { capacitySummary, countUnestimated, sprintRequest } from "../src/utils/sprint.js";

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
