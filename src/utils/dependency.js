// Task dependencies (PMP-45, backend docs/dependencies-docs.md): pure helpers for the task page's Dependencies
// section, the Blocked marks on board cards and backlog rows, and the "move anyway?" confirmations.

// the two ways to add a link from a task's page; both make the same "A blocks B" link
export const DEPENDENCY_DIRECTIONS = {
  // this task is blocked by the picked one
  BLOCKED_BY: { value: "BLOCKED_BY", action: "Add blocker", listTitle: "Blocked by", empty: "Nothing blocks this task." },
  // this task blocks the picked one
  BLOCKS: { value: "BLOCKS", action: "Add blocked task", listTitle: "Blocks", empty: "This task doesn't block any other task." },
};

// the POST body for a link added on task `taskId` (backend §3): "Add blocker" makes the picked task the blocker,
// "Add blocked task" makes it the blocked one. The same pair gives the same body from either task
export const dependencyRequest = (direction, taskId, pickedId) =>
  direction === DEPENDENCY_DIRECTIONS.BLOCKS.value
    ? { blockerId: taskId, blockedId: pickedId }
    : { blockerId: pickedId, blockedId: taskId };

// the links already shown in a direction ({ blockedBy, blocks } from GET /tasks/{id}/dependencies)
const linksOf = (dependencies, direction) =>
  (direction === DEPENDENCY_DIRECTIONS.BLOCKS.value ? dependencies?.blocks : dependencies?.blockedBy) ?? [];

// The tasks the picker offers: top-level tasks of the project other than this one, without those already linked
// the same way. A task linked the other way stays: the backend refuses it as a cycle and the user sees why.
// `tasks` come from the project's task list (only top-level tasks; subtasks are left out anyway)
export const dependencyCandidates = (tasks, taskId, dependencies, direction) => {
  const linked = new Set(linksOf(dependencies, direction).map((link) => link.task.id));
  return tasks.filter((task) => task.id !== taskId && task.parentTaskId == null && !linked.has(task.id));
};

// "PMP-10 Build API" for a task summary ({ key, title })
export const dependencyTaskLabel = (task) => [task?.key, task?.title].filter(Boolean).join(" ");

// is a task summary still open, i.e. not in a column of category DONE? (the category, never the column's name)
export const isOpenDependency = (task) => task?.statusCategory !== "DONE";

// the open blockers of a task response (board cards, backlog rows, the task page); none for a response from a
// backend without dependencies yet
export const openBlockersOf = (task) => (task?.blocked ? (task.openBlockers ?? []) : []);

// the Blocked mark's tooltip: "Blocked by PMP-10 Build API" or "Blocked by 2 tasks: PMP-10 …, PMP-12 …"
export const blockedTooltip = (openBlockers = []) => {
  if (openBlockers.length === 0) return "";
  const names = openBlockers.map(dependencyTaskLabel);
  if (names.length === 1) return `Blocked by ${names[0]}`;
  return `Blocked by ${names.length} tasks: ${names.join(", ")}`;
};

// the error codes a link can be refused with, in our own words where the backend's are generic
export const DEPENDENCY_ERROR_MESSAGES = {
  DEPENDENCY_ALREADY_EXISTS: "These tasks are already linked this way.",
  ACCESS_DENIED: "You don't have permission to change dependencies.",
  RESOURCE_NOT_FOUND: "This task or link no longer exists, or you no longer have access to it.",
  WORKSPACE_ARCHIVED: "This workspace is archived. Restore it to make changes.",
  // the backend says why: a self-link, a subtask, a deleted task or one of another project
  BAD_REQUEST: null,
  // a completed or archived project: the backend's own words
  CONFLICT: null,
};

// a refused cycle as the path of keys: from the response's `cyclePath`, else read out of the message
// ("This would create a cycle: PMP-12 -> PMP-10 -> PMP-11 -> PMP-12."); [] when it isn't a cycle refusal
export const cyclePathOf = (err) => {
  const data = err?.response?.data;
  if (data?.code !== "DEPENDENCY_CYCLE") return [];
  if (Array.isArray(data.cyclePath) && data.cyclePath.length > 0) return data.cyclePath;
  const match = /:\s*(.+?)\.?$/.exec(data.message ?? "");
  return match ? match[1].split(/\s*->\s*/).filter(Boolean) : [];
};

// the text for a cycle refusal, always with the whole path, in the story's wording
export const cycleMessage = (path) =>
  path.length > 0 ? `This would create a cycle: ${path.join(" -> ")}.` : "This would create a cycle.";

// A move the backend wants confirmed first (both are allowed, they are warnings): a blocked task moving forward
// (409 BLOCKED_TASK_CONFIRMATION_REQUIRED, with its `openBlockers`) or a parent with open subtasks going into Done
// (409 OPEN_SUBTASKS_CONFIRMATION_REQUIRED). Answers { kind, flag, openBlockers } or null for any other error;
// after a yes the same request goes again with `[flag]: true`, keeping the flags of earlier confirmations
export const moveConfirmation = (err) => {
  const data = err?.response?.data;
  if (data?.code === "BLOCKED_TASK_CONFIRMATION_REQUIRED") {
    return { kind: "blocked", flag: "confirmBlocked", openBlockers: data.openBlockers ?? [] };
  }
  if (data?.code === "OPEN_SUBTASKS_CONFIRMATION_REQUIRED") {
    return { kind: "subtasks", flag: "confirmOpenSubtasks", openBlockers: [] };
  }
  return null;
};

// the request again after the user confirmed `confirmation`
export const confirmedMove = (request, confirmation) => ({ ...request, [confirmation.flag]: true });

// History entries of a link (backend §7): the value is a snapshot from the task's side, "Blocked by PMP-10" or
// "Blocks PMP-11", in newValue when added and oldValue when removed; refId is the other task.
// Answers { text, taskId?, taskKey? }, so the feed can link the other task's key
export const dependencyHistoryLine = (entry) => {
  const added = entry.type === "DEPENDENCY_ADDED";
  const value = (added ? entry.newValue : entry.oldValue) ?? "";
  const blockedBy = /^blocked by\s+(.+)$/i.exec(value);
  const blocks = /^blocks\s+(.+)$/i.exec(value);
  const key = (blockedBy ?? blocks)?.[1]?.trim();
  const link = key ? { taskKey: key, ...(entry.refId != null && { taskId: entry.refId }) } : {};

  if (blockedBy) return { text: added ? `added blocker ${key}` : `removed blocker ${key}`, ...link };
  if (blocks) return { text: added ? `added blocked task ${key}` : `removed blocked task ${key}`, ...link };
  return { text: added ? "added a dependency" : "removed a dependency" };
};
