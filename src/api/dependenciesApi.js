import api from "./client";

// Task dependencies (PMP-45, backend docs/dependencies-docs.md): "A blocks B", one directed link between two live
// top-level tasks of the same project. Reading needs project membership (a non-member gets 404, a workspace admin
// outside the project too), adding and removing DEPENDENCY_MANAGE (every project role but Viewer).

// { blocked, blockedBy: [{ id, task }], blocks: [{ id, task }], openBlockers: [task], canManage } for one task.
// `id` in blockedBy / blocks is the link's id (for removeDependency), `task` the other task as
// { id, key, title, statusName, statusCategory }. A subtask answers empty lists and canManage false.
export const getDependencies = (taskId, signal) =>
  api.get(`/tasks/${taskId}/dependencies`, { signal }).then((res) => res.data);

// body: { blockerId, blockedId }, task ids (not keys). `taskId` is the page it is added from and must be one of the
// two: "Add blocker" on task 11 sends { blockerId: picked, blockedId: 11 }, "Add blocked task" on task 10
// { blockerId: 10, blockedId: picked }; both make the same link (dependencyRequest in utils/dependency.js).
// Refusals: 409 DEPENDENCY_ALREADY_EXISTS, 409 DEPENDENCY_CYCLE (with `cyclePath`), 400 for a self-link, a subtask,
// a deleted task or one of another project
export const addDependency = (taskId, body) =>
  api.post(`/tasks/${taskId}/dependencies`, body).then((res) => res.data);

// by the link's id from the lists, never a task id; both tasks keep existing and both histories record it
export const removeDependency = (dependencyId) => api.delete(`/dependencies/${dependencyId}`);
