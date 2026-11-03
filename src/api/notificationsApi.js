import api from "./client";

const notificationsApi = {
    getUnreadCount: async (signal) => {
        const res = await api.get("/notifications/unread-count", { signal });
        return res.data;
    },

    getNotifications: async ({ unreadOnly = false, workspaceId, page = 0, size = 20 } = {}, signal) => {
        const params = { page, size };
        if (unreadOnly) params.unreadOnly = true;
        if (workspaceId) params.workspaceId = workspaceId;

        const res = await api.get("/notifications", { params, signal });
        return res.data;
    },

    openNotification: async (id) => {
        const res = await api.post(`/notifications/${id}/open`);
        return res.data;
    },

    markAllAsRead: async () => {
        const res = await api.post("/notifications/read-all");
        return res.data;
    },

    getPreferences: async (signal) => {
        const res = await api.get("/notification-preferences", { signal });
        return res.data;
    },

    updatePreferences: async (preferences) => {
        const res = await api.put("/notification-preferences", { preferences });
        return res.data;
    },

    getWatchStatus: async (projectId, taskId, signal) => {
        const res = await api.get(`/projects/${projectId}/tasks/${taskId}/watch`, { signal });
        return res.data;
    },

    setWatchStatus: async (projectId, taskId, watch) => {
        const method = watch ? "put" : "delete";
        const res = await api[method](`/projects/${projectId}/tasks/${taskId}/watch`);
        return res.data;
    }
};

export default notificationsApi;