import { columnCategory, insertAfter, sumEstimates } from "./task.js";

// the "done" columns: the ones of category DONE (a board can have several)
export const doneColumnIds = (columns) =>
  new Set(columns.filter((column) => columnCategory(column, columns) === "DONE").map((column) => column.id));

// the columns in order, each with its tasks in the order given
export const groupByColumn = (columns, tasks) =>
  columns.map((column) => ({ ...column, tasks: tasks.filter((task) => task.statusId === column.id) }));

/**
 * One drag and drop on the board, applied to the task list (in board order): the task goes into column `statusId`,
 * right after `afterTaskId`, or first in that column when it is null. Mirrors PUT /tasks/{id}/position.
 */
export const boardMove = (tasks, columns, { taskId, statusId, afterTaskId = null }) => {
  const task = tasks.find((t) => t.id === taskId);
  const column = columns.find((c) => c.id === statusId);
  if (!task || !column) return tasks;
  const moved = { ...task, statusId, statusName: column.name };
  if (afterTaskId !== null) return insertAfter(tasks, moved, afterTaskId);

  // first in its column: before the column's current first task, or after the last task of an earlier column
  const rest = tasks.filter((t) => t.id !== taskId);
  const firstInColumn = rest.findIndex((t) => t.statusId === statusId);
  if (firstInColumn !== -1) return [...rest.slice(0, firstInColumn), moved, ...rest.slice(firstInColumn)];
  const earlier = new Set(columns.slice(0, columns.indexOf(column)).map((c) => c.id));
  const lastEarlier = rest.findLastIndex((t) => earlier.has(t.statusId));
  return [...rest.slice(0, lastEarlier + 1), moved, ...rest.slice(lastEarlier + 1)];
};

// how far a sprint is: tasks and estimate points, done (in a DONE column) and in total
export const sprintProgress = (tasks, columns) => {
  const doneIds = doneColumnIds(columns);
  const done = tasks.filter((task) => doneIds.has(task.statusId));
  return {
    doneCount: done.length,
    totalCount: tasks.length,
    doneEstimate: sumEstimates(done),
    totalEstimate: sumEstimates(tasks),
  };
};

// whole days from `today` to the end date ("2026-11-08"), counting the end date itself; 0 once it has passed
export const daysLeft = (endDate, today = new Date()) => {
  if (!endDate) return null;
  const [y, m, d] = endDate.split("-").map(Number);
  const end = Date.UTC(y, m - 1, d);
  const now = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.max(0, Math.round((end - now) / 86400000) + 1);
};

// a column over its work-in-progress limit (Kanban); no limit is never over
export const overWip = (column, count) => column.wipLimit != null && count > column.wipLimit;

// ----- configuring the columns (R16, backend docs/board-docs.md) -----

export const MIN_COLUMNS = 2;
export const MAX_COLUMNS = 10;

const CATEGORY_NAME = { TODO: "To do", DONE: "Done" };

/**
 * What the board's settings allow for one column; the backend refuses the rest with a message.
 * `kanban`: the first column is the backlog, which stays first, stays "to do", has no WIP limit and can't be deleted.
 * A board always keeps one "to do" and one "done" column, so the last of either keeps its category and stays.
 * WIP limits (`wipEnabled`, Kanban only) never go on the backlog or a "done" column.
 */
export const columnRules = (columns, columnId, { kanban, wipEnabled }) => {
  const index = columns.findIndex((column) => column.id === columnId);
  const category = columnCategory(columns[index], columns);
  const backlog = kanban && index === 0;
  const onlyOfCategory =
    category in CATEGORY_NAME && columns.filter((column) => columnCategory(column, columns) === category).length === 1;

  let keepReason = null; // why it can't be deleted
  if (backlog) keepReason = "The backlog always stays";
  else if (columns.length <= MIN_COLUMNS) keepReason = `A board needs at least ${MIN_COLUMNS} columns`;
  else if (onlyOfCategory) keepReason = `A board must keep one "${CATEGORY_NAME[category]}" column`;

  return {
    backlog,
    // nothing goes in front of the Kanban backlog
    canMoveLeft: !backlog && index > (kanban ? 1 : 0),
    canMoveRight: !backlog && index < columns.length - 1,
    canDelete: keepReason === null,
    keepReason,
    categoryLocked: backlog || onlyOfCategory,
    canSetWip: wipEnabled && !backlog && category !== "DONE",
  };
};

// where a new column goes unless the user picks: right before the first "done" column (so after In Progress)
export const defaultAfterColumnId = (columns) => {
  const firstDone = columns.findIndex((column) => columnCategory(column, columns) === "DONE");
  return (columns[firstDone - 1] ?? columns.at(-1))?.id ?? null;
};

// the column ids with `columnId` moved by `step` places (-1 = left, 1 = right), for the reorder request
export const moveColumnId = (columns, columnId, step) => {
  const ids = columns.map((column) => column.id);
  const from = ids.indexOf(columnId);
  const to = from + step;
  if (from === -1 || to < 0 || to >= ids.length) return ids;
  [ids[from], ids[to]] = [ids[to], ids[from]];
  return ids;
};
