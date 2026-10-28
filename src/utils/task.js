import { PERMISSIONS } from "../constants/projects.js";
import { can, projectPath } from "./project.js";

// the full task page (built separately); the drawer links to it
export const taskPath = (workspace, project, taskId) => `${projectPath(workspace, project)}/tasks/${taskId}`;

// tasks without an estimate count as 0
export const sumEstimates = (tasks) => tasks.reduce((sum, task) => sum + (Number(task.estimate) || 0), 0);

// "3", or "" for no estimate; sums are rounded so 0.1 + 0.2 shows as "0.3"
export const formatEstimate = (value) =>
  value == null || value === "" ? "" : String(Math.round(Number(value) * 100) / 100);

// puts `item` into `list` right after the element with id `afterId` (null = first; unknown = last),
// like the backend's moves
export const insertAfter = (list, item, afterId, idOf = (x) => x.id) => {
  const next = list.filter((x) => idOf(x) !== idOf(item));
  if (afterId === null) return [item, ...next];
  const index = next.findIndex((x) => idOf(x) === afterId);
  next.splice(index === -1 ? next.length : index + 1, 0, item);
  return next;
};

/**
 * The Backlog tab's data is { tasks, sprints }: `tasks` are the project's tasks in backlog order (from the backend),
 * `sprints` the planned and active sprints, each with the ordered `taskIds` it holds (mocked until sprints exist).
 * backlogView turns that into the lists on screen: { sprints: [{ ...sprint, tasks }], backlog }, where the backlog is
 * every task in no sprint. Ids of deleted tasks are skipped.
 */
export const backlogView = ({ tasks, sprints }) => {
  const byId = new Map(tasks.map((task) => [task.id, task]));
  const planned = new Set(sprints.flatMap((sprint) => sprint.taskIds));
  return {
    sprints: sprints.map((sprint) => ({
      ...sprint,
      tasks: sprint.taskIds.map((id) => byId.get(id)).filter(Boolean),
    })),
    backlog: tasks.filter((task) => !planned.has(task.id)),
  };
};

// which list a task is in: { task, sprintId (null = backlog), index } in the view, or null
export const findTask = (view, taskId) => {
  const inBacklog = view.backlog.findIndex((task) => task.id === taskId);
  if (inBacklog !== -1) return { task: view.backlog[inBacklog], sprintId: null, index: inBacklog };
  for (const sprint of view.sprints) {
    const index = sprint.tasks.findIndex((task) => task.id === taskId);
    if (index !== -1) return { task: sprint.tasks[index], sprintId: sprint.id, index };
  }
  return null;
};

/**
 * Moves a task in the Backlog tab's data ({ tasks, sprints }) and returns new data.
 * `sprintId` null is the backlog; `afterTaskId` null puts the task first in that list.
 * Inside the backlog it changes the backlog order. Taken out of a sprint, a task goes back to its own place in the
 * backlog (its rank never changed), so `afterTaskId` is ignored then. Unknown tasks or sprints change nothing.
 */
export const moveInBacklog = (state, { taskId, sprintId = null, afterTaskId = null }) => {
  if (!state.tasks.some((task) => task.id === taskId)) return state;
  if (sprintId !== null && !state.sprints.some((sprint) => sprint.id === sprintId)) return state;
  const fromSprint = state.sprints.find((sprint) => sprint.taskIds.includes(taskId));

  const sprints = state.sprints.map((sprint) => {
    if (sprint.id === sprintId) return { ...sprint, taskIds: insertAfter(sprint.taskIds, taskId, afterTaskId, (id) => id) };
    if (sprint === fromSprint) return { ...sprint, taskIds: sprint.taskIds.filter((id) => id !== taskId) };
    return sprint;
  });
  if (sprintId !== null || fromSprint) return { ...state, sprints };

  // inside the backlog: the order of all tasks is the backlog order, sprint tasks only sit hidden in between
  const task = state.tasks.find((t) => t.id === taskId);
  return { ...state, tasks: insertAfter(state.tasks, task, afterTaskId) };
};

// ordering the backlog is the Product Owner's (R13); anything touching a sprint is planning (R14)
export const movePermission = (fromSprintId, toSprintId) =>
  fromSprintId === null && toSprintId === null ? PERMISSIONS.MANAGE_BACKLOG : PERMISSIONS.MANAGE_SPRINTS;

export const canMoveTask = (project, fromSprintId, toSprintId) =>
  can(project, movePermission(fromSprintId, toSprintId));

// a task's stage from its column: the first column is "to do", the last "done", the rest "in progress"
export const taskStage = (statusId, columns) => {
  if (columns.length > 0 && statusId === columns[columns.length - 1].id) return "DONE";
  if (columns.length > 0 && statusId === columns[0].id) return "TODO";
  return "IN_PROGRESS";
};

// adds what the screens show but the task response only refers to: the assignee (from the member list) and the stage
export const describeTasks = (tasks, { members = [], columns = [] }) => {
  const people = new Map(members.map((member) => [member.userId, member]));
  return tasks.map((task) => ({
    ...task,
    assignee: task.assigneeId == null ? null : (people.get(task.assigneeId) ?? { userId: task.assigneeId }),
    stage: taskStage(task.statusId, columns),
  }));
};

const sameLabels = (a, b) => a.length === b.length && a.every((label, i) => label === b[i]);

/**
 * The PATCH body for the task form: only the fields that changed. Emptied fields are sent as the backend's clear
 * flags (`clearAssignee`, `clearEstimate`, `clearDescription`), because null there means "unchanged".
 * `values` are the form's: strings for title, description and estimate, `assigneeId` a number or null.
 */
export const taskChanges = (task, values) => {
  const changes = {};
  const title = values.title.trim();
  if (title !== task.title) changes.title = title;
  for (const field of ["type", "priority", "statusId"]) {
    if (values[field] !== task[field]) changes[field] = values[field];
  }

  const description = values.description.trim();
  if (description !== (task.description ?? "")) {
    if (description) changes.description = description;
    else changes.clearDescription = true;
  }

  const estimate = values.estimate === "" ? null : Number(values.estimate);
  if (estimate !== (task.estimate ?? null)) {
    if (estimate === null) changes.clearEstimate = true;
    else changes.estimate = estimate;
  }

  if (values.assigneeId !== (task.assigneeId ?? null)) {
    if (values.assigneeId === null) changes.clearAssignee = true;
    else changes.assigneeId = values.assigneeId;
  }

  const labels = [...values.labels].sort();
  if (!sameLabels(labels, [...(task.labels ?? [])].sort())) changes.labels = labels;
  return changes;
};

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

// every label used in these tasks, for the label picker's suggestions
export const projectLabels = (tasks) =>
  [...new Set(tasks.flatMap((task) => task.labels ?? []))].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  );

const LABEL_TONES = ["primary.main", "success.main", "warning.main", "error.main", "info.main", "secondary.main"];

// the same label always gets the same color
export const labelTone = (label) => {
  let hash = 0;
  for (const ch of label.toLowerCase()) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  return LABEL_TONES[Math.abs(hash) % LABEL_TONES.length];
};
