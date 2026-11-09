import { formatEstimate } from "./task.js";

// Pure helpers for sprints (backend sprints-docs.md; summary in dev-docs/sprints.md).

// the answer the Scrum Master gives when closing a sprint (sprints-docs §2, `goalAchieved`)
export const GOAL_ACHIEVED = [
  { value: "YES", label: "Yes" },
  { value: "PARTIALLY", label: "Partially" },
  { value: "NO", label: "No" },
];

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
