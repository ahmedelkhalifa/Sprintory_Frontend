import api from "./client";

export const getTaskHistory = async (projectId, taskId, page = 0, size = 20, signal) => {
    const response = await api.get(`/projects/${projectId}/tasks/${taskId}/history`, {
        params: { page, size },
        signal,
    });
    return response.data;
};