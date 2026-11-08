import api from "./client";

// Task attachments (backend attachments-docs.md, PMP-141). `taskId` can be a subtask's: its files are its own.
// Listing and downloading need VIEW_WORK, uploading EDIT_TASKS, deleting the attachment's own `canDelete`.
const attachmentsPath = (projectId, taskId) => `/projects/${projectId}/tasks/${taskId}/attachments`;

// the task's attachments, newest first, all at once (not paginated), as { id, taskId, fileName, contentType,
// sizeBytes, image, uploader: { id, name } | null, uploadedAt, downloadUrl, previewUrl, canDelete }
export const listAttachments = (projectId, taskId, signal) =>
  api.get(attachmentsPath(projectId, taskId), { signal }).then((res) => res.data);

// 1 to 5 files in one request, all or nothing: one refused file saves none. No Content-Type here, the browser adds
// the multipart boundary. `onProgress` gets the share sent so far, from 0 to 1
export const uploadAttachments = (projectId, taskId, files, onProgress) => {
  const form = new FormData();
  for (const file of files) form.append("files", file);
  return api
    .post(attachmentsPath(projectId, taskId), form, { onUploadProgress: ({ progress }) => onProgress?.(progress ?? 0) })
    .then((res) => res.data);
};

// a soft delete with no restore; the task's history keeps the file name
export const deleteAttachment = (attachmentId) => api.delete(`/attachments/${attachmentId}`);

// the file as a Blob. Not a plain link: a link can't refresh an expired login, it would open the 401 as a page
export const downloadAttachment = (attachmentId) =>
  api.get(`/attachments/${attachmentId}`, { responseType: "blob" }).then((res) => res.data);

// for an <img>: `previewUrl` already starts with /api/v1, so it goes after the backend's origin, not after VITE_API_URL
export const attachmentPreviewSrc = (attachment) => {
  const backendOrigin = new URL(api.defaults.baseURL, window.location.origin).origin;
  return `${backendOrigin}${attachment.previewUrl}`;
};
