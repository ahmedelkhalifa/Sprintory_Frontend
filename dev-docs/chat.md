# Project chat

Source: `sprintory_backend/docs/project-chat-docs.md` (PMP-137; backend merged 6 Nov 2026, the error queue and chat
mention notifications on its `fix/refactoring` the same day). Frontend PMP-139. Shared rules are in
[README.md](README.md); the rich-text format is the one in [tasks.md](tasks.md#descriptions-and-mentions-real-backend-pmp-136-docsmentions-docsmd).

## Basics

- **One channel per project**, persistent. Members only, Viewers included (they read); a workspace admin outside the
  project can't open it (`canOpenProjectChat`: the caller's `roles` on the project).
- **Writing** needs `COMMENT` and nothing archived. The author edits their own messages; the author or someone with
  `MODERATE_COMMENTS` (Project Manager) deletes. A deleted message stays as "Message deleted".
- Messages are **TipTap documents as JSON objects** (not strings, unlike comments), at most 10,000 characters, with
  `@mentions` of the project's people and teams. A newly mentioned person gets `MENTIONED` about the **project**;
  the bell opens the project's Chat tab for it (`notificationTargetPath` with the type).

## Connecting

1. `POST /chat/socket-token` → `{ token, expiresInSeconds: 120 }` (`getChatSocketToken` in
   [chatApi.js](../src/api/chatApi.js)): the cookies can't be read by the socket client, so this short-lived token
   goes in the STOMP `CONNECT` header `Authorization: Bearer <token>`. **A new one for every (re)connect**, kept only
   in memory, never logged.
2. Native WebSocket `ws(s)://<backend host>/ws/chat` (`chatSocketUrl`, from `VITE_API_URL`'s origin).
3. Subscribe to `/topic/projects/{projectId}/chat` and to `/user/queue/errors`.
4. After every connect, load the newest page over REST: the broker has no replay.

| Action | Destination | Body |
| --- | --- | --- |
| send | `/app/projects/{projectId}/chat.send` | `{ content: <doc> }` |
| edit | `/app/projects/{projectId}/chat.edit` | `{ messageId, content: <doc> }` |
| delete | `/app/projects/{projectId}/chat.delete` | `{ messageId }` |

```jsonc
// on the topic, after the change is saved: type CREATED | EDITED | DELETED
{ "type": "CREATED", "projectId": 42,
  "message": { "id": 123, "projectId": 42, "authorId": 7, "authorName": "Jane Doe", "content": { "type": "doc", … },
               "createdAt": "…", "editedAt": null, "deleted": false,
               "mentions": [{ "kind": "team", "id": 5, "name": "Backend" }] } }   // deleted: content null, mentions []
```

- **A send has no answer of its own.** The sender sees the message when it comes back on the topic.
- **Refused send / edit / delete:** one frame on the sender's `/user/queue/errors` in the REST error shape, with the
  destination as `path` (`INVALID_RICH_TEXT`, `INVALID_MENTION`, `BAD_REQUEST`, `ACCESS_DENIED`,
  `RESOURCE_NOT_FOUND`, `WORKSPACE_ARCHIVED`, `INTERNAL_ERROR`). The connection stays open. Show the message and keep
  the draft.
- **Refused CONNECT / SUBSCRIBE / SEND** (bad token, not a member, no `COMMENT`): a STOMP `ERROR` frame closes the
  connection. Reconnect with a new token.

## History

`GET /projects/{projectId}/chat/messages?limit=50&before={oldest loaded id}` (`getChatHistory`) →
`{ messages, nextBefore, hasMore }`, each page oldest first, tombstones included. `limit` 1–100.

## In the frontend

- [useProjectChat](../src/hooks/useProjectChat.js): the history, the connection (`@stomp/stompjs`, reconnect every
  2.5 s), the live list (`mergeChatMessages` / `applyChatEvent` in [utils/chat.js](../src/utils/chat.js): by id,
  newest copy wins), `failure` (the latest refused frame) and `own` (the latest change of the caller's own message).
  A `403` / `404` on the history means access is gone (`status: "denied"`); after an `ERROR` frame it asks the
  history again rather than reading the frame's text.
- [ProjectChatPanel](../src/components/chat/ProjectChatPanel.jsx): the list ([ChatMessageList](../src/components/chat/ChatMessageList.jsx),
  keeps its place when older messages load, follows new ones at the bottom) and
  [ChatComposer](../src/components/chat/ChatComposer.jsx) (the shared `RichTextEditor`). A sent draft stays, locked,
  until it comes back (`own`, then the box empties) or is refused (`failure`, then the message shows); an edit closes
  when the edited message comes back.
- Where: the project's **Chat** tab (`.../projects/:projectId/chat`, members only) and the workspace's **Chats** page
  (`/workspaces/:slug/chats[/:projectId]`, the sidebar's Chats: the projects the caller is in, then one chat).
