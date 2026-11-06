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

// a column's category (TODO / IN_PROGRESS / DONE). A backend from before R16 sends none: then the first column
// is "to do", the last "done" and the rest "in progress"
export const columnCategory = (column, columns) => {
  if (column.category) return column.category;
  const index = columns.findIndex((c) => c.id === column.id);
  if (index === columns.length - 1) return "DONE";
  if (index === 0) return "TODO";
  return "IN_PROGRESS";
};

// a task's stage is its column's category
export const taskStage = (statusId, columns) => {
  const column = columns.find((c) => c.id === statusId);
  return column ? columnCategory(column, columns) : "IN_PROGRESS";
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

// a task's current values in the form's shape, the one taskChanges and validateTask take. The task page edits one
// field at a time: it overrides that field and sends taskChanges(task, { ...taskValues(task), field })
export const taskValues = (task) => ({
  title: task.title,
  description: task.description ?? "",
  type: task.type,
  priority: task.priority,
  statusId: task.statusId,
  estimate: task.estimate ?? "",
  labels: task.labels ?? [],
  assigneeId: task.assigneeId ?? null,
});

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

// ----- subtasks (backend tasks-docs §10): title, status, assignee and a time estimate in minutes, nothing else -----

// a subtask's values in the form's shape, the one subtaskChanges and validateSubtask take
export const subtaskValues = (subtask) => ({
  title: subtask.title,
  statusId: subtask.statusId,
  assigneeId: subtask.assigneeId ?? null,
  estimateMinutes: subtask.estimateMinutes ?? "",
});

// The PATCH body for a subtask: only what changed. An emptied assignee or time goes as `clearAssignee` /
// `clearEstimateMinutes`, because null there means "unchanged"
export const subtaskChanges = (subtask, values) => {
  const changes = {};
  const title = values.title.trim();
  if (title !== subtask.title) changes.title = title;
  if (values.statusId !== subtask.statusId) changes.statusId = values.statusId;

  if (values.assigneeId !== (subtask.assigneeId ?? null)) {
    if (values.assigneeId === null) changes.clearAssignee = true;
    else changes.assigneeId = values.assigneeId;
  }

  const blank = values.estimateMinutes === "" || values.estimateMinutes == null;
  const minutes = blank ? null : Number(values.estimateMinutes);
  if (minutes !== (subtask.estimateMinutes ?? null)) {
    if (minutes === null) changes.clearEstimateMinutes = true;
    else changes.estimateMinutes = minutes;
  }
  return changes;
};

// a time estimate in minutes the way people read it: 90 → "1h 30m", 45 → "45m", 120 → "2h"; "" for none
export const formatMinutes = (minutes) => {
  if (minutes == null || minutes === "") return "";
  const total = Math.round(Number(minutes));
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  if (!hours) return `${rest}m`;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
};

// a parent's "3 / 5 done" from its response (the backend counts subtasks in Done-category columns)
export const subtaskProgress = (task) => {
  const total = task.subtaskTotal ?? 0;
  const done = Math.min(task.subtaskDone ?? 0, total);
  return { done, total, percent: total ? Math.round((done / total) * 100) : 0 };
};

// is this the backend's "the parent still has open subtasks" refusal (tasks-docs.md §10.3)? Then the move needs
// a confirmation (OpenSubtasksDialog) and goes again with `confirmOpenSubtasks: true`
export const needsSubtaskConfirmation = (err) => err?.response?.data?.code === "OPEN_SUBTASKS_CONFIRMATION_REQUIRED";

// the delete confirmation's text; deleting a parent deletes its subtasks too (backend tasks-docs.md)
export const deleteTaskMessage = (task) => {
  const subtasks = task.subtaskTotal ?? 0;
  const also = subtasks > 0 ? ` Its ${subtasks === 1 ? "subtask" : `${subtasks} subtasks`} will be deleted too.` : "";
  return `${task.key} "${task.title}" will be deleted.${also} This can't be undone.`;
};

// two loads of the same feed (page 0 again after a save, plus pages from "Load more") as one list, oldest first,
// each entry once. The feed is append-only, so an entry never changes between loads
export const mergeHistory = (...lists) => {
  const byId = new Map();
  for (const entry of lists.flat()) byId.set(entry.id, entry);
  return [...byId.values()].sort((a, b) => new Date(a.occurredAt) - new Date(b.occurredAt) || a.id - b.id);
};

// what a changed field is called in a history line
const HISTORY_FIELDS = {
  TITLE: "title",
  TYPE: "type",
  PRIORITY: "priority",
  STATUS: "status",
  ESTIMATE: "story points",
  ESTIMATE_MINUTES: "time estimate",
  LABELS: "labels",
};

// enum values come as stored ("HIGHEST"); every type and priority label is the value in sentence case
const enumLabel = (value) => value.charAt(0) + value.slice(1).toLowerCase();

const historyValue = (field, value) => {
  if (value == null || value === "") return "None";
  if (field === "TYPE" || field === "PRIORITY") return enumLabel(value);
  if (field === "ESTIMATE_MINUTES") return formatMinutes(value);
  return value;
};

/**
 * One entry of a task's activity feed (backend task-history-docs.md §3–4) as the words after the person's name:
 * { text } and, for a change from one value to another, `from` / `to` plus `kind` ("status": column chips,
 * "values": plain text). `subtask` says whether the feed is a subtask's ("created the subtask").
 */
export const historyLine = (entry, { subtask = false } = {}) => {
  const { type, field, oldValue, newValue } = entry;
  switch (type) {
    case "CREATED":
      return { text: `created the ${subtask ? "subtask" : "task"}` };
    case "RESTORED":
      return { text: `restored the ${subtask ? "subtask" : "task"}` };
    case "COMMENT_DELETED":
      return { text: "deleted a comment" };
    // the value is the subtask's key and title, e.g. "MOB-57 Write tests"
    case "SUBTASK_ADDED":
      return { text: `added subtask ${newValue ?? ""}`.trim() };
    case "SUBTASK_REMOVED":
      return { text: `removed subtask ${oldValue ?? ""}`.trim() };
    case "FIELD_CHANGED":
      break;
    default:
      return { text: "updated the task" }; // a type added after this was written
  }

  if (field === "DESCRIPTION") return { text: "changed the description" };
  if (field === "ASSIGNEE") {
    if (oldValue == null && newValue != null) return { text: `assigned it to ${newValue}` };
    if (newValue == null && oldValue != null) return { text: `unassigned ${oldValue}` };
    return { text: "changed the assignee", from: historyValue(field, oldValue), to: historyValue(field, newValue), kind: "values" };
  }
  const name = HISTORY_FIELDS[field];
  if (!name) return { text: "updated the task" };
  return {
    text: `changed the ${name}`,
    from: historyValue(field, oldValue),
    to: historyValue(field, newValue),
    kind: field === "STATUS" ? "status" : "values",
  };
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
