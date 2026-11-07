import api from "./client";
import { chatSocketUrl } from "../utils/chat";

// Project chat (backend project-chat-docs.md). REST gives the history and the socket token; messages are sent,
// edited and deleted over STOMP (useProjectChat).

// a short-lived (120 s) token for one STOMP CONNECT; the cookies can't be read by the socket client.
// Fetch a new one for every (re)connect, keep it only in memory.
export const getChatSocketToken = async (signal) => {
  const res = await api.post("/chat/socket-token", undefined, { signal });
  return res.data;
};

// a page of messages, oldest first, deleted ones as tombstones: { messages, nextBefore, hasMore }.
// `before` is the oldest id already loaded (exclusive), none for the newest page; `limit` 1..100
export const getChatHistory = async (projectId, { before, limit = 50 } = {}, signal) => {
  const res = await api.get(`/projects/${projectId}/chat/messages`, {
    params: { limit, ...(before ? { before } : {}) },
    signal,
  });
  return res.data;
};

// the WebSocket address on the backend's host (VITE_API_URL's origin)
export const getChatWebSocketUrl = () => chatSocketUrl(api.defaults.baseURL, window.location.origin);
