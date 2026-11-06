import api from "./client";

export const getComments = async (projectId, taskId, page = 0, size = 20, signal) => {
    const response = await api.get(`/projects/${projectId}/tasks/${taskId}/comments`, {
        params: { page, size },
        signal,
    });
    return response.data;
};

export const createComment = async (projectId, taskId, bodyJsonString) => {
    const response = await api.post(`/projects/${projectId}/tasks/${taskId}/comments`, {
        body: bodyJsonString,
    });
    return response.data;
};

export const updateComment = async (projectId, taskId, commentId, bodyJsonString) => {
    const response = await api.patch(`/projects/${projectId}/tasks/${taskId}/comments/${commentId}`, {
        body: bodyJsonString,
    });
    return response.data;
};

export const deleteComment = async (projectId, taskId, commentId) => {
    await api.delete(`/projects/${projectId}/tasks/${taskId}/comments/${commentId}`);
};