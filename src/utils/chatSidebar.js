import { projectTabPath } from "./project.js";
import { workspacePath } from "./workspace.js";

// Chat subscriptions require actual project membership, even for workspace administrators.
// Project lists may include projects that an administrator manages but hasn't joined.
export const canOpenProjectChat = (project) =>
  Array.isArray(project?.roles)
    ? project.roles.length > 0
    : Boolean(project?.permissions?.includes("VIEW_WORK"));

export const chatProjectsFromPages = (pages) => {
  const byId = new Map();
  for (const page of pages) {
    for (const project of page.content ?? []) {
      if (project?.id != null && canOpenProjectChat(project)) byId.set(String(project.id), project);
    }
  }
  return [...byId.values()].sort((a, b) =>
    (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" }));
};

export const isProjectChatRoute = (pathname) =>
  /^\/workspaces\/[^/]+\/projects\/[1-9]\d*\/chat\/?$/.test(pathname);

export const sidebarChatPath = (workspace, project) => projectTabPath(workspace, project, "chat");

// The workspace Chats page has its own sharable routes; project tabs remain supported.
export const chatsPath = (workspace) => `${workspacePath(workspace)}/chats`;
export const chatConversationPath = (workspace, project) => `${chatsPath(workspace)}/${project.id}`;
