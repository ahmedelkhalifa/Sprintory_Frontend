import { insertAfter, sumEstimates } from "./task.js";

// "done" is the board's last column (ASSUMED, dev-docs/tasks.md): the backend's columns carry no done marker
export const doneColumnId = (columns) => (columns.length > 0 ? columns[columns.length - 1].id : null);

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

// how far a sprint is: tasks and estimate points, done (in the last column) and in total
export const sprintProgress = (tasks, columns) => {
  const doneId = doneColumnId(columns);
  const done = tasks.filter((task) => task.statusId === doneId);
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
