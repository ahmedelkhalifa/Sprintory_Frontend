import test from "node:test";
import assert from "node:assert/strict";
import {
  boardMove,
  columnContentsLabel,
  columnRules,
  daysLeft,
  defaultAfterColumnId,
  doneColumnIds,
  groupByColumn,
  moveColumnId,
  overWip,
  sprintProgress,
  wipWarningText,
} from "../src/utils/board.js";
import { validateBoardColumn, validateWipLimit } from "../src/utils/validation.js";

const COLUMNS = [
  { id: 1, name: "To Do", wipLimit: null },
  { id: 2, name: "In Progress", wipLimit: 2 },
  { id: 3, name: "Done", wipLimit: null },
];
const task = (id, statusId, estimate = null) => ({ id, statusId, statusName: COLUMNS.find((c) => c.id === statusId).name, estimate });
// board order: To Do 10, 11; In Progress 20; Done 30
const tasks = () => [task(10, 1, 3), task(11, 1), task(20, 2, 5), task(30, 3, 2)];
const ids = (list) => list.map((t) => t.id);

// a Kanban board as the backend sends it (with categories)
const KANBAN = [
  { id: 1, name: "Backlog", category: "TODO", wipLimit: null },
  { id: 2, name: "To Do", category: "TODO", wipLimit: null },
  { id: 3, name: "In Progress", category: "IN_PROGRESS", wipLimit: 3 },
  { id: 4, name: "Done", category: "DONE", wipLimit: null },
];
const kanban = { kanban: true, wipEnabled: true };
const scrum = { kanban: false, wipEnabled: false };

test("without categories, the last column is the done column", () => {
  assert.deepEqual([...doneColumnIds(COLUMNS)], [3]);
  assert.deepEqual([...doneColumnIds([])], []);
});

test("with categories, every DONE column is done, wherever it is", () => {
  const columns = [...KANBAN, { id: 5, name: "Shipped", category: "DONE" }, { id: 6, name: "Ideas", category: "TODO" }];
  assert.deepEqual([...doneColumnIds(columns)], [4, 5]);
});

test("groupByColumn keeps the columns' and the tasks' order", () => {
  const board = groupByColumn(COLUMNS, tasks());
  assert.deepEqual(board.map((c) => ids(c.tasks)), [[10, 11], [20], [30]]);
});

test("boardMove places a task after another in the target column and renames its status", () => {
  const next = boardMove(tasks(), COLUMNS, { taskId: 10, statusId: 2, afterTaskId: 20 });
  assert.deepEqual(groupByColumn(COLUMNS, next).map((c) => ids(c.tasks)), [[11], [20, 10], [30]]);
  assert.equal(next.find((t) => t.id === 10).statusName, "In Progress");
});

test("boardMove with no afterTaskId puts the task first in its column, also an empty one", () => {
  const first = boardMove(tasks(), COLUMNS, { taskId: 30, statusId: 1, afterTaskId: null });
  assert.deepEqual(groupByColumn(COLUMNS, first).map((c) => ids(c.tasks)), [[30, 10, 11], [20], []]);

  const empty = boardMove(boardMove(tasks(), COLUMNS, { taskId: 20, statusId: 3, afterTaskId: 30 }), COLUMNS, {
    taskId: 11,
    statusId: 2,
    afterTaskId: null,
  });
  assert.deepEqual(groupByColumn(COLUMNS, empty).map((c) => ids(c.tasks)), [[10], [11], [30, 20]]);
});

test("boardMove ignores unknown tasks or columns", () => {
  const before = tasks();
  assert.equal(boardMove(before, COLUMNS, { taskId: 99, statusId: 1 }), before);
  assert.equal(boardMove(before, COLUMNS, { taskId: 10, statusId: 99 }), before);
});

test("sprintProgress counts tasks and estimates in the done column as done", () => {
  assert.deepEqual(sprintProgress(tasks(), COLUMNS), { doneCount: 1, totalCount: 4, doneEstimate: 2, totalEstimate: 10 });
});

test("daysLeft counts the end date itself and stops at 0", () => {
  const today = new Date(2026, 9, 26); // Oct 26, 2026
  assert.equal(daysLeft("2026-10-30", today), 5);
  assert.equal(daysLeft("2026-10-26", today), 1);
  assert.equal(daysLeft("2026-10-20", today), 0);
  assert.equal(daysLeft(null, today), null);
});

test("overWip only applies to columns with a limit", () => {
  assert.equal(overWip(COLUMNS[1], 3), true);
  assert.equal(overWip(COLUMNS[1], 2), false);
  assert.equal(overWip(COLUMNS[0], 50), false);
});

test("columnRules: the Kanban backlog stays first, stays to do, has no limit and can't be deleted", () => {
  const rules = columnRules(KANBAN, 1, kanban);
  assert.equal(rules.backlog, true);
  assert.equal(rules.canMoveLeft, false);
  assert.equal(rules.canMoveRight, false);
  assert.equal(rules.canDelete, false);
  assert.equal(rules.categoryLocked, true);
  assert.equal(rules.canSetWip, false);
  // and nothing moves in front of it
  assert.equal(columnRules(KANBAN, 2, kanban).canMoveLeft, false);
  assert.equal(columnRules(KANBAN, 3, kanban).canMoveLeft, true);
});

test("columnRules: the only done column stays and keeps its category; no limit on done", () => {
  const rules = columnRules(KANBAN, 4, kanban);
  assert.equal(rules.canDelete, false);
  assert.match(rules.keepReason, /keep one "Done"/);
  assert.equal(rules.categoryLocked, true);
  assert.equal(rules.canSetWip, false);
  // with a second done column, either one may go
  const twoDone = [...KANBAN, { id: 5, name: "Shipped", category: "DONE" }];
  assert.equal(columnRules(twoDone, 4, kanban).canDelete, true);
  assert.equal(columnRules(twoDone, 4, kanban).categoryLocked, false);
});

test("columnRules: to do and in progress columns take a WIP limit, only on Kanban", () => {
  assert.equal(columnRules(KANBAN, 2, kanban).canSetWip, true);
  assert.equal(columnRules(KANBAN, 3, kanban).canSetWip, true);
  assert.equal(columnRules(KANBAN, 3, kanban).canDelete, true);
  assert.equal(columnRules(KANBAN, 3, scrum).canSetWip, false);
});

test("columnRules: a board keeps at least 2 columns; Scrum's first column moves like any other", () => {
  const two = [
    { id: 1, name: "To Do", category: "TODO" },
    { id: 2, name: "Done", category: "DONE" },
  ];
  assert.match(columnRules(two, 1, scrum).keepReason, /at least 2/);
  assert.equal(columnRules(KANBAN, 1, scrum).backlog, false);
  assert.equal(columnRules(KANBAN, 1, scrum).canMoveRight, true);
});

test("defaultAfterColumnId puts a new column right before the first done column", () => {
  assert.equal(defaultAfterColumnId(KANBAN), 3);
  assert.equal(defaultAfterColumnId(COLUMNS), 2); // no categories: the last column is done
  assert.equal(defaultAfterColumnId([]), null);
});

test("moveColumnId swaps a column with its neighbour and ignores moves off the board", () => {
  assert.deepEqual(moveColumnId(KANBAN, 3, 1), [1, 2, 4, 3]);
  assert.deepEqual(moveColumnId(KANBAN, 3, -1), [1, 3, 2, 4]);
  assert.deepEqual(moveColumnId(KANBAN, 4, 1), [1, 2, 3, 4]);
});

test("validateBoardColumn: name required, at most 100 characters, unique ignoring case", () => {
  assert.deepEqual(validateBoardColumn({ name: "In Review" }, KANBAN), {});
  assert.deepEqual(validateBoardColumn({ name: "  " }, KANBAN), { name: "Column name is required" });
  assert.deepEqual(validateBoardColumn({ name: "x".repeat(101) }, KANBAN), { name: "Use at most 100 characters" });
  assert.deepEqual(validateBoardColumn({ name: " in progress " }, KANBAN), { name: "Another column already has this name" });
  // renaming a column to its own name (another case) is fine
  assert.deepEqual(validateBoardColumn({ name: "IN PROGRESS" }, KANBAN, 3), {});
});

test("validateWipLimit refuses 0, negatives, decimals and text", () => {
  assert.equal(validateWipLimit("3"), "");
  assert.equal(validateWipLimit(" 12 "), "");
  for (const bad of ["0", "-1", "2.5", "abc", "", "1000"]) assert.notEqual(validateWipLimit(bad), "", bad);
});

test("wipWarningText names the column over its limit, or falls back to the backend's message", () => {
  assert.equal(wipWarningText(null, COLUMNS), null);
  assert.equal(
    wipWarningText({ columnId: 2, count: 3, limit: 2, message: "over" }, COLUMNS),
    "In Progress is over its WIP limit (3 / 2). The task was still moved.",
  );
  assert.equal(wipWarningText({ columnId: 99, count: 3, limit: 2, message: "Column is over its limit." }, COLUMNS), "Column is over its limit.");
});

test("columnContentsLabel names the tasks and subtasks a column holds", () => {
  assert.equal(columnContentsLabel({ tasks: 0, subtasks: 0 }), "");
  assert.equal(columnContentsLabel({ tasks: 1 }), "1 task");
  assert.equal(columnContentsLabel({ subtasks: 2 }), "2 subtasks");
  assert.equal(columnContentsLabel({ tasks: 3, subtasks: 1 }), "3 tasks and 1 subtask");
});
