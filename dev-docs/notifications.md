# Notifications

Source: `sprintory_backend/docs/notifications-docs.md` (R27, PMP-32; implemented in the backend, PMP-113, merged into its main on 4 Nov 2026). Shared rules are in [README.md](README.md).

## Basics

- **One bell per user, across all workspaces.** Each notification carries the workspace, project and task it is about (names are **snapshots**), so the list says where it came from. Newest first, paginated.
- **Two channels:** in-app (the bell, live over Server-Sent Events) and email (queued and retried by the backend; the frontend does nothing for it).
- **You are never notified about your own actions.** Notifications are written by the backend as a side effect of other actions: there is no endpoint to create, edit or delete one.
- **Lost access:** old notifications stay listed; opening one answers `404` (and it is still marked read).
- `message` is plain text, ready to display; `excerpt` (comments and mentions only) is at most 200 characters.

## Endpoints

| Action | Method and path | Success |
| --- | --- | --- |
| List | `GET /notifications?unreadOnly=&workspaceId=&page=&size=` | `200` PageResponse of notifications (size 20, max 100) |
| Unread count | `GET /notifications/unread-count` | `200 { count }` |
| Open (marks it read) | `POST /notifications/{id}/open` | `200 { kind: TASK \| PROJECT \| NONE, workspaceId, projectId, taskId, taskKey }` |
| Mark all read | `POST /notifications/read-all` | `200 { count: 0 }` |
| Stream | `GET /notifications/stream` | `text/event-stream`, see below |
| Read preferences | `GET /notification-preferences` | `200 { preferences: [...] }`, all 8 categories in a fixed order |
| Change preferences | `PUT /notification-preferences` `{ preferences: [{ category, inApp?, email? }] }` | `200`, the full matrix |
| Watch status | `GET / PUT / DELETE /projects/{projectId}/tasks/{taskId}/watch` | `200 { watching }` |

In the frontend: [notificationsApi.js](../src/api/notificationsApi.js) (`listNotifications`, `getUnreadCount`, `openNotification`, `markAllRead`, `getNotificationPreferences`, `updateNotificationPreferences`, `getWatch`, `watchTask`, `unwatchTask`).

```jsonc
// notification
{ "id": 981, "type": "TASK_ASSIGNED", "category": "ASSIGNMENT", "createdAt": "2026-11-03T14:05:31.218Z",
  "read": false, "readAt": null, "message": "Damir Gabaidullin assigned you MOB-42 \"Fix login\"", "excerpt": null,
  "actor": { "id": 31, "name": "Damir Gabaidullin" },              // null for security notifications
  "workspace": { "id": 4, "name": "Acme" },                        // null for security notifications
  "project": { "id": 15, "key": "MOB", "name": "Mobile App" },     // null for workspace and security ones
  "task": { "id": 230, "key": "MOB-42", "title": "Fix login" } }   // null unless it is about a task
```

## The stream

[useNotificationStream](../src/hooks/useNotificationStream.js), used by the bell, so one stream per tab while logged in (it closes when AppShell unmounts, e.g. on logout).

- ``new EventSource(`${baseURL}/notifications/stream`, { withCredentials: true })``: the `access_token` cookie is the login.
- Events: `unread-count` `{ count }` (first thing after every connect, then on every change, from any tab or device) and `notification` (a new notification, always followed by an `unread-count`).
- **No replay.** The list endpoint is the source of truth: the bell reloads page 0 after a reconnect while it is open (`connection` from the hook).
- The server closes the stream about every 10 minutes and `EventSource` reconnects on its own (`CONNECTING`). An expired access token gives `401` on reconnect: `EventSource` goes `CLOSED` and stops. The hook then refreshes through `refreshSession()` from [client.js](../src/api/client.js), the same single-flight refresh as the interceptor (refresh tokens are single use, so two parallel refreshes would log the user out), and reconnects with a backoff (1 s, doubling, max 30 s). A refresh answering `401` fires `AUTH_EXPIRED_EVENT`; a network or server error just retries later.

## Bell

[NotificationBell](../src/components/layouts/NotificationBell.jsx) in the top bar.

- The badge is the unread count (hidden at 0, `99+`). Opening loads `page=0&size=10`, "Load more" the next pages; pushed notifications go on top, deduplicated by id (`mergeNotifications` in [utils/notification.js](../src/utils/notification.js)).
- Each item: `message`, the excerpt, "project · workspace" (`notificationWhere`) and the time ago; unread ones are highlighted.
- A click calls open, marks the item read locally, then goes to `notificationTargetPath(target, workspaces, type)`: TASK → the task page, PROJECT → the project (a `MENTIONED` about a project is a chat mention: its Chat tab; `SPRINT_STARTED` / `SPRINT_OVERDUE` → the Board tab, `SPRINT_COMPLETED` / `SPRINT_CANCELLED` → the Sprints tab, since they carry no sprint id), NONE (invitations, security) → stays. A `404` shows "This item is no longer available." on the item instead of navigating.
- "Mark all as read" sets every loaded item read and the count to the response's `0`.

## Preferences

[NotificationPreferences](../src/components/settings/NotificationPreferences.jsx) on `/settings`, the page every notification email links to (`app.notifications.preferences-path`).

| `category` | Covers | In-app | Email | Locked |
| --- | --- | --- | --- | --- |
| `ASSIGNMENT` | `TASK_ASSIGNED` | on | on | no |
| `MENTION` | `MENTIONED` (comments, descriptions, the project chat) | on | on | no |
| `COMMENT` | `TASK_COMMENTED` | on | off | no |
| `STATUS_CHANGE` | `TASK_STATUS_CHANGED` | on | off | no |
| `PROJECT_MEMBERSHIP` | `PROJECT_MEMBER_ADDED`, `PROJECT_ROLES_CHANGED` | on | off | no |
| `SPRINT` | `SPRINT_STARTED` / `_COMPLETED` / `_CANCELLED`, and `SPRINT_OVERDUE` (daily to the Scrum Masters while the active sprint is past its end date; no actor) | on | off | no |
| `INVITATION` | `WORKSPACE_INVITATION` | on | on | **yes** |
| `SECURITY` | `PASSWORD_RESET`, `LOGIN_FAILED_REPEATED` | on | on | **yes** |

- The rows come from `GET` in its order; our labels are in [constants/notifications.js](../src/constants/notifications.js). Per user and global, the same in every workspace.
- Each switch sends a one-change `PUT` and the page shows the returned matrix. Locked rows are on and disabled (turning one off is a `400 BAD_REQUEST`).
- "Reset to defaults" sends every unlocked category with `defaultInApp` / `defaultEmail` (`preferenceDefaults`).

## Watching

[TaskWatchToggle](../src/components/tasks/TaskWatchToggle.jsx) on the task page and in the task drawer's header (Backlog and Board), for everyone who can see the task, whatever their role. Not on a subtask's page yet. Watchers get comment and status-change notifications. You watch tasks you create, are assigned to or comment on automatically; unwatching lasts until the next such trigger. Anyone with `VIEW_WORK` can watch, also in an archived workspace. The task response has no flag, so the toggle loads it with `GET …/watch` (and hides itself if that fails).

## Email links

The backend builds them as `/workspaces/{workspaceId}/projects/{projectId}/tasks/{taskId}` and `/workspaces/{workspaceId}/projects/{projectId}`, with the numeric workspace id. They work: `WorkspaceAccessGuard` redirects an id in the url to the slug (for a workspace in the user's list).
