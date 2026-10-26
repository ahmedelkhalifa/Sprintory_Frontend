import { closestCorners, pointerWithin } from "@dnd-kit/core";

// ids for @dnd-kit: rows and lists share one id space, so they get prefixes.
// a list's id is its sprint id, or "backlog" for the product backlog (sprintId null)
export const rowId = (taskId) => `task:${taskId}`;
export const listId = (sprintId) => `list:${sprintId ?? "backlog"}`;

// the row under the pointer wins over the list around it; an empty list is hit directly.
// keyboard drags have no pointer and use the closest corners
export const collisionDetection = (args) => {
  const hits = pointerWithin(args);
  const rows = hits.filter((hit) => String(hit.id).startsWith("task:"));
  if (rows.length > 0) return rows;
  return hits.length > 0 ? hits : closestCorners(args);
};

// what a drop landed on: { sprintId, overTaskId } (overTaskId null = the list itself), or null
export const dropTarget = (over, findTask) => {
  const data = over?.data.current;
  if (!data) return null;
  if (data.list) return { sprintId: data.sprintId, overTaskId: null };
  const found = findTask(data.taskId);
  return found ? { sprintId: found.sprintId, overTaskId: data.taskId } : null;
};
