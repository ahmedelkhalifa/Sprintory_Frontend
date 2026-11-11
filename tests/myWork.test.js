import test from "node:test";
import assert from "node:assert/strict";
import {
  boardSummary,
  openAssigned,
  setupSteps,
  sortMyWork,
  sprintDays,
  sprintDaysText,
  sprintPoints,
} from "../src/utils/myWork.js";

const columns = [
  { id: 1, name: "To Do", category: "TODO" },
  { id: 2, name: "In Progress", category: "IN_PROGRESS" },
  { id: 3, name: "Done", category: "DONE" },
];
const project = { id: 8, name: "mobile app" };

test("openAssigned leaves out done tasks and adds the project and stage", () => {
  const tasks = [
    { id: 1, statusId: 1 },
    { id: 2, statusId: 3 },
    { id: 3, statusId: 2 },
  ];
  const items = openAssigned(project, columns, tasks);
  assert.deepEqual(items.map((item) => item.task.id), [1, 3]);
  assert.equal(items[0].project, project);
  assert.equal(items[0].stage, "TODO");
  assert.equal(items[1].stage, "IN_PROGRESS");
});

test("sortMyWork puts higher priorities first, then the most recently updated", () => {
  const item = (id, priority, updatedAt) => ({ task: { id, priority, updatedAt }, project });
  const sorted = sortMyWork([
    item(1, "LOW", "2026-11-10T10:00:00Z"),
    item(2, "HIGHEST", "2026-11-01T10:00:00Z"),
    item(3, "MEDIUM", "2026-11-09T10:00:00Z"),
    item(4, undefined, "2026-11-10T10:00:00Z"),
    item(5, "HIGHEST", "2026-11-05T10:00:00Z"),
  ]);
  assert.deepEqual(sorted.map((i) => i.task.id), [5, 2, 4, 3, 1]);
});

test("sprintDays counts both ends and finds today", () => {
  const sprint = { startDate: "2026-11-03", endDate: "2026-11-12" };
  assert.deepEqual(sprintDays(sprint, new Date(2026, 10, 3)), { total: 10, current: 0, overdue: 0 });
  assert.deepEqual(sprintDays(sprint, new Date(2026, 10, 12)), { total: 10, current: 9, overdue: 0 });
  assert.deepEqual(sprintDays(sprint, new Date(2026, 10, 1)), { total: 10, current: -1, overdue: 0 });
  assert.deepEqual(sprintDays(sprint, new Date(2026, 10, 14)), { total: 10, current: 10, overdue: 2 });
  assert.equal(sprintDays({ startDate: "2026-11-03" }), null);
});

test("sprintDaysText words the day-strip", () => {
  assert.equal(sprintDaysText({ total: 10, current: 3, overdue: 0 }), "Day 4 of 10 · 7 days left");
  assert.equal(sprintDaysText({ total: 10, current: 9, overdue: 0 }), "Day 10 of 10 · last day");
  assert.equal(sprintDaysText({ total: 10, current: -1, overdue: 0 }), "Not started yet");
  assert.equal(sprintDaysText({ total: 10, current: 10, overdue: 1 }), "1 day past the end date");
  assert.equal(sprintDaysText(null), "");
});

test("boardSummary counts tasks per stage and finds columns over their limit", () => {
  const board = [
    { id: 1, name: "Backlog", category: "TODO", taskCount: 3 },
    { id: 2, name: "To Do", category: "TODO", taskCount: 1 },
    { id: 3, name: "In Progress", category: "IN_PROGRESS", taskCount: 4, wipExceeded: true },
    { id: 4, name: "Done", category: "DONE", taskCount: 6 },
  ];
  assert.deepEqual(boardSummary(board), { TODO: 4, IN_PROGRESS: 4, DONE: 6, total: 14, overLimit: ["In Progress"] });
  // no categories (a board from before R16): first column to do, last done
  const old = [
    { id: 1, name: "A", taskCount: 2 },
    { id: 2, name: "B", taskCount: 1 },
    { id: 3, name: "C" },
  ];
  assert.deepEqual(boardSummary(old), { TODO: 2, IN_PROGRESS: 1, DONE: 0, total: 3, overLimit: [] });
  assert.equal(boardSummary().total, 0);
});

test("sprintPoints uses the commitment, then the selected points, and skips unestimated sprints", () => {
  assert.deepEqual(sprintPoints({ committedPoints: 21, selectedPoints: 25, completedPoints: 8 }), { done: 8, total: 21 });
  assert.deepEqual(sprintPoints({ committedPoints: null, selectedPoints: 13 }), { done: 0, total: 13 });
  assert.equal(sprintPoints({ committedPoints: 0, selectedPoints: 0 }), null);
  assert.equal(sprintPoints(null), null);
});

test("setupSteps ticks off what the workspace already has", () => {
  const done = (totals) => setupSteps(totals).map((step) => step.done);
  assert.deepEqual(done({}), [false, false, false, false]);
  // the creator alone isn't "invited people"
  assert.deepEqual(done({ projects: 1, members: 1, teams: 0, tasks: 0 }), [true, false, false, false]);
  assert.deepEqual(done({ projects: 2, members: 3, teams: 1, tasks: 5 }), [true, true, true, true]);
});
