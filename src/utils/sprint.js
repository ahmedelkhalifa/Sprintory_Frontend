import { projectTabPath } from "./project.js";
import { formatEstimate } from "./task.js";

// Pure helpers for sprints (backend sprints-docs.md; summary in dev-docs/sprints.md).

// the answer the Scrum Master gives when completing a sprint (sprints-docs §2, `goalAchieved`)
export const GOAL_ACHIEVED = [
  { value: "YES", label: "Yes" },
  { value: "PARTIALLY", label: "Partially" },
  { value: "NO", label: "No" },
];

export const goalAchievedLabel = (value) => GOAL_ACHIEVED.find((answer) => answer.value === value)?.label ?? "";

// closed (COMPLETED) or cancelled: read-only from then on, and no longer in GET /projects/{id}/sprints
export const isSprintEnded = (sprint) => sprint?.status === "COMPLETED" || sprint?.status === "CANCELLED";

// a sprint's own page, under the Sprints tab (it shows what an ended sprint saved)
export const sprintPath = (workspace, project, sprintId) => `${projectTabPath(workspace, project, "sprints")}/${sprintId}`;

/**
 * The body of POST /sprints/{id}/complete (PMP-41) from the Complete sprint window. `destination` is where the unfinished
 * work goes: "backlog" (the top of it), "planned" (the sprint `plannedSprintId`) or "new" (a sprint created on the
 * spot); the backend refuses both at once, so at most one is sent. `endsEarly` comes from the close preview: the
 * window has shown the early-close warning, so the request confirms it.
 */
export const completeSprintRequest = (
  { goalAchieved, goalNote = "", destination = "backlog", plannedSprintId = null },
  { endsEarly = false } = {},
) => {
  const carryOverSprintId = destination === "planned" ? plannedSprintId : null;
  return {
    goalAchieved,
    goalNote: goalNote.trim() || null,
    carryOverSprintId,
    createSprint: destination === "new" && carryOverSprintId === null,
    confirmEarlyClose: endsEarly,
  };
};

const items = (count) => `${count} ${count === 1 ? "item" : "items"}`;

// the message after completing or cancelling ({ carriedOver, toSprint } is the backend's answer; `ending` "completed"
// or "cancelled"): "Sprint completed. 2 items moved to the top of the backlog", "… moved to MOB Sprint 5",
// "Sprint completed"
export const sprintEndedText = ({ carriedOver = 0, toSprint = null } = {}, ending = "completed") => {
  if (!carriedOver) return `Sprint ${ending}`;
  return `Sprint ${ending}. ${items(carriedOver)} moved to ${toSprint ? toSprint.name : "the top of the backlog"}`;
};

// "Carried over ×2" on a task a completed or cancelled sprint left unfinished (`carriedOverCount`); subtasks move with
// their parent and never show it
export const carriedOverLabel = (task) =>
  task?.parentTaskId == null && task?.carriedOverCount > 0 ? `Carried over ×${task.carriedOverCount}` : "";

// tasks without story points; like the backend's `unestimatedTaskIds`, 0 is an estimate
export const countUnestimated = (tasks) => tasks.filter((task) => task.estimate == null || task.estimate === "").length;

/**
 * What the Create / Edit sprint window sends (sprints-docs §2). Creating sends every field ("" becomes null, so the
 * backend picks the name and the dates). Editing is a partial update: a blank name is left out, dates go as a pair
 * or not at all, and an emptied capacity is `clearCapacity: true` (a null capacity would mean "unchanged").
 */
export const sprintRequest = (values, { editing = false } = {}) => {
  const name = values.name.trim();
  const capacity = values.capacity === "" || values.capacity == null ? null : Number(values.capacity);
  const dates = values.startDate && values.endDate ? { startDate: values.startDate, endDate: values.endDate } : {};
  if (!editing) {
    return { name: name || null, goal: values.goal.trim(), capacity, startDate: null, endDate: null, ...dates };
  }
  return {
    ...(name && { name }),
    goal: values.goal.trim(),
    ...(capacity === null ? { clearCapacity: true } : { capacity }),
    ...dates,
  };
};

/**
 * The capacity suggestion (sprints-docs §3) in words: { suggested, text }. `suggested` is null before the project
 * has a completed sprint, since the suggestion comes from the average velocity of the last up to three.
 */
export const capacitySummary = (suggestion) => {
  const days = `${suggestion.availablePersonDays} of ${suggestion.normalPersonDays} person-days available`;
  if (suggestion.suggestedCapacity == null) {
    return { suggested: null, text: `No suggestion yet: it needs at least one completed sprint. ${days}.` };
  }
  return {
    suggested: suggestion.suggestedCapacity,
    text: `Average velocity ${formatEstimate(suggestion.averageVelocity)} points over the last completed sprints · ${days}`,
  };
};
