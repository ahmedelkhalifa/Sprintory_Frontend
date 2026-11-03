import { useState, useEffect, useRef } from "react";
import api from "../api/client";
import notificationsApi from "../api/notificationsApi";

// Берем базовый URL бэкенда из окружения
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api/v1";

export const useNotificationStream = () => {
    const [unreadCount, setUnreadCount] = useState(0);
    const [latestNotification, setLatestNotification] = useState(null);
    const eventSourceRef = useRef(null);

    useEffect(() => {
        let reconnectTimer;
        let isMounted = true;

        const connect = () => {
            // ИСПРАВЛЕНО: передаем полный URL к бэкенду
            const streamUrl = `${API_URL}/notifications/stream`;
            const es = new EventSource(streamUrl, { withCredentials: true });
            eventSourceRef.current = es;

            es.addEventListener("unread-count", (e) => {
                if (!isMounted) return;
                const data = JSON.parse(e.data);
                setUnreadCount(data.count);
            });

            es.addEventListener("notification", (e) => {
                if (!isMounted) return;
                const notification = JSON.parse(e.data);
                setLatestNotification(notification);
            });

            es.onerror = async () => {
                if (es.readyState === EventSource.CLOSED) {
                    try {
                        await api.post("/auth/refresh");
                        if (isMounted) {
                            reconnectTimer = setTimeout(connect, 1000);
                        }
                    } catch (err) {
                        console.error("SSE auth refresh failed", err);
                    }
                }
            };
        };

        const controller = new AbortController();
        notificationsApi.getUnreadCount(controller.signal)
            .then(data => {
                if (isMounted) setUnreadCount(data.count);
            })
            .catch(() => {});

        connect();

        return () => {
            isMounted = false;
            controller.abort();
            clearTimeout(reconnectTimer);
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }
        };
    }, []);

    return { unreadCount, latestNotification };
};