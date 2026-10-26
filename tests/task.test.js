import test from "node:test";
import assert from "node:assert/strict";
import {
  canMoveTask,
  filterTasks,
  findTask,
  formatEstimate,
  labelTone,
  movePermission,
  moveTask,
  projectLabels,
  sumEstimates,
  taskPath,
} from "../src/utils/task.js";
import { validateSprint, validateTask } from "../src/utils/validation.js";

const task = (id, extra = {}) => ({ id, title: `Task ${id}`, key: `WR-${id}`, labels: [], estimate: null, ...extra });

// backlog 1, 2, 3; sprint 10 holds 4, 5
const state = () => ({
  backlog: [task(1), task(2), task(3)],
  sprints: [{ id: 10, name: "Sprint 1", tasks: [task(4, { sprintId: 10 }), task(5, { sprintId: 10 })] }],
});
const ids = (tasks) => tasks.map((t) => t.id);

test("taskPath nests the task under its project", () => {
  assert.equal(taskPath({ id: 7, workspaceId: 3 }, 42), "/workspaces/3/projects/7/tasks/42");
});

test("sumEstimates counts missing estimates as 0 and keeps decimals", () => {
  assert.equal(sumEstimates([task(1, { estimate: 3 }), task(2), task(3, { estimate: 2.5 })]), 5.5);
  assert.equal(sumEstimates([]), 0);
});

test("formatEstimate shows nothing for no estimate", () => {
  assert.equal(formatEstimate(null), "");
  assert.equal(formatEstimate(""), "");
  assert.equal(formatEstimate(0), "0");
  assert.equal(formatEstimate(2.5), "2.5");
  assert.equal(formatEstimate(0.1 + 0.2), "0.3");
});

test("findTask says which list a task is in", () => {
  assert.deepEqual(findTask(state(), 2).sprintId, null);
  assert.equal(findTask(state(), 5).sprintId, 10);
  assert.equal(findTask(state(), 5).index, 1);
  assert.equal(findTask(state(), 99), null);
});

test("moveTask reorders inside the backlog", () => {
  const next = moveTask(state(), { taskId: 3, sprintId: null, beforeTaskId: 1 });
  assert.deepEqual(ids(next.backlog), [3, 1, 2]);
  const toEnd = moveTask(state(), { taskId: 1, sprintId: null, beforeTaskId: null });
  assert.deepEqual(ids(toEnd.backlog), [2, 3, 1]);
});

test("moveTask moves between the backlog and a sprint and updates sprintId", () => {
  const into = moveTask(state(), { taskId: 2, sprintId: 10, beforeTaskId: 5 });
  assert.deepEqual(ids(into.backlog), [1, 3]);
  assert.deepEqual(ids(into.sprints[0].tasks), [4, 2, 5]);
  assert.equal(into.sprints[0].tasks[1].sprintId, 10);

  const out = moveTask(state(), { taskId: 4, sprintId: null, beforeTaskId: 1 });
  assert.deepEqual(ids(out.backlog), [4, 1, 2, 3]);
  assert.equal(out.backlog[0].sprintId, null);
});

test("moveTask leaves the state alone for unknown tasks or sprints, and doesn't mutate", () => {
  const before = state();
  assert.equal(moveTask(before, { taskId: 99, sprintId: null }), before);
  assert.equal(moveTask(before, { taskId: 1, sprintId: 77 }), before);
  moveTask(before, { taskId: 1, sprintId: 10 });
  assert.deepEqual(ids(before.backlog), [1, 2, 3]);
});

test("ordering the backlog needs MANAGE_BACKLOG, anything with a sprint MANAGE_SPRINTS", () => {
  assert.equal(movePermission(null, null), "MANAGE_BACKLOG");
  assert.equal(movePermission(null, 10), "MANAGE_SPRINTS");
  assert.equal(movePermission(10, null), "MANAGE_SPRINTS");
  assert.equal(movePermission(10, 11), "MANAGE_SPRINTS");

  const productOwner = { permissions: ["VIEW_WORK", "MANAGE_BACKLOG"] };
  assert.equal(canMoveTask(productOwner, null, null), true);
  assert.equal(canMoveTask(productOwner, null, 10), false);
});

test("filterTasks matches title, key and labels, ignoring case", () => {
  const tasks = [task(1, { title: "Login page" }), task(2, { labels: ["Backend"] }), task(3)];
  assert.deepEqual(ids(filterTasks(tasks, "login")), [1]);
  assert.deepEqual(ids(filterTasks(tasks, "backend")), [2]);
  assert.deepEqual(ids(filterTasks(tasks, "wr-3")), [3]);
  assert.equal(filterTasks(tasks, "  ").length, 3);
});

test("projectLabels lists each label once, sorted", () => {
  const s = state();
  s.backlog[0].labels = ["frontend", "Design"];
  s.sprints[0].tasks[0].labels = ["Design", "api"];
  assert.deepEqual(projectLabels(s), ["api", "Design", "frontend"]);
});

test("labelTone is stable and ignores case", () => {
  assert.equal(labelTone("Backend"), labelTone("backend"));
  assert.match(labelTone("Design"), /\.main$/);
});

test("validateTask requires a title and a non-negative estimate", () => {
  assert.deepEqual(validateTask({ title: "Fix login", estimate: "" }), {});
  assert.deepEqual(validateTask({ title: "Fix", estimate: "2.5" }), {});
  assert.ok(validateTask({ title: "  ", estimate: "" }).title);
  assert.ok(validateTask({ title: "x".repeat(201), estimate: "" }).title);
  assert.ok(validateTask({ title: "Fix", estimate: "-1" }).estimate);
  assert.ok(validateTask({ title: "Fix", estimate: "abc" }).estimate);
});

test("validateSprint checks capacity and dates; starting needs both dates", () => {
  assert.deepEqual(validateSprint({ capacity: "", startDate: "", endDate: "" }), {});
  assert.ok(validateSprint({ capacity: "-3" }).capacity);
  assert.ok(validateSprint({ startDate: "2026-11-10", endDate: "2026-11-01" }).endDate);
  const start = validateSprint({ startDate: "", endDate: "" }, { requireDates: true });
  assert.ok(start.startDate && start.endDate);
});
