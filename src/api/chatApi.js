import api from "./client";
import { chatSocketUrl } from "../utils/chat.js";

export const getChatSocketToken = (signal) =>
  api.post("/chat/socket-token", undefined, { signal }).then(({ data }) => data);

export const getChatHistory = (projectId, { before, limit = 50 } = {}, signal) =>
  api.get(`/projects/${projectId}/chat/messages`, {
    params: { limit, ...(before ? { before } : {}) }, signal,
  }).then(({ data }) => data);

export const getProjectMentionables = (projectId, q, signal) =>
  api.get(`/projects/${projectId}/mentionables`, { params: { q }, signal }).then(({ data }) => data);

// Auth cookies authenticate REST; socket CONNECT gets its own purpose-bound, short-lived JWT.
export const getChatWebSocketUrl = () =>
  chatSocketUrl(api.defaults.baseURL, window.location.origin);
