// TEMP in-browser stand-in for the sprint endpoints, until the backend has sprints (R14/R15, dev-docs/tasks.md).
// On unless VITE_MOCK_SPRINTS=false. Sprints live in localStorage per browser; the tasks themselves are real.
// It answers with the assumed response shapes and the backend's error shape, and checks the caller's real
// project permissions (GET /projects/{id}), so the UI behaves as it will against the real API.
// Delete this file (and the MOCK_SPRINTS branches in sprintsApi.js) once the endpoints exist.
import { getBoard, getProject } from "../api/projectsApi";
import { getTask, listAllTasks } from "../api/tasksApi";
import { PERMISSIONS } from "../constants/projects";
import { doneColumnId } from "../utils/board";
import { insertAfter } from "../utils/task";
import { validateSprint } from "../utils/validation";

export const MOCK_SPRINTS = import.meta.env.VITE_MOCK_SPRINTS !== "false";

const STORAGE_KEY = "sprintory.mock.sprints";
const DELAY_MS = 200;

// ---- storage ----

const load = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? { nextId: 1, projects: {} };
  } catch {
    return { nextId: 1, projects: {} };
  }
};

const save = (store) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // private mode or full storage: changes only last until the page reloads
  }
};

// a project's sprints, created empty on first use
const projectData = (store, projectId) => {
  store.projects[projectId] ??= { sprintCount: 0, sprints: [] };
  return store.projects[projectId];
};

// ---- backend-like behaviour ----

const wait = (signal) =>
  new Promise((resolve, reject) => {
    const abort = () => reject({ code: "ERR_CANCELED", message: "canceled" });
    if (signal?.aborted) return abort();
    const timer = setTimeout(resolve, DELAY_MS);
    signal?.addEventListener("abort", () => {
      clearTimeout(timer);
      abort();
    });
  });

// thrown errors look like axios errors from the real backend, so errorMessage / useSubmit work unchanged
const fail = (status, code, message, fieldErrors) => {
  throw { response: { status, data: { status, code, message, ...(fieldErrors && { fieldErrors }) } } };
};
const notFound = () => fail(404, "RESOURCE_NOT_FOUND", "Sprint not found.");

// loads the real project: a 404 there is a 404 here, and its permissions decide what the caller may do
const access = async (projectId, permission) => {
  const project = await getProject(projectId);
  if (project.template !== "SCRUM") fail(400, "BAD_REQUEST", "Sprints are only available in Scrum projects.");
  if (!project.permissions.includes(PERMISSIONS.VIEW_WORK)) fail(403, "ACCESS_DENIED", "You do not have access to this resource.");
  if (permission && !project.permissions.includes(permission)) fail(403, "ACCESS_DENIED", "You do not have access to this resource.");
  return project;
};

const checkFields = (errors) => {
  if (Object.keys(errors).length > 0) fail(400, "VALIDATION_ERROR", "Request validation failed.", errors);
};

const copy = (value) => structuredClone(value);
const toNumber = (value) => (value === "" || value == null ? null : Number(value));

const projectOfSprint = (store, sprintId) =>
  Object.entries(store.projects).find(([, data]) => data.sprints.some((sprint) => sprint.id === sprintId))?.[0];

// the stored sprint and its project's data, or a 404
const findSprint = (store, sprintId) => {
  const projectId = projectOfSprint(store, sprintId) ?? notFound();
  const data = store.projects[projectId];
  return { projectId: Number(projectId), data, sprint: data.sprints.find((s) => s.id === sprintId) };
};

const newSprint = (store, project, data, body = {}) => {
  data.sprintCount += 1;
  return {
    id: store.nextId++,
    projectId: project.id,
    name: body.name?.trim() || `${project.key ?? project.name} Sprint ${data.sprintCount}`,
    goal: body.goal?.trim() ?? "",
    capacity: toNumber(body.capacity),
    startDate: body.startDate || null,
    endDate: body.endDate || null,
    status: "PLANNED",
    taskIds: [],
    completedAt: null,
  };
};

// ---- the endpoints ----

// planned and active sprints, each with the ids of its tasks in sprint order
export const listSprints = async (projectId, signal) => {
  await access(projectId);
  await wait(signal);
  const sprints = load().projects[projectId]?.sprints ?? [];
  return copy(sprints.filter((sprint) => sprint.status !== "COMPLETED"));
};

export const createSprint = async (projectId, body) => {
  const project = await access(projectId, PERMISSIONS.MANAGE_SPRINTS);
  await wait();
  checkFields(validateSprint(body));
  const store = load();
  const data = projectData(store, projectId);
  const sprint = newSprint(store, project, data, body);
  data.sprints.push(sprint);
  save(store);
  return copy(sprint);
};

const SPRINT_FIELDS = ["name", "goal", "capacity", "startDate", "endDate"];

export const updateSprint = async (sprintId, body) => {
  const { projectId } = findSprint(load(), sprintId);
  await access(projectId, PERMISSIONS.MANAGE_SPRINTS);
  await wait();
  const store = load();
  const { data, sprint: current } = findSprint(store, sprintId);
  if (current.status === "COMPLETED") fail(409, "CONFLICT", "A completed sprint can't be changed.");
  const changes = Object.fromEntries(Object.entries(body).filter(([field]) => SPRINT_FIELDS.includes(field)));
  const updated = {
    ...current,
    ...changes,
    name: (changes.name ?? current.name).trim() || current.name,
    goal: (changes.goal ?? current.goal).trim(),
    capacity: "capacity" in changes ? toNumber(changes.capacity) : current.capacity,
    startDate: ("startDate" in changes ? changes.startDate : current.startDate) || null,
    endDate: ("endDate" in changes ? changes.endDate : current.endDate) || null,
  };
  checkFields(validateSprint(updated, { requireDates: current.status === "ACTIVE" }));
  data.sprints = data.sprints.map((sprint) => (sprint.id === sprintId ? updated : sprint));
  save(store);
  return copy(updated);
};

// its tasks go back to their own places in the backlog (their backlog rank never changed)
export const deleteSprint = async (sprintId) => {
  const { projectId } = findSprint(load(), sprintId);
  await access(projectId, PERMISSIONS.MANAGE_SPRINTS);
  await wait();
  const store = load();
  const { data, sprint } = findSprint(store, sprintId);
  if (sprint.status !== "PLANNED") fail(409, "CONFLICT", "Only a planned sprint can be deleted.");
  data.sprints = data.sprints.filter((s) => s.id !== sprintId);
  save(store);
};

export const startSprint = async (sprintId, body) => {
  const { projectId } = findSprint(load(), sprintId);
  await access(projectId, PERMISSIONS.MANAGE_SPRINTS);
  await wait();
  const store = load();
  const { data, sprint } = findSprint(store, sprintId);
  if (sprint.status !== "PLANNED") fail(409, "CONFLICT", "Only a planned sprint can be started.");
  if (data.sprints.some((s) => s.status === "ACTIVE")) fail(409, "SPRINT_ALREADY_ACTIVE", "Another sprint is already active.");
  checkFields(validateSprint(body, { requireDates: true }));
  const started = {
    ...sprint,
    status: "ACTIVE",
    startDate: body.startDate,
    endDate: body.endDate,
    goal: body.goal?.trim() ?? sprint.goal,
  };
  data.sprints = data.sprints.map((s) => (s.id === sprintId ? started : s));
  save(store);
  return copy(started);
};

/**
 * Ends the active sprint. Its tasks in the board's last column are done and stay with it; the unfinished ones move
 * to the top of a planned sprint (`carryOverSprintId`), to a new planned sprint (`createSprint`), or back to the
 * backlog (neither). Answers { sprint, carriedOver, toSprint }.
 */
export const completeSprint = async (sprintId, { carryOverSprintId = null, createSprint: createNew = false } = {}) => {
  const { projectId } = findSprint(load(), sprintId);
  const project = await access(projectId, PERMISSIONS.MANAGE_SPRINTS);
  // the real board and tasks decide what is done
  const [board, tasks] = await Promise.all([getBoard(projectId), listAllTasks(projectId, "backlog")]);
  await wait();

  const store = load();
  const { data, sprint } = findSprint(store, sprintId);
  if (sprint.status !== "ACTIVE") fail(409, "CONFLICT", "Only the active sprint can be completed.");
  const target = carryOverSprintId === null ? null : data.sprints.find((s) => s.id === carryOverSprintId);
  if (carryOverSprintId !== null && target?.status !== "PLANNED") {
    fail(400, "BAD_REQUEST", "Unfinished work can only move to a planned sprint.");
  }

  const doneId = doneColumnId(board.columns);
  const statusOf = new Map(tasks.map((task) => [task.id, task.statusId]));
  const existing = sprint.taskIds.filter((id) => statusOf.has(id));
  const done = existing.filter((id) => statusOf.get(id) === doneId);
  const unfinished = existing.filter((id) => statusOf.get(id) !== doneId);

  let toSprint = target;
  if (createNew) {
    toSprint = newSprint(store, project, data);
    data.sprints.push(toSprint);
  }
  data.sprints = data.sprints.map((s) => {
    if (s.id === sprintId) return { ...s, status: "COMPLETED", taskIds: done, completedAt: new Date().toISOString() };
    if (toSprint && s.id === toSprint.id) return { ...s, taskIds: [...unfinished, ...s.taskIds.filter((id) => !unfinished.includes(id))] };
    return s;
  });
  save(store);
  const completed = data.sprints.find((s) => s.id === sprintId);
  return copy({ sprint: completed, carriedOver: unfinished.length, toSprint: toSprint && data.sprints.find((s) => s.id === toSprint.id) });
};

// puts a task into a sprint right after `afterTaskId` (null = first), or takes it out (`sprintId` null)
export const moveToSprint = async (projectId, { taskId, sprintId = null, afterTaskId = null }) => {
  await access(projectId, PERMISSIONS.MANAGE_SPRINTS);
  await getTask(projectId, taskId); // a 404 for a task that's gone, as the backend would answer
  await wait();
  const store = load();
  const data = projectData(store, projectId);
  const target = sprintId === null ? null : (data.sprints.find((s) => s.id === sprintId) ?? notFound());
  if (target?.status === "COMPLETED") fail(409, "CONFLICT", "This sprint is already completed.");
  data.sprints = data.sprints.map((s) => {
    if (s.id === sprintId) return { ...s, taskIds: insertAfter(s.taskIds, taskId, afterTaskId, (id) => id) };
    // a completed sprint keeps its history
    if (s.status !== "COMPLETED") return { ...s, taskIds: s.taskIds.filter((id) => id !== taskId) };
    return s;
  });
  save(store);
};
