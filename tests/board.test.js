import test from "node:test";
import assert from "node:assert/strict";
import { boardMove, daysLeft, doneColumnId, groupByColumn, overWip, sprintProgress } from "../src/utils/board.js";

const COLUMNS = [
  { id: 1, name: "To Do", wipLimit: null },
  { id: 2, name: "In Progress", wipLimit: 2 },
  { id: 3, name: "Done", wipLimit: null },
];
const task = (id, statusId, estimate = null) => ({ id, statusId, statusName: COLUMNS.find((c) => c.id === statusId).name, estimate });
// board order: To Do 10, 11; In Progress 20; Done 30
const tasks = () => [task(10, 1, 3), task(11, 1), task(20, 2, 5), task(30, 3, 2)];
const ids = (list) => list.map((t) => t.id);

test("the last column is the done column", () => {
  assert.equal(doneColumnId(COLUMNS), 3);
  assert.equal(doneColumnId([]), null);
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

test("sprintProgress counts tasks and estimates in the last column as done", () => {
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
