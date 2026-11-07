import { PERMISSIONS } from "../constants/projects.js";
import { can, isProjectArchived } from "./project.js";
import { isWorkspaceArchived, workspacePath } from "./workspace.js";

// Project chat helpers (backend project-chat-docs.md). Messages come oldest first; REST pages and live events
// overlap, so they are merged by id (ids grow with time) and the newest copy of a message wins.
export const mergeChatMessages = (current = [], incoming = []) => {
  const byId = new Map();
  for (const message of [...current, ...incoming]) {
    if (Number.isSafeInteger(Number(message?.id)) && Number(message.id) > 0) byId.set(Number(message.id), message);
  }
  return [...byId.values()].sort((a, b) => Number(a.id) - Number(b.id));
};

export const CHAT_EVENTS = ["CREATED", "EDITED", "DELETED"];

// a live `ChatChanged` frame applied to the list; anything else leaves it as it is
export const applyChatEvent = (messages, event) =>
  event && CHAT_EVENTS.includes(event.type) && event.message ? mergeChatMessages(messages, [event.message]) : messages;

// Chat is for the project's members only, Viewers included: a workspace admin outside the project can't open it
// (a project in a list has the caller's `roles`; without them, VIEW_WORK says the same)
export const canOpenProjectChat = (project) =>
  Array.isArray(project?.roles) ? project.roles.length > 0 : can(project, PERMISSIONS.VIEW_WORK);

// sending, editing and deleting own messages: COMMENT (not Viewers), nothing archived
export const canWriteChat = (project, workspace) =>
  can(project, PERMISSIONS.COMMENT) && !isProjectArchived(project) && !isWorkspaceArchived(workspace);

// the author edits; nobody else, not even the Project Manager
export const canEditChatMessage = (message, project, workspace, userId) =>
  !message?.deleted && canWriteChat(project, workspace) && Number(message.authorId) === Number(userId);

// the author, or anyone with MODERATE_COMMENTS
export const canDeleteChatMessage = (message, project, workspace, userId) =>
  !message?.deleted &&
  canWriteChat(project, workspace) &&
  (Number(message.authorId) === Number(userId) || can(project, PERMISSIONS.MODERATE_COMMENTS));

// the native WebSocket endpoint on the backend's host: ws://host/ws/chat, wss:// under https
export const chatSocketUrl = (apiUrl, browserOrigin = "http://localhost:5173") => {
  const url = new URL(apiUrl || "/api/v1", browserOrigin);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = "/ws/chat";
  url.search = "";
  url.hash = "";
  return url.toString();
};

// which action a refused frame on /user/queue/errors was: its `path` is the STOMP destination,
// e.g. "/app/projects/42/chat.send" → "send"
export const chatErrorAction = (path) => /\/chat\.(send|edit|delete)$/.exec(path ?? "")?.[1] ?? null;

// the projects whose chat the caller can open, from every page of the project list, by name
export const chatProjectsFromPages = (pages) => {
  const byId = new Map();
  for (const page of pages) {
    for (const project of page.content ?? []) {
      if (project?.id != null && canOpenProjectChat(project)) byId.set(String(project.id), project);
    }
  }
  return [...byId.values()].sort((a, b) => (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" }));
};

// the workspace's Chats page, and one project's conversation on it
export const chatsPath = (workspace) => `${workspacePath(workspace)}/chats`;
export const chatConversationPath = (workspace, project) => `${chatsPath(workspace)}/${project.id}`;
