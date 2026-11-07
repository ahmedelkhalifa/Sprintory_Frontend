import api from "./client";

export const getMentionables = async (projectId, query, signal) => {
    const response = await api.get(`/projects/${projectId}/mentionables`, {
        params: { q: query },
        signal,
    });
    return response.data;
};