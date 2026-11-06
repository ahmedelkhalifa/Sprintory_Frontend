import { useCallback, useEffect, useRef, useState } from "react";
import { Client } from "@stomp/stompjs";
import { getChatHistory, getChatSocketToken, getChatWebSocketUrl } from "../api/chatApi.js";
import { applyChatEvent, chatErrorText, mergeChatMessages } from "../utils/chat.js";

const PAGE_SIZE = 50;
const RECONNECT_DELAY_MS = 2500;

// Project-scoped state: never share messages or a live subscription between projects.
export const useProjectChat = (projectId) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextBefore, setNextBefore] = useState(null);
  const [status, setStatus] = useState("connecting");
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const clientRef = useRef(null);
  const olderInFlightRef = useRef(false);
  const generationRef = useRef(0);

  useEffect(() => {
    generationRef.current += 1;
    let active = true;
    let blocked = false;
    const abort = new AbortController();
    const liveEvents = [];
    let liveSequence = 0;
    const topic = `/topic/projects/${projectId}/chat`;

    olderInFlightRef.current = false;

    const handleRestError = (err) => {
      if (!active || abort.signal.aborted) return;
      setError(chatErrorText(err, "Could not load chat history."));
      if ([403, 404].includes(err.response?.status)) {
        blocked = true;
        setStatus("denied");
        setMessages([]);
        clientRef.current?.deactivate();
      }
    };

    // Merge late REST pages with WebSocket events received while the request was in flight.
    // The server's snapshot refreshes stale state after reconnection; newer live frames win.
    const refreshLatest = async (initial) => {
      const since = liveSequence;
      try {
        const result = await getChatHistory(projectId, { limit: PAGE_SIZE }, abort.signal);
        if (!active || blocked) return;
        setMessages((current) => {
          const snapshot = mergeChatMessages(current, result.messages ?? []);
          return mergeChatMessages(snapshot, liveEvents.filter((event) => event.seq > since).map((event) => event.message));
        });
        if (initial) {
          setHasMore(Boolean(result.hasMore));
          setNextBefore(result.nextBefore ?? null);
        }
        setError("");
      } catch (err) {
        handleRestError(err);
      } finally {
        if (initial && active) setLoading(false);
      }
    };

    void refreshLatest(true);

    const client = new Client({
      brokerURL: getChatWebSocketUrl(),
      reconnectDelay: RECONNECT_DELAY_MS,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      // A token lasts only 120s. beforeConnect runs on each reconnect, never reuse one.
      beforeConnect: async () => {
        if (!active || blocked) throw new Error("Chat disconnected");
        const { token } = await getChatSocketToken(abort.signal);
        if (!active || blocked) throw new Error("Chat disconnected");
        client.connectHeaders = { Authorization: `Bearer ${token}` };
      },
      onConnect: () => {
        if (!active || blocked) return;
        setStatus("connected");
        setError("");
        client.subscribe(topic, (frame) => {
          if (!active || blocked) return;
          try {
            const event = JSON.parse(frame.body);
            if (Number(event.projectId) !== Number(projectId)) return;
            if (!["CREATED", "EDITED", "DELETED"].includes(event.type) || !event.message) return;
            liveSequence += 1;
            liveEvents.push({ seq: liveSequence, message: event.message });
            if (liveEvents.length > 200) liveEvents.shift();
            setMessages((current) => applyChatEvent(current, event));
          } catch {
            // Malformed frames must not break the subscription.
            setError("Received an invalid chat update. Reconnect to refresh.");
          }
        });
        // Simple broker has no replay; fetch latest after every connection (including first).
        void refreshLatest(false);
      },
      onStompError: (frame) => {
        if (!active) return;
        const detail = `${frame.headers?.message ?? ""} ${frame.body ?? ""}`;
        if (/denied|forbidden|unauthori[sz]ed|not.found|access/i.test(detail)) {
          blocked = true;
          setStatus("denied");
          setMessages([]);
          setError("Chat access was denied. You may no longer be a project member.");
          void client.deactivate();
        } else {
          setError("The server rejected the chat request. Review the message or reconnect.");
        }
      },
      onWebSocketClose: () => {
        if (!active || blocked) return;
        setStatus("reconnecting");
      },
      onWebSocketError: () => {
        if (active && !blocked) setStatus("reconnecting");
      },
      debug: () => {}, // Do not log CONNECT headers or socket tokens.
    });
    clientRef.current = client;
    client.activate();

    return () => {
      generationRef.current += 1;
      active = false;
      abort.abort();
      if (clientRef.current === client) clientRef.current = null;
      void client.deactivate();
    };
  }, [projectId, refreshKey]);

  const loadOlder = useCallback(async () => {
    if (olderInFlightRef.current || !hasMore || !nextBefore || loading) return;
    olderInFlightRef.current = true;
    const generation = generationRef.current;
    setLoadingOlder(true);
    try {
      const data = await getChatHistory(projectId, { limit: PAGE_SIZE, before: nextBefore });
      if (generation !== generationRef.current) return;
      setMessages((current) => mergeChatMessages(data.messages ?? [], current));
      setNextBefore(data.nextBefore ?? null);
      setHasMore(Boolean(data.hasMore));
      setError("");
    } catch (err) {
      if (generation === generationRef.current) setError(chatErrorText(err, "Could not load older messages."));
    } finally {
      if (generation === generationRef.current) {
        olderInFlightRef.current = false;
        setLoadingOlder(false);
      }
    }
  }, [hasMore, loading, nextBefore, projectId]);

  const publish = useCallback((action, body) => {
    const client = clientRef.current;
    if (!client?.connected) throw new Error("Chat is offline. Reconnect before sending.");
    client.publish({ destination: `/app/projects/${projectId}/chat.${action}`, body: JSON.stringify(body) });
  }, [projectId]);

  const retry = () => {
    setMessages([]);
    setLoading(true);
    setLoadingOlder(false);
    setNextBefore(null);
    setHasMore(false);
    setStatus("connecting");
    setError("");
    olderInFlightRef.current = false;
    setRefreshKey((key) => key + 1);
  };

  return {
    messages, loading, loadingOlder, hasMore, status, error,
    loadOlder, retry,
    sendMessage: (content) => publish("send", { content }),
    editMessage: (messageId, content) => publish("edit", { messageId, content }),
    deleteMessage: (messageId) => publish("delete", { messageId }),
  };
};
