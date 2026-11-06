// The backend orders each page oldest -> newest. Live updates and REST pages can overlap.
export const mergeChatMessages = (current = [], incoming = []) => {
  const byId = new Map();
  for (const message of [...current, ...incoming]) {
    if (Number.isSafeInteger(Number(message?.id)) && Number(message.id) > 0) {
      byId.set(Number(message.id), message);
    }
  }
  return [...byId.values()].sort((a, b) => Number(a.id) - Number(b.id));
};

export const applyChatEvent = (messages, event) => {
  if (!event || !["CREATED", "EDITED", "DELETED"].includes(event.type) || !event.message) return messages;
  return mergeChatMessages(messages, [event.message]);
};

export const canWriteChat = (project, workspace) =>
  Boolean(project?.permissions?.includes("COMMENT")) &&
  !["ARCHIVED", "COMPLETED"].includes(project?.status) &&
  workspace?.status !== "ARCHIVED";

export const canDeleteChatMessage = (message, project, workspace, userId) =>
  !message?.deleted && canWriteChat(project, workspace) &&
  (Number(message.authorId) === Number(userId) || project?.permissions?.includes("MODERATE_COMMENTS"));

export const canEditChatMessage = (message, project, workspace, userId) =>
  !message?.deleted && canWriteChat(project, workspace) && Number(message.authorId) === Number(userId);

export const isEmptyChatDoc = (doc) => {
  const visit = (node) => {
    if (!node || typeof node !== "object") return "";
    if (node.type === "text") return node.text || "";
    if (node.type === "mention") return `@${node.attrs?.label || node.attrs?.id || ""}`;
    if (node.type === "hardBreak") return "\n";
    return (node.content || []).map(visit).join("");
  };
  return !visit(doc).trim();
};

export const safeChatHref = (href) => {
  if (typeof href !== "string" || href.length > 2000) return null;
  try {
    const url = new URL(href);
    return ["http:", "https:", "mailto:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
};

export const chatSocketUrl = (apiUrl, browserOrigin = "http://localhost:5173") => {
  const url = new URL(apiUrl || "/api/v1", browserOrigin);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = "/ws/chat";
  url.search = "";
  url.hash = "";
  return url.toString();
};

export const chatErrorText = (error, fallback = "Chat request failed.") => {
  const code = error?.response?.data?.code;
  if (code === "RESOURCE_NOT_FOUND" || error?.response?.status === 404) {
    return "This project or message is no longer available.";
  }
  if (code === "INVALID_MENTION") return "One of the mentions is not a current project member.";
  if (code === "INVALID_RICH_TEXT") return "Message formatting is invalid. Review the text and try again.";
  if (error?.response?.status === 403) return "You no longer have permission to use this chat.";
  return error?.response?.data?.message || fallback;
};
