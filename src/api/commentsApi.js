import api from "./client";

// Task comments (backend comments-docs.md). `body` is a string holding the TipTap document; the response returns
// the backend's normalized copy, plus `mentions` (current names), `canEdit` / `canDelete` for the caller and the
// deleted placeholders (`deleted`, `body: null`). Subtasks use the same endpoints with their own id.
const base = (projectId, taskId) => `/projects/${projectId}/tasks/${taskId}/comments`;

// oldest first, paginated
export const getComments = async (projectId, taskId, { page = 0, size = 20 } = {}, signal) => {
  const res = await api.get(base(projectId, taskId), { params: { page, size }, signal });
  return res.data;
};

export const createComment = async (projectId, taskId, body) => {
  const res = await api.post(base(projectId, taskId), { body });
  return res.data;
};

// the author only; the full new body
export const updateComment = async (projectId, taskId, commentId, body) => {
  const res = await api.patch(`${base(projectId, taskId)}/${commentId}`, { body });
  return res.data;
};

// the author, or anyone with MODERATE_COMMENTS; a soft delete (the list keeps a placeholder)
export const deleteComment = async (projectId, taskId, commentId) => {
  await api.delete(`${base(projectId, taskId)}/${commentId}`);
};
