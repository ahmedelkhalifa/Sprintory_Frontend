import { PERMISSIONS } from "../constants/projects.js";
import { can, projectPath } from "./project.js";

// the full task page (built separately); the backlog's drawer links to it
export const taskPath = (project, taskId) => `${projectPath(project)}/tasks/${taskId}`;

// tasks without an estimate count as 0
export const sumEstimates = (tasks) => tasks.reduce((sum, task) => sum + (Number(task.estimate) || 0), 0);

// "3", "2.5", or "" for no estimate; sums are rounded so 0.1 + 0.2 shows as "0.3"
export const formatEstimate = (value) =>
  value == null || value === "" ? "" : String(Math.round(Number(value) * 100) / 100);

// where a task is: { task, sprintId (null = backlog), index } or null
export const findTask = (state, taskId) => {
  const inBacklog = state.backlog.findIndex((task) => task.id === taskId);
  if (inBacklog !== -1) return { task: state.backlog[inBacklog], sprintId: null, index: inBacklog };
  for (const sprint of state.sprints) {
    const index = sprint.tasks.findIndex((task) => task.id === taskId);
    if (index !== -1) return { task: sprint.tasks[index], sprintId: sprint.id, index };
  }
  return null;
};

/**
 * Moves a task in a backlog response ({ sprints: [{ ...sprint, tasks }], backlog }) and returns a new one.
 * `sprintId` null is the backlog; `beforeTaskId` null puts the task at the end of that list.
 * Unknown tasks or sprints leave the state as it is.
 */
export const moveTask = (state, { taskId, sprintId = null, beforeTaskId = null }) => {
  const from = findTask(state, taskId);
  if (!from) return state;
  if (sprintId !== null && !state.sprints.some((sprint) => sprint.id === sprintId)) return state;

  const moved = { ...from.task, sprintId };
  const place = (tasks, listId) => {
    const next = tasks.filter((task) => task.id !== taskId);
    if (listId !== sprintId) return next;
    const before = beforeTaskId === null ? -1 : next.findIndex((task) => task.id === beforeTaskId);
    next.splice(before === -1 ? next.length : before, 0, moved);
    return next;
  };

  return {
    ...state,
    backlog: place(state.backlog, null),
    sprints: state.sprints.map((sprint) => ({ ...sprint, tasks: place(sprint.tasks, sprint.id) })),
  };
};

// ordering the backlog is the Product Owner's (R13); anything touching a sprint is planning (R14)
export const movePermission = (fromSprintId, toSprintId) =>
  fromSprintId === null && toSprintId === null ? PERMISSIONS.MANAGE_BACKLOG : PERMISSIONS.MANAGE_SPRINTS;

export const canMoveTask = (project, fromSprintId, toSprintId) =>
  can(project, movePermission(fromSprintId, toSprintId));

// search on title, key and labels, ignoring case
export const filterTasks = (tasks, query) => {
  const q = query.trim().toLowerCase();
  if (!q) return tasks;
  return tasks.filter(
    (task) =>
      task.title.toLowerCase().includes(q) ||
      task.key?.toLowerCase().includes(q) ||
      task.labels?.some((label) => label.toLowerCase().includes(q)),
  );
};

// every label used in the project, for the label picker's suggestions
export const projectLabels = (state) => {
  const tasks = [...state.backlog, ...state.sprints.flatMap((sprint) => sprint.tasks)];
  return [...new Set(tasks.flatMap((task) => task.labels ?? []))].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  );
};

const LABEL_TONES = ["primary.main", "success.main", "warning.main", "error.main", "info.main", "secondary.main"];

// the same label always gets the same color
export const labelTone = (label) => {
  let hash = 0;
  for (const ch of label.toLowerCase()) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  return LABEL_TONES[Math.abs(hash) % LABEL_TONES.length];
};
