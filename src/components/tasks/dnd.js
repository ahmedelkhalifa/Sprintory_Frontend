import { closestCorners, defaultDropAnimationSideEffects, getClientRect, pointerWithin } from "@dnd-kit/core";
import { SPRING, prefersReducedMotion } from "../../theme/motion";

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

// The dragged copy is measured at its normal size, not lifted (scaled): otherwise the drop aims it a few px off
// and the card jumps when it takes the copy's place. For the DndContext's `measuring`.
export const DND_MEASURING = { dragOverlay: { measure: (node) => getClientRect(node, { ignoreTransform: true }) } };

// On drop the dragged copy glides into the spot it lands in (or back home, if the move didn't happen) and settles
// from its lifted size back to normal, without overshooting; the card itself stays hidden until the copy is there.
// A keyboard drag and reduced motion drop in place at once (null).
const DROP_MS = 300;
const hideOriginal = defaultDropAnimationSideEffects({ styles: { active: { opacity: "0" } } });
const DROP_ANIMATION = {
  duration: DROP_MS,
  easing: SPRING.easing,
  sideEffects: (params) => {
    const cleanup = hideOriginal(params);
    // the copy's content (BoardCardContent / TaskRowContent, lifted): back to its normal size, its shadow fading
    const content = params.dragOverlay.node.firstElementChild;
    if (content) {
      const timing = { duration: DROP_MS, easing: SPRING.easing, fill: "forwards" };
      const scale = getComputedStyle(content).transform;
      content.animate([{ transform: scale === "none" ? "none" : scale }, { transform: "none" }], timing);
      content.animate([{ opacity: 1 }, { opacity: 0 }], { ...timing, pseudoElement: "::after" });
    }
    return cleanup;
  },
};
export const dropAnimationFor = (byKeyboard) => (byKeyboard || prefersReducedMotion() ? null : DROP_ANIMATION);

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
