// TEMP in-browser stand-in for the task and sprint endpoints, until the backend has them (dev-docs/tasks.md).
// On when VITE_MOCK_TASKS=true. Data lives in localStorage per browser, seeded per project on first use.
// It answers with the assumed response shapes and the same error shape as the backend, and checks the
// caller's real project permissions (GET /projects/{id}), so the UI behaves as it will against the real API.
// Delete this file (and the MOCK_TASKS branches in tasksApi / sprintsApi) once the endpoints exist.
import { getProject, listProjectMembers } from "../api/projectsApi";
import { PERMISSIONS } from "../constants/projects";
import { findTask, movePermission, moveTask as moveInState } from "../utils/task";
import { validateSprint, validateTask } from "../utils/validation";

export const MOCK_TASKS = import.meta.env.VITE_MOCK_TASKS === "true";

const STORAGE_KEY = "sprintory.mock.tasks";
const DELAY_MS = 250;

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
const notFound = () => fail(404, "RESOURCE_NOT_FOUND", "Not found.");

// loads the real project: a 404 there is a 404 here, and its permissions decide what the caller may do
const access = async (projectId, permission) => {
  const project = await getProject(projectId);
  if (project.template !== "SCRUM") fail(400, "BAD_REQUEST", "The backlog is only available in Scrum projects.");
  if (!project.permissions.includes(PERMISSIONS.VIEW_WORK)) fail(403, "ACCESS_DENIED", "You can't see this project's work.");
  if (permission && !project.permissions.includes(permission)) fail(403, "ACCESS_DENIED", "You don't have permission to do this.");
  if (permission && project.status === "ARCHIVED") fail(409, "PROJECT_ARCHIVED", "This project is archived.");
  return project;
};

const checkFields = (errors) => {
  if (Object.keys(errors).length > 0) fail(400, "VALIDATION_ERROR", "Validation failed.", errors);
};

const now = () => new Date().toISOString();
const copy = (value) => structuredClone(value);

// a sprint as the sprint endpoints return it: without its tasks
const sprintOnly = (sprint) => {
  const result = copy(sprint);
  delete result.tasks;
  return result;
};

// "Website Redesign" -> "WR"; the assumed project key wins when the project has one
const keyPrefix = (project) =>
  project.key ||
  project.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((word) => word[0].toUpperCase())
    .join("") ||
  "T";

const person = (member) =>
  member && { userId: member.userId, firstName: member.firstName, lastName: member.lastName, email: member.email };

// ---- seed data ----

const SEED = [
  ["Set up project structure", "TASK", "HIGH", 3, ["DevOps"]],
  ["Design new landing page layout", "STORY", "HIGH", 5, ["Design"]],
  ["Implement responsive navigation", "STORY", "MEDIUM", 5, ["Frontend"]],
  ["Develop authentication flow", "STORY", "CRITICAL", 8, ["Backend"]],
  ["Fix mobile layout issues", "BUG", "HIGH", 2, ["Frontend"]],
  ["Integrate API endpoints", "TASK", "MEDIUM", 5, ["Backend"]],
  ["Create UI components library", "STORY", "MEDIUM", 8, ["Frontend", "Design"]],
  ["Optimize images and assets", "TASK", "LOW", 3, ["Performance"]],
  ["Write content for features section", "TASK", "LOW", 2, ["Content"]],
  ["Set up analytics", "TASK", "MEDIUM", 3, ["DevOps"]],
  ["Login error message is cut off", "BUG", "MEDIUM", 1, ["Frontend"]],
  ["Add password strength meter", "STORY", "LOW", 3, ["Frontend"]],
  ["Search returns stale results", "BUG", "CRITICAL", 5, ["Backend"]],
  ["Design system colors", "TASK", "MEDIUM", 2, ["Design"]],
  ["Release checklist", "TASK", "LOW", null, []],
  ["Onboarding email copy", "STORY", "LOW", 2, ["Content"]],
];
const SPRINT_SIZE = 4;

const seedProject = async (store, project) => {
  // real members, so assignees are people who can actually open the project
  const members = (await listProjectMembers(project.id, { size: 20 })).content;
  const prefix = keyPrefix(project);
  const sprintId = store.nextId++;
  const tasks = SEED.map(([title, type, priority, estimate, labels], i) => ({
    id: store.nextId++,
    projectId: project.id,
    key: `${prefix}-${i + 1}`,
    title,
    description: "",
    type,
    priority,
    status: "TODO",
    estimate,
    labels,
    assignee: members.length > 0 && i % 3 !== 2 ? person(members[i % members.length]) : null,
    sprintId: i < SPRINT_SIZE ? sprintId : null,
    createdAt: now(),
    updatedAt: now(),
  }));

  return {
    taskCount: tasks.length,
    sprintCount: 1,
    backlog: tasks.slice(SPRINT_SIZE),
    sprints: [
      {
        id: sprintId,
        projectId: project.id,
        name: `${prefix} Sprint 1`,
        goal: "Ship the new landing page and sign-in.",
        capacity: 20,
        startDate: null,
        endDate: null,
        status: "PLANNED",
        tasks: tasks.slice(0, SPRINT_SIZE),
      },
    ],
  };
};

// the stored data of the project a task or sprint belongs to
const projectOfTask = (store, taskId) =>
  Object.entries(store.projects).find(([, data]) => findTask(data, taskId))?.[0];
const projectOfSprint = (store, sprintId) =>
  Object.entries(store.projects).find(([, data]) => data.sprints.some((sprint) => sprint.id === sprintId))?.[0];

// apply `change` to one task wherever it is
const replaceTask = (data, taskId, change) => {
  const update = (tasks) => tasks.map((task) => (task.id === taskId ? change(task) : task));
  data.backlog = update(data.backlog);
  data.sprints = data.sprints.map((sprint) => ({ ...sprint, tasks: update(sprint.tasks) }));
};

// ---- the endpoints ----

const TASK_FIELDS = ["title", "description", "type", "priority", "status", "estimate", "labels"];
const pickTaskFields = (body) =>
  Object.fromEntries(Object.entries(body).filter(([field]) => TASK_FIELDS.includes(field)));

const toNumber = (value) => (value === "" || value == null ? null : Number(value));

// requests send assigneeId; the task keeps the person. Only project members can be assigned
const findAssignee = async (projectId, assigneeId) => {
  if (assigneeId == null) return null;
  const members = (await listProjectMembers(projectId, { size: 100 })).content;
  const member = members.find((m) => m.userId === assigneeId);
  if (!member) fail(400, "BAD_REQUEST", "The assignee must be a member of the project.");
  return person(member);
};

export const getBacklog = async (projectId, signal) => {
  const project = await access(projectId);
  await wait(signal);
  const store = load();
  if (!store.projects[projectId]) {
    store.projects[projectId] = await seedProject(store, project);
    save(store);
  }
  const { sprints, backlog } = store.projects[projectId];
  return copy({ sprints: sprints.filter((sprint) => sprint.status !== "COMPLETED"), backlog });
};

export const createTask = async (projectId, body) => {
  const project = await access(projectId, PERMISSIONS.EDIT_TASKS);
  await wait();
  checkFields(validateTask(body));
  const assignee = await findAssignee(projectId, body.assigneeId);
  const store = load();
  const data = store.projects[projectId] ?? notFound();
  data.taskCount += 1;
  const task = {
    id: store.nextId++,
    projectId: project.id,
    key: `${keyPrefix(project)}-${data.taskCount}`,
    title: body.title.trim(),
    description: body.description ?? "",
    type: body.type ?? "TASK",
    priority: body.priority ?? "MEDIUM",
    status: "TODO",
    estimate: toNumber(body.estimate),
    labels: body.labels ?? [],
    assignee,
    sprintId: null,
    createdAt: now(),
    updatedAt: now(),
  };
  data.backlog.push(task);
  save(store);
  return copy(task);
};

export const getTask = async (taskId, signal) => {
  const projectId = projectOfTask(load(), taskId) ?? notFound();
  await access(projectId);
  await wait(signal);
  return copy(findTask(load().projects[projectId], taskId)?.task ?? notFound());
};

export const updateTask = async (taskId, body) => {
  const projectId = projectOfTask(load(), taskId) ?? notFound();
  await access(projectId, PERMISSIONS.EDIT_TASKS);
  await wait();
  const assignee = "assigneeId" in body ? await findAssignee(projectId, body.assigneeId) : undefined;
  const store = load();
  const data = store.projects[projectId];
  const current = findTask(data, taskId)?.task ?? notFound();
  const changes = pickTaskFields(body);
  if (assignee !== undefined) changes.assignee = assignee;
  if ("estimate" in changes) changes.estimate = toNumber(changes.estimate);
  if ("title" in changes) changes.title = changes.title.trim();
  const updated = { ...current, ...changes, updatedAt: now() };
  checkFields(validateTask(updated));
  replaceTask(data, taskId, () => updated);
  save(store);
  return copy(updated);
};

export const deleteTask = async (taskId) => {
  const projectId = projectOfTask(load(), taskId) ?? notFound();
  await access(projectId, PERMISSIONS.EDIT_TASKS);
  await wait();
  const store = load();
  const data = store.projects[projectId];
  data.backlog = data.backlog.filter((task) => task.id !== taskId);
  data.sprints = data.sprints.map((sprint) => ({ ...sprint, tasks: sprint.tasks.filter((task) => task.id !== taskId) }));
  save(store);
};

export const moveTask = async (projectId, { taskId, sprintId = null, beforeTaskId = null }) => {
  const store = load();
  const data = store.projects[projectId] ?? notFound();
  const from = findTask(data, taskId) ?? notFound();
  const target = sprintId === null ? null : (data.sprints.find((sprint) => sprint.id === sprintId) ?? notFound());
  if (target?.status === "COMPLETED") fail(409, "CONFLICT", "This sprint is already completed.");
  await access(projectId, movePermission(from.sprintId, sprintId));
  await wait();
  const fresh = load();
  fresh.projects[projectId] = moveInState(fresh.projects[projectId], { taskId, sprintId, beforeTaskId });
  save(fresh);
};

export const createSprint = async (projectId, body) => {
  const project = await access(projectId, PERMISSIONS.MANAGE_SPRINTS);
  await wait();
  checkFields(validateSprint(body));
  const store = load();
  const data = store.projects[projectId] ?? notFound();
  data.sprintCount += 1;
  const sprint = {
    id: store.nextId++,
    projectId: project.id,
    name: body.name?.trim() || `${keyPrefix(project)} Sprint ${data.sprintCount}`,
    goal: body.goal ?? "",
    capacity: toNumber(body.capacity),
    startDate: body.startDate || null,
    endDate: body.endDate || null,
    status: "PLANNED",
    tasks: [],
  };
  data.sprints.push(sprint);
  save(store);
  return sprintOnly(sprint);
};

const SPRINT_FIELDS = ["name", "goal", "capacity", "startDate", "endDate"];

export const updateSprint = async (sprintId, body) => {
  const projectId = projectOfSprint(load(), sprintId) ?? notFound();
  await access(projectId, PERMISSIONS.MANAGE_SPRINTS);
  await wait();
  const store = load();
  const data = store.projects[projectId];
  const current = data.sprints.find((sprint) => sprint.id === sprintId);
  const changes = Object.fromEntries(Object.entries(body).filter(([field]) => SPRINT_FIELDS.includes(field)));
  const updated = {
    ...current,
    ...changes,
    name: (changes.name ?? current.name).trim() || current.name,
    capacity: "capacity" in changes ? toNumber(changes.capacity) : current.capacity,
    startDate: ("startDate" in changes ? changes.startDate : current.startDate) || null,
    endDate: ("endDate" in changes ? changes.endDate : current.endDate) || null,
  };
  checkFields(validateSprint(updated, { requireDates: current.status === "ACTIVE" }));
  data.sprints = data.sprints.map((sprint) => (sprint.id === sprintId ? updated : sprint));
  save(store);
  return sprintOnly(updated);
};

export const deleteSprint = async (sprintId) => {
  const projectId = projectOfSprint(load(), sprintId) ?? notFound();
  await access(projectId, PERMISSIONS.MANAGE_SPRINTS);
  await wait();
  const store = load();
  const data = store.projects[projectId];
  const sprint = data.sprints.find((s) => s.id === sprintId);
  if (sprint.status !== "PLANNED") fail(409, "CONFLICT", "Only a planned sprint can be deleted.");
  // its work goes back to the top of the backlog, in the sprint's order
  data.backlog = [...sprint.tasks.map((task) => ({ ...task, sprintId: null })), ...data.backlog];
  data.sprints = data.sprints.filter((s) => s.id !== sprintId);
  save(store);
};

export const startSprint = async (sprintId, body) => {
  const projectId = projectOfSprint(load(), sprintId) ?? notFound();
  await access(projectId, PERMISSIONS.MANAGE_SPRINTS);
  await wait();
  const store = load();
  const data = store.projects[projectId];
  const sprint = data.sprints.find((s) => s.id === sprintId);
  if (sprint.status !== "PLANNED") fail(409, "CONFLICT", "Only a planned sprint can be started.");
  if (data.sprints.some((s) => s.status === "ACTIVE")) {
    fail(409, "SPRINT_ALREADY_ACTIVE", "Another sprint is already active.");
  }
  checkFields(validateSprint(body, { requireDates: true }));
  const started = {
    ...sprint,
    status: "ACTIVE",
    startDate: body.startDate,
    endDate: body.endDate,
    goal: body.goal ?? sprint.goal,
  };
  data.sprints = data.sprints.map((s) => (s.id === sprintId ? started : s));
  save(store);
  return sprintOnly(started);
};
