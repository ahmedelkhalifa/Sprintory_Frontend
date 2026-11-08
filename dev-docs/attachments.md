# Task attachments (R25, frontend PMP-142)

Summary of the backend's `docs/attachments-docs.md` (7 Nov 2026), for the frontend.

**Status:** the contract is agreed, but the backend (PMP-141, branch `features/attachments`) isn't built. The frontend
follows the contract. Don't merge it before the backend: until then the section on every task page shows an error. Acceptance testing is PMP-143.

## What it does

- A file belongs to one task. A subtask's files are its own (use its id as `{taskId}`) and don't show on the parent.
- **Types** (the backend reads the content, and the extension must match it): `pdf`, `docx`, `xlsx`, `pptx`, `txt`, `md`,
  `csv`, `png`, `jpg`/`jpeg`, `gif`, `webp`, `zip`. Everything else is refused, also old Office files, Office files with
  macros, HTML, SVG and executables.
- **Limits:** 20 MB per file, 5 files per upload, not empty. All or nothing: one refused file saves none.
- **Images are compressed:** PNG, JPEG and WebP usually come back as `.webp` with a new name and size.
- **Soft delete with no restore.** Deleting a task hides its files until it is restored.
- **Archived workspace:** files can be listed and downloaded; uploading and deleting answer `409 WORKSPACE_ARCHIVED`.
- No public links, no notifications, no attachments in comments or chat.

## Who can do what

| Action | Viewer | Other project roles | Project Manager |
| --- | --- | --- | --- |
| List and download | yes | yes | yes |
| Upload | no | yes | yes |
| Delete own file | no | yes | yes |
| Delete someone else's | no | no | yes |

Listing and downloading need `VIEW_WORK`, uploading and deleting your own `EDIT_TASKS`, deleting anyone's
`MODERATE_COMMENTS`. The response's `canDelete` already says this for the caller. Not in the project: `404`; a workspace
admin outside the project: `403`.

## Endpoints

| Method | Path | Answer | Function in [attachmentsApi.js](../src/api/attachmentsApi.js) |
| --- | --- | --- | --- |
| POST | `/projects/{projectId}/tasks/{taskId}/attachments` (multipart, one `files` part per file) | `201` + array | `uploadAttachments` |
| GET | `/projects/{projectId}/tasks/{taskId}/attachments` | `200` + array, newest first, not paginated | `listAttachments` |
| GET | `/attachments/{attachmentId}` | `200` + the file | `downloadAttachment` |
| GET | `/attachments/{attachmentId}/preview` | `200` + the image, images only | `attachmentPreviewSrc` (for an `<img>`) |
| DELETE | `/attachments/{attachmentId}` | `204` | `deleteAttachment` |

```jsonc
// AttachmentResponse
{
  "id": 91,
  "taskId": 230,
  "fileName": "login-flow.webp",                      // user input: only ever render it as text
  "contentType": "image/webp",
  "sizeBytes": 184332,                                // the stored size, after compression
  "image": true,                                      // has a preview
  "uploader": { "id": 7, "name": "Ada Lovelace" },    // null if the account no longer exists
  "uploadedAt": "2026-11-07T14:02:51.320Z",
  "downloadUrl": "/api/v1/attachments/91",            // already includes /api/v1
  "previewUrl": "/api/v1/attachments/91/preview",     // null unless "image"
  "canDelete": true
}
```

## Errors

| Code | Status | When |
| --- | --- | --- |
| `BAD_REQUEST` | 400 | no `files` part, or an empty file |
| `TOO_MANY_FILES` | 400 | more than 5 files |
| `FILE_TOO_LARGE` | 413 | a file over 20 MB |
| `FILE_TYPE_NOT_ALLOWED` | 415 | not allowed, content doesn't match the extension, or macros |
| `RESOURCE_NOT_FOUND` | 404 | missing, deleted, on a deleted task, or not visible: all look the same |
| `WORKSPACE_ARCHIVED` | 409 | uploading or deleting in an archived workspace |

The upload's messages name the file, so they are shown as they come.

## How the frontend does it

- [TaskAttachments](../src/components/tasks/attachments/TaskAttachments.jsx) is the section on a task's and a subtask's
  full page, under the description, like Jira's list view. Not in the side window: the story is about the full view.
- **Upload:** `validateAttachments` checks in the browser first, to save a round trip. The backend decides. After an
  upload the list reloads instead of adding the answer to it, so names, sizes and order are the backend's.
- **Download goes through the client as a Blob, not a plain link.** The doc allows `<a href>`, but a link can't refresh:
  the access cookie lives 15 minutes, so someone who reads a task for a while and clicks a file would land on a raw 401
  page. A Blob's error is a Blob too, so [client.js](../src/api/client.js) reads it back into JSON first; without that
  no `code` is found, and neither the refresh nor the error text works.
- **Images are plain `<img>`s** ([AttachmentImage](../src/components/tasks/attachments/AttachmentImage.jsx)), so they
  can't refresh either. On an error it calls `refreshSession()` once and tries again with `?v=1`, then shows the file's
  icon. The backend doc says to call `POST /auth/refresh`, but never do that directly: refresh tokens are single use, so
  a second parallel refresh logs the user out.
- **Urls:** `downloadUrl` and `previewUrl` start with `/api/v1`, which `VITE_API_URL` also ends with. So they go after
  the backend's origin, and `downloadAttachment` just uses the id.
- **History:** `ATTACHMENT_ADDED` / `ATTACHMENT_REMOVED` become "attached x.webp" / "removed the attachment x.webp", never
  a link. **Assumed:** the doc doesn't say which of `oldValue` / `newValue` holds the name, so `historyLine` reads either.
  Attachments don't change `task.updatedAt`, so the page passes `historyVersion` to reload an open History tab.
