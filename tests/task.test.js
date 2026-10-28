import test from "node:test";
import assert from "node:assert/strict";
import {
  backlogView,
  canMoveTask,
  describeTasks,
  findTask,
  formatEstimate,
  insertAfter,
  labelTone,
  movePermission,
  moveInBacklog,
  projectLabels,
  sumEstimates,
  taskChanges,
  taskPath,
  taskStage,
} from "../src/utils/task.js";
import { validateSprint, validateTask } from "../src/utils/validation.js";

const task = (id, extra = {}) => ({ id, title: `Task ${id}`, key: `WR-${id}`, labels: [], estimate: null, ...extra });

// tasks 1..5 in backlog order; sprint 10 holds 4, 5 (in that order)
const state = () => ({
  tasks: [task(1), task(2), task(3), task(4), task(5)],
  sprints: [{ id: 10, name: "Sprint 1", taskIds: [4, 5] }],
});
const ids = (tasks) => tasks.map((t) => t.id);

const COLUMNS = [
  { id: 11, name: "To Do" },
  { id: 12, name: "In Progress" },
  { id: 13, name: "Done" },
];

test("taskPath nests the task under its project", () => {
  assert.equal(taskPath({ id: 7, workspaceId: 3 }, 42), "/workspaces/3/projects/7/tasks/42");
});

test("sumEstimates counts missing estimates as 0", () => {
  assert.equal(sumEstimates([task(1, { estimate: 3 }), task(2), task(3, { estimate: 2 })]), 5);
  assert.equal(sumEstimates([]), 0);
});

test("formatEstimate shows nothing for no estimate", () => {
  assert.equal(formatEstimate(null), "");
  assert.equal(formatEstimate(""), "");
  assert.equal(formatEstimate(0), "0");
  assert.equal(formatEstimate(0.1 + 0.2), "0.3");
});

test("insertAfter puts an item after another, first for null, last for an unknown id", () => {
  const list = [{ id: 1 }, { id: 2 }, { id: 3 }];
  assert.deepEqual(ids(insertAfter(list, { id: 3 }, 1)), [1, 3, 2]);
  assert.deepEqual(ids(insertAfter(list, { id: 3 }, null)), [3, 1, 2]);
  assert.deepEqual(ids(insertAfter(list, { id: 9 }, 99)), [1, 2, 3, 9]);
  assert.deepEqual(insertAfter([4, 5], 6, 4, (x) => x), [4, 6, 5]);
});

test("backlogView puts sprint tasks in their sprints and the rest in the backlog", () => {
  const view = backlogView(state());
  assert.deepEqual(ids(view.backlog), [1, 2, 3]);
  assert.deepEqual(ids(view.sprints[0].tasks), [4, 5]);
  // a deleted task's id is skipped
  const gone = backlogView({ ...state(), sprints: [{ id: 10, taskIds: [99, 5] }] });
  assert.deepEqual(ids(gone.sprints[0].tasks), [5]);
});

test("findTask says which list a task is in", () => {
  const view = backlogView(state());
  assert.equal(findTask(view, 2).sprintId, null);
  assert.equal(findTask(view, 5).sprintId, 10);
  assert.equal(findTask(view, 5).index, 1);
  assert.equal(findTask(view, 99), null);
});

test("moveInBacklog reorders inside the backlog, after a task or first", () => {
  const after = backlogView(moveInBacklog(state(), { taskId: 1, sprintId: null, afterTaskId: 3 }));
  assert.deepEqual(ids(after.backlog), [2, 3, 1]);
  const first = backlogView(moveInBacklog(state(), { taskId: 3, sprintId: null, afterTaskId: null }));
  assert.deepEqual(ids(first.backlog), [3, 1, 2]);
});

test("moveInBacklog moves into a sprint, and out of it back to the task's own backlog place", () => {
  const into = moveInBacklog(state(), { taskId: 2, sprintId: 10, afterTaskId: 4 });
  assert.deepEqual(into.sprints[0].taskIds, [4, 2, 5]);
  assert.deepEqual(ids(backlogView(into).backlog), [1, 3]);

  const out = moveInBacklog(state(), { taskId: 4, sprintId: null, afterTaskId: null });
  assert.deepEqual(out.sprints[0].taskIds, [5]);
  assert.deepEqual(ids(backlogView(out).backlog), [1, 2, 3, 4]);
});

test("moveInBacklog leaves the state alone for unknown tasks or sprints, and doesn't mutate", () => {
  const before = state();
  assert.equal(moveInBacklog(before, { taskId: 99, sprintId: null }), before);
  assert.equal(moveInBacklog(before, { taskId: 1, sprintId: 77 }), before);
  moveInBacklog(before, { taskId: 1, sprintId: 10 });
  assert.deepEqual(before.sprints[0].taskIds, [4, 5]);
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

test("taskStage: first column to do, last done, the rest in progress", () => {
  assert.equal(taskStage(11, COLUMNS), "TODO");
  assert.equal(taskStage(12, COLUMNS), "IN_PROGRESS");
  assert.equal(taskStage(13, COLUMNS), "DONE");
});

test("describeTasks names the assignee from the members and adds the stage", () => {
  const members = [{ userId: 7, firstName: "Ada", lastName: "Lovelace" }];
  const [mine, unknown, nobody] = describeTasks(
    [task(1, { assigneeId: 7, statusId: 13 }), task(2, { assigneeId: 8, statusId: 11 }), task(3, { assigneeId: null })],
    { members, columns: COLUMNS },
  );
  assert.equal(mine.assignee.firstName, "Ada");
  assert.equal(mine.stage, "DONE");
  assert.deepEqual(unknown.assignee, { userId: 8 });
  assert.equal(nobody.assignee, null);
});

test("taskChanges sends only what changed, and clear flags for emptied fields", () => {
  const current = task(1, {
    title: "Fix login",
    description: "Steps",
    type: "BUG",
    priority: "HIGH",
    statusId: 11,
    estimate: 3,
    labels: ["b", "a"],
    assigneeId: 7,
  });
  const form = { title: "Fix login ", description: "Steps", type: "BUG", priority: "HIGH", statusId: 11, estimate: 3, labels: ["a", "b"], assigneeId: 7 };
  assert.deepEqual(taskChanges(current, form), {});

  assert.deepEqual(taskChanges(current, { ...form, description: " ", estimate: "", assigneeId: null }), {
    clearDescription: true,
    clearEstimate: true,
    clearAssignee: true,
  });
  assert.deepEqual(taskChanges(current, { ...form, statusId: 12, estimate: "5", labels: ["c"], assigneeId: 9 }), {
    statusId: 12,
    estimate: 5,
    assigneeId: 9,
    labels: ["c"],
  });
});

test("projectLabels lists each label once, sorted", () => {
  const tasks = [task(1, { labels: ["frontend", "Design"] }), task(2, { labels: ["Design", "api"] })];
  assert.deepEqual(projectLabels(tasks), ["api", "Design", "frontend"]);
});

test("labelTone is stable and ignores case", () => {
  assert.equal(labelTone("Backend"), labelTone("backend"));
  assert.match(labelTone("Design"), /\.main$/);
});

test("validateTask: title ≤ 255, whole-number estimate ≥ 0, label limits", () => {
  assert.deepEqual(validateTask({ title: "Fix login", estimate: "" }), {});
  assert.deepEqual(validateTask({ title: "Fix", estimate: "3", labels: ["a"] }), {});
  assert.ok(validateTask({ title: "  ", estimate: "" }).title);
  assert.ok(validateTask({ title: "x".repeat(256), estimate: "" }).title);
  assert.deepEqual(validateTask({ title: "x".repeat(255) }), {});
  assert.ok(validateTask({ title: "Fix", estimate: "-1" }).estimate);
  assert.ok(validateTask({ title: "Fix", estimate: "2.5" }).estimate);
  assert.ok(validateTask({ title: "Fix", estimate: "abc" }).estimate);
  assert.ok(validateTask({ title: "Fix", labels: Array.from({ length: 21 }, (_, i) => `l${i}`) }).labels);
  assert.ok(validateTask({ title: "Fix", labels: ["x".repeat(51)] }).labels);
});

test("validateSprint checks capacity and dates; starting needs both dates", () => {
  assert.deepEqual(validateSprint({ capacity: "", startDate: "", endDate: "" }), {});
  assert.ok(validateSprint({ capacity: "-3" }).capacity);
  assert.ok(validateSprint({ startDate: "2026-11-10", endDate: "2026-11-01" }).endDate);
  const start = validateSprint({ startDate: "", endDate: "" }, { requireDates: true });
  assert.ok(start.startDate && start.endDate);
});
