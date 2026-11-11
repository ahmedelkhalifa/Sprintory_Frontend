import { doneColumnIds } from "./board.js";
import { taskStage } from "./task.js";

// highest first; a task without a priority counts as MEDIUM (the backend's default)
export const PRIORITY_ORDER = ["HIGHEST", "HIGH", "MEDIUM", "LOW", "LOWEST"];

const priorityRank = (priority) => {
  const index = PRIORITY_ORDER.indexOf(priority);
  return index === -1 ? PRIORITY_ORDER.indexOf("MEDIUM") : index;
};

// one project's share of "Assigned to me": its tasks that aren't in a done column, each with its project and stage
export const openAssigned = (project, columns, tasks) => {
  const done = doneColumnIds(columns);
  return tasks
    .filter((task) => !done.has(task.statusId))
    .map((task) => ({ task, project, stage: taskStage(task.statusId, columns) }));
};

// most urgent first, then the most recently changed (ISO dates compare as text)
export const sortMyWork = (items) =>
  [...items].sort(
    (a, b) =>
      priorityRank(a.task.priority) - priorityRank(b.task.priority) ||
      (b.task.updatedAt ?? "").localeCompare(a.task.updatedAt ?? "") ||
      a.task.id - b.task.id,
  );

const DAY_MS = 86400000;
const utcDay = (iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};
const todayUtc = (today) => Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());

/**
 * A sprint's days for the day-strip, from its start and end date ("2026-11-03"), both counted:
 * { total, current, overdue } where `current` is today's 0-based day (-1 before the start, `total` once it's past)
 * and `overdue` the days past the end date (0 while it runs). null without both dates.
 */
export const sprintDays = (sprint, today = new Date()) => {
  if (!sprint?.startDate || !sprint?.endDate) return null;
  const start = utcDay(sprint.startDate);
  const total = Math.max(1, Math.round((utcDay(sprint.endDate) - start) / DAY_MS) + 1);
  const offset = Math.round((todayUtc(today) - start) / DAY_MS);
  const current = Math.min(Math.max(offset, -1), total);
  return { total, current, overdue: Math.max(0, offset - total + 1) };
};

// "Day 4 of 10 · 7 days left", "Starts tomorrow", or "2 days past the end date"
export const sprintDaysText = (days) => {
  if (!days) return "";
  if (days.overdue > 0) return `${days.overdue} ${days.overdue === 1 ? "day" : "days"} past the end date`;
  if (days.current < 0) return "Not started yet";
  const left = days.total - days.current;
  return `Day ${days.current + 1} of ${days.total} · ${left === 1 ? "last day" : `${left} days left`}`;
};
