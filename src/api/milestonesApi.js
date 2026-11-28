import api from "./client";

// Project milestones (PMP-150)

export const listMilestones = (projectId, signal) =>
    api.get(`/projects/${projectId}/milestones`, { signal }).then((res) => res.data);

export const createMilestone = (projectId, body) =>
    api.post(`/projects/${projectId}/milestones`, body).then((res) => res.data);

export const getMilestone = (milestoneId, signal) =>
    api.get(`/milestones/${milestoneId}`, { signal }).then((res) => res.data);

export const updateMilestone = (milestoneId, body) =>
    api.put(`/milestones/${milestoneId}`, body).then((res) => res.data);

export const deleteMilestone = (milestoneId) =>
    api.delete(`/milestones/${milestoneId}`);

export const restoreMilestone = (milestoneId) =>
    api.post(`/milestones/${milestoneId}/restore`).then((res) => res.data);

export const linkTasksToMilestone = (milestoneId, taskIds) =>
    api.post(`/milestones/${milestoneId}/tasks`, { taskIds }).then((res) => res.data);

export const setTaskMilestone = (taskId, milestoneId) =>
    api.put(`/tasks/${taskId}/milestone`, { milestoneId }).then((res) => res.data);