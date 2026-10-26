import { closestCorners, pointerWithin } from "@dnd-kit/core";

// ids for @dnd-kit: tasks and the lists around them share one id space, so they get prefixes.
// a backlog list's id is its sprint id, or "backlog" for the product backlog (sprintId null); a board list is a column
export const rowId = (taskId) => `task:${taskId}`;
export const listId = (sprintId) => `list:${sprintId ?? "backlog"}`;
export const columnListId = (statusId) => `column:${statusId}`;

// the task under the pointer wins over the list around it; an empty list is hit directly.
// keyboard drags have no pointer and use the closest corners
export const collisionDetection = (args) => {
  const hits = pointerWithin(args);
  const rows = hits.filter((hit) => String(hit.id).startsWith("task:"));
  if (rows.length > 0) return rows;
  return hits.length > 0 ? hits : closestCorners(args);
};

// true when the dragged task's middle is below the middle of the task it is over, i.e. it lands after that task
export const isBelow = (active, over) => {
  const dragged = active.rect.current.translated;
  return Boolean(dragged) && dragged.top + dragged.height / 2 > over.rect.top + over.rect.height / 2;
};

// what a backlog drop landed on: { sprintId, overTaskId } (overTaskId null = the list itself), or null
export const dropTarget = (over, findTask) => {
  const data = over?.data.current;
  if (!data) return null;
  if (data.list) return { sprintId: data.sprintId, overTaskId: null };
  const found = findTask(data.taskId);
  return found ? { sprintId: found.sprintId, overTaskId: data.taskId } : null;
};
