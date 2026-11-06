import test from "node:test";
import assert from "node:assert/strict";
import {
  backlogView,
  canMoveTask,
  deleteTaskMessage,
  describeTasks,
  findAssignee,
  findTask,
  formatEstimate,
  formatMinutes,
  historyLine,
  insertAfter,
  labelTone,
  mergeHistory,
  movePermission,
  moveInBacklog,
  needsSubtaskConfirmation,
  projectLabels,
  subtaskChanges,
  subtaskProgress,
  subtaskValues,
  sumEstimates,
  taskChanges,
  taskPath,
  taskStage,
  taskValues,
} from "../src/utils/task.js";
import { validateSprint, validateSubtask, validateTask } from "../src/utils/validation.js";

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
  assert.equal(taskPath({ id: 3, slug: "acme" }, { id: 7, workspaceId: 3 }, 42), "/workspaces/acme/projects/7/tasks/42");
});

test("taskValues gives a task's form values, so one changed field becomes the only change", () => {
  const current = task(1, { type: "TASK", priority: "MEDIUM", statusId: 11, labels: ["a"], description: null });
  const values = taskValues(current);
  assert.deepEqual(values, {
    title: "Task 1",
    description: "",
    type: "TASK",
    priority: "MEDIUM",
    statusId: 11,
    estimate: "",
    labels: ["a"],
    assigneeId: null,
  });
  assert.deepEqual(taskChanges(current, values), {});
  assert.deepEqual(taskChanges(current, { ...values, priority: "HIGH" }), { priority: "HIGH" });
  assert.deepEqual(taskChanges(current, { ...values, estimate: "2" }), { estimate: 2 });
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

test("taskStage: without categories, first column to do, last done, the rest in progress", () => {
  assert.equal(taskStage(11, COLUMNS), "TODO");
  assert.equal(taskStage(12, COLUMNS), "IN_PROGRESS");
  assert.equal(taskStage(13, COLUMNS), "DONE");
});

test("taskStage follows the column's category, wherever the column is", () => {
  // e.g. a PM moved "Done" before an extra "Archive" column of category TODO
  const columns = [
    { id: 11, name: "To Do", category: "TODO" },
    { id: 13, name: "Done", category: "DONE" },
    { id: 14, name: "Archive", category: "TODO" },
  ];
  assert.equal(taskStage(13, columns), "DONE");
  assert.equal(taskStage(14, columns), "TODO");
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

// ----- subtasks -----

const subtask = (extra = {}) => ({ id: 57, title: "Write tests", statusId: 11, assigneeId: null, estimateMinutes: null, ...extra });

test("subtaskChanges sends only what changed, and clear flags for an emptied assignee or time", () => {
  const current = subtask({ assigneeId: 7, estimateMinutes: 90 });
  const values = subtaskValues(current);
  assert.deepEqual(subtaskChanges(current, values), {});
  assert.deepEqual(subtaskChanges(current, { ...values, title: "  Write more tests " }), { title: "Write more tests" });
  assert.deepEqual(subtaskChanges(current, { ...values, statusId: 13 }), { statusId: 13 });
  assert.deepEqual(subtaskChanges(current, { ...values, assigneeId: null }), { clearAssignee: true });
  assert.deepEqual(subtaskChanges(current, { ...values, estimateMinutes: "" }), { clearEstimateMinutes: true });
  assert.deepEqual(subtaskChanges(current, { ...values, estimateMinutes: "45" }), { estimateMinutes: 45 });
  // never story points: a subtask's PATCH has no `estimate`
  assert.equal("estimate" in subtaskChanges(subtask(), { ...subtaskValues(subtask()), estimateMinutes: "30" }), false);
});

test("formatMinutes reads like a time", () => {
  assert.equal(formatMinutes(90), "1h 30m");
  assert.equal(formatMinutes(45), "45m");
  assert.equal(formatMinutes(120), "2h");
  assert.equal(formatMinutes(null), "");
  assert.equal(formatMinutes(""), "");
});

test("subtaskProgress: done of total, 0 % without subtasks", () => {
  assert.deepEqual(subtaskProgress({ subtaskDone: 3, subtaskTotal: 5 }), { done: 3, total: 5, percent: 60 });
  assert.deepEqual(subtaskProgress({}), { done: 0, total: 0, percent: 0 });
});

test("validateSubtask: title required, time in whole minutes of 1 or more, or empty", () => {
  assert.deepEqual(validateSubtask({ title: "Tests", estimateMinutes: "" }), {});
  assert.deepEqual(validateSubtask({ title: "Tests", estimateMinutes: "30" }), {});
  assert.ok(validateSubtask({ title: "  " }).title);
  assert.ok(validateSubtask({ title: "x".repeat(256) }).title);
  for (const bad of ["0", "-5", "1.5", "abc"]) assert.ok(validateSubtask({ title: "Tests", estimateMinutes: bad }).estimateMinutes, bad);
});

const entry = (type, field = null, oldValue = null, newValue = null) => ({ id: 1, type, field, oldValue, newValue });

test("historyLine: created, restored, comments and subtasks", () => {
  assert.deepEqual(historyLine(entry("CREATED")), { text: "created the task" });
  assert.deepEqual(historyLine(entry("CREATED"), { subtask: true }), { text: "created the subtask" });
  assert.deepEqual(historyLine(entry("RESTORED")), { text: "restored the task" });
  assert.deepEqual(historyLine(entry("COMMENT_DELETED")), { text: "deleted a comment" });
  assert.deepEqual(historyLine(entry("SUBTASK_ADDED", null, null, "MOB-57 Write tests")), {
    text: "added subtask MOB-57 Write tests",
  });
  assert.deepEqual(historyLine(entry("SUBTASK_REMOVED", null, "MOB-57 Write tests", null)), {
    text: "removed subtask MOB-57 Write tests",
  });
});

test("historyLine: field changes show both values, empty ones as None", () => {
  assert.deepEqual(historyLine(entry("FIELD_CHANGED", "STATUS", "To Do", "In Progress")), {
    text: "changed the status",
    from: "To Do",
    to: "In Progress",
    kind: "status",
  });
  const priority = historyLine(entry("FIELD_CHANGED", "PRIORITY", "LOW", "HIGHEST"));
  assert.deepEqual([priority.text, priority.from, priority.to, priority.kind], ["changed the priority", "Low", "Highest", "values"]);
  const type = historyLine(entry("FIELD_CHANGED", "TYPE", "TASK", "BUG"));
  assert.deepEqual([type.from, type.to], ["Task", "Bug"]);
  const estimate = historyLine(entry("FIELD_CHANGED", "ESTIMATE", null, "5"));
  assert.deepEqual([estimate.text, estimate.from, estimate.to], ["changed the story points", "None", "5"]);
  const minutes = historyLine(entry("FIELD_CHANGED", "ESTIMATE_MINUTES", "60", "90"));
  assert.deepEqual([minutes.text, minutes.from, minutes.to], ["changed the time estimate", "1h", "1h 30m"]);
  const labels = historyLine(entry("FIELD_CHANGED", "LABELS", "backend", null));
  assert.deepEqual([labels.from, labels.to], ["backend", "None"]);
  assert.deepEqual(historyLine(entry("FIELD_CHANGED", "DESCRIPTION")), { text: "changed the description" });
});

test("historyLine: assignee wording depends on what changed", () => {
  assert.deepEqual(historyLine(entry("FIELD_CHANGED", "ASSIGNEE", null, "Damir G")), { text: "assigned it to Damir G" });
  assert.deepEqual(historyLine(entry("FIELD_CHANGED", "ASSIGNEE", "Damir G", null)), { text: "unassigned Damir G" });
  const changed = historyLine(entry("FIELD_CHANGED", "ASSIGNEE", "Ada L", "Damir G"));
  assert.deepEqual([changed.text, changed.from, changed.to], ["changed the assignee", "Ada L", "Damir G"]);
});

test("historyLine: types and fields added later still get a line", () => {
  assert.deepEqual(historyLine(entry("SPRINT_SCOPE_CHANGED")), { text: "updated the task" });
  assert.deepEqual(historyLine(entry("FIELD_CHANGED", "DUE_DATE", "a", "b")), { text: "updated the task" });
});

test("mergeHistory keeps each entry once, oldest first", () => {
  const at = (id, day) => ({ id, occurredAt: `2026-11-0${day}T10:00:00Z` });
  const merged = mergeHistory([at(1, 1), at(2, 2)], [at(2, 2), at(3, 2), at(4, 3)]);
  assert.deepEqual(
    merged.map((e) => e.id),
    [1, 2, 3, 4],
  );
});

test("deleteTaskMessage warns that a parent's subtasks go with it", () => {
  assert.equal(deleteTaskMessage(task(1)), 'WR-1 "Task 1" will be deleted.');
  assert.equal(
    deleteTaskMessage(task(1, { subtaskTotal: 1 })),
    'WR-1 "Task 1" will be deleted. Its subtask will be deleted too.',
  );
  assert.match(deleteTaskMessage(task(1, { subtaskTotal: 3 })), /Its 3 subtasks will be deleted too/);
});

test("findAssignee names the assignee from the loaded people, else keeps the id", () => {
  const people = [{ userId: 7, firstName: "Ada" }];
  assert.equal(findAssignee(null, people), null);
  assert.equal(findAssignee(7, people).firstName, "Ada");
  assert.deepEqual(findAssignee(9, people), { userId: 9 });
});

test("needsSubtaskConfirmation spots only the open-subtasks refusal", () => {
  assert.equal(needsSubtaskConfirmation({ response: { data: { code: "OPEN_SUBTASKS_CONFIRMATION_REQUIRED" } } }), true);
  assert.equal(needsSubtaskConfirmation({ response: { data: { code: "CONFLICT" } } }), false);
  assert.equal(needsSubtaskConfirmation(new Error("network")), false);
});
