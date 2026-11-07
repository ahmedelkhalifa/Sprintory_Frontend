import { useCallback, useEffect, useRef, useState } from "react";
import { Client } from "@stomp/stompjs";
import { getChatHistory, getChatSocketToken, getChatWebSocketUrl } from "../api/chatApi";
import { errorMessage, isAbort } from "../utils/apiError";
import { CHAT_EVENTS, applyChatEvent, chatErrorAction, mergeChatMessages } from "../utils/chat";

const PAGE_SIZE = 50;
const RECONNECT_DELAY_MS = 2500;
const ERRORS_QUEUE = "/user/queue/errors";

// 403 / 404 on the project: the caller is no longer a member (or the project is gone)
const lostAccess = (err) => [403, 404].includes(err?.response?.status);

/**
 * One project's chat (backend project-chat-docs.md): the history over REST, live changes over STOMP.
 * const chat = useProjectChat(projectId, userId);
 * - `messages` oldest first, with "Message deleted" tombstones; `loadOlder()` while `hasMore`.
 * - `status`: "connecting" | "connected" | "reconnecting" | "denied" (no access any more: nothing is shown).
 * - `error`: a failed load. `failure`: the latest refused send / edit / delete from the server's error queue,
 *   `{ action, code, message, seq }`; `own`: the latest change of the caller's own message on the topic,
 *   `{ type, messageId, seq }`. A send has no answer of its own, so the composer waits for one of these two.
 * - `sendMessage(doc)`, `editMessage(id, doc)`, `deleteMessage(id)` throw while offline.
 * Every connect fetches a fresh socket token and reloads the newest page (the broker doesn't replay).
 */
export const useProjectChat = (projectId, userId) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextBefore, setNextBefore] = useState(null);
  const [status, setStatus] = useState("connecting");
  const [error, setError] = useState("");
  const [failure, setFailure] = useState(null);
  const [own, setOwn] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const clientRef = useRef(null);
  const olderInFlight = useRef(false);
  const session = useRef(0); // a load from an earlier session (project, retry) must not land
  const userRef = useRef(userId);
  useEffect(() => {
    userRef.current = userId;
  });

  useEffect(() => {
    const current = ++session.current;
    const active = () => current === session.current;
    let blocked = false;
    const abort = new AbortController();
    // live frames seen while a REST page loads: newer than that page, so they are applied on top of it
    const liveEvents = [];
    let liveSeq = 0;
    let seq = 0;
    olderInFlight.current = false;

    const block = () => {
      blocked = true;
      setStatus("denied");
      setMessages([]);
      void clientRef.current?.deactivate();
    };

    const loadLatest = async (initial) => {
      const since = liveSeq;
      try {
        const page = await getChatHistory(projectId, { limit: PAGE_SIZE }, abort.signal);
        if (!active() || blocked) return;
        setMessages((prev) =>
          mergeChatMessages(
            mergeChatMessages(prev, page.messages ?? []),
            liveEvents.filter((event) => event.seq > since).map((event) => event.message),
          ),
        );
        if (initial) {
          setHasMore(Boolean(page.hasMore));
          setNextBefore(page.nextBefore ?? null);
        }
        setError("");
      } catch (err) {
        if (!active() || isAbort(err)) return;
        if (lostAccess(err)) block();
        else setError(errorMessage(err, "Couldn't load the chat. Please try again."));
      } finally {
        if (initial && active()) setLoading(false);
      }
    };

    void loadLatest(true);

    const client = new Client({
      brokerURL: getChatWebSocketUrl(),
      reconnectDelay: RECONNECT_DELAY_MS,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      // a token lasts 120 s and is good for one CONNECT: a new one before every (re)connect
      beforeConnect: async () => {
        if (!active() || blocked) throw new Error("Chat closed");
        const { token } = await getChatSocketToken(abort.signal);
        client.connectHeaders = { Authorization: `Bearer ${token}` };
      },
      onConnect: () => {
        if (!active() || blocked) return;
        setStatus("connected");
        client.subscribe(`/topic/projects/${projectId}/chat`, (frame) => {
          if (!active() || blocked) return;
          let event;
          try {
            event = JSON.parse(frame.body);
          } catch {
            return; // a broken frame must not stop the subscription
          }
          if (Number(event.projectId) !== Number(projectId) || !CHAT_EVENTS.includes(event.type) || !event.message) return;
          liveSeq += 1;
          liveEvents.push({ seq: liveSeq, message: event.message });
          if (liveEvents.length > 200) liveEvents.shift();
          setMessages((prev) => applyChatEvent(prev, event));
          if (Number(event.message.authorId) === Number(userRef.current)) {
            setOwn({ type: event.type, messageId: event.message.id, seq: ++seq });
          }
        });
        // a refused send / edit / delete: one frame to this session only, in the REST error shape
        client.subscribe(ERRORS_QUEUE, (frame) => {
          if (!active()) return;
          let body = {};
          try {
            body = JSON.parse(frame.body);
          } catch {
            // no details: the generic text below
          }
          setFailure({
            action: chatErrorAction(body.path),
            code: body.code ?? null,
            message: body.message || "The chat refused this. Please try again.",
            seq: ++seq,
          });
        });
        // the broker has no replay: what happened while disconnected comes from REST
        void loadLatest(false);
      },
      // a refused CONNECT or SUBSCRIBE closes the connection, and the client reconnects with a new token.
      // Whether access is gone is asked over REST, by status, never read from the frame's text.
      onStompError: () => {
        if (!active() || blocked) return;
        setStatus("reconnecting");
        void loadLatest(false);
      },
      onWebSocketClose: () => {
        if (active() && !blocked) setStatus("reconnecting");
      },
      debug: () => {}, // never log CONNECT headers (the token)
    });
    clientRef.current = client;
    client.activate();

    return () => {
      session.current += 1;
      abort.abort();
      if (clientRef.current === client) clientRef.current = null;
      void client.deactivate();
    };
  }, [projectId, retryCount]);

  const loadOlder = useCallback(async () => {
    if (olderInFlight.current || !hasMore || !nextBefore || loading) return;
    olderInFlight.current = true;
    const current = session.current;
    setLoadingOlder(true);
    try {
      const page = await getChatHistory(projectId, { limit: PAGE_SIZE, before: nextBefore });
      if (current !== session.current) return;
      setMessages((prev) => mergeChatMessages(page.messages ?? [], prev));
      setNextBefore(page.nextBefore ?? null);
      setHasMore(Boolean(page.hasMore));
      setError("");
    } catch (err) {
      if (current === session.current) setError(errorMessage(err, "Couldn't load older messages. Please try again."));
    } finally {
      if (current === session.current) {
        olderInFlight.current = false;
        setLoadingOlder(false);
      }
    }
  }, [hasMore, loading, nextBefore, projectId]);

  const publish = useCallback(
    (action, body) => {
      const client = clientRef.current;
      if (!client?.connected) throw new Error("The chat is offline. Wait until it reconnects, then try again.");
      client.publish({ destination: `/app/projects/${projectId}/chat.${action}`, body: JSON.stringify(body) });
    },
    [projectId],
  );

  // start over: a new connection and the newest page
  const retry = () => {
    setMessages([]);
    setLoading(true);
    setLoadingOlder(false);
    setNextBefore(null);
    setHasMore(false);
    setStatus("connecting");
    setError("");
    setRetryCount((count) => count + 1);
  };

  return {
    messages,
    loading,
    loadingOlder,
    hasMore,
    status,
    error,
    failure,
    own,
    loadOlder,
    retry,
    sendMessage: (content) => publish("send", { content }),
    editMessage: (messageId, content) => publish("edit", { messageId, content }),
    deleteMessage: (messageId) => publish("delete", { messageId }),
  };
};
