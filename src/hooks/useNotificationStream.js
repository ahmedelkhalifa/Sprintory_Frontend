import { useEffect, useState } from "react";
import api, { AUTH_EXPIRED_EVENT, refreshSession } from "../api/client";
import { getUnreadCount } from "../api/notificationsApi";

const FIRST_DELAY = 1000;
const MAX_DELAY = 30000;

/**
 * The live bell (notifications-docs.md §4): one Server-Sent Events stream per tab while a user is logged in.
 * Returns { unreadCount, setUnreadCount, latest, connection }:
 * `latest` is the last NotificationResponse pushed, `connection` goes up on every (re)connect, since the stream
 * doesn't replay what it missed (an open list reloads page 0 then).
 */
export const useNotificationStream = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [latest, setLatest] = useState(null);
  const [connection, setConnection] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let source = null;
    let timer = null;
    let delay = FIRST_DELAY;
    let stopped = false;

    const connect = () => {
      if (stopped) return;
      // withCredentials sends the access_token cookie, which is how the stream logs in
      const es = new EventSource(`${api.defaults.baseURL}/notifications/stream`, { withCredentials: true });
      source = es;

      es.onopen = () => setConnection((n) => n + 1);
      es.addEventListener("unread-count", (e) => {
        delay = FIRST_DELAY; // it works again
        setUnreadCount(JSON.parse(e.data).count);
      });
      es.addEventListener("notification", (e) => setLatest(JSON.parse(e.data)));

      // while CONNECTING, EventSource retries by itself (dropped connection, the server's 10-minute close).
      // CLOSED means it gave up, usually a 401 for an expired access token: refresh by hand, as EventSource can't
      es.onerror = async () => {
        if (es.readyState !== EventSource.CLOSED) return;
        es.close();
        try {
          await refreshSession();
        } catch (err) {
          if (stopped) return;
          // the session is over: AuthProvider drops the user and ProtectedRoute sends them to login
          if (err.response?.status === 401) {
            window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
            return;
          }
          // a network or server error: try again later
        }
        if (stopped) return;
        // back off, so a stream that keeps failing doesn't refresh every second
        timer = setTimeout(connect, delay);
        delay = Math.min(delay * 2, MAX_DELAY);
      };
    };

    // the count right away; the stream sends it too once connected
    getUnreadCount(controller.signal)
      .then((data) => setUnreadCount(data.count))
      .catch(() => {
        // aborted or failed: the stream's first event brings the count anyway
      });
    connect();

    return () => {
      stopped = true;
      controller.abort();
      clearTimeout(timer);
      source?.close();
    };
  }, []);

  return { unreadCount, setUnreadCount, latest, connection };
};
