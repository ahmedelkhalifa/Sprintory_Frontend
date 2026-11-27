import api from "./client";
import { listAllTasks } from "./tasksApi";
import { columnCategory } from "../utils/task";

export const USE_MOCK = false;
const STORAGE_KEY = "sprintory_mock_milestones_v1";

const loadStore = () => {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { seq: 1, items: [], taskLinks: {} };
    } catch {
        return { seq: 1, items: [], taskLinks: {} };
    }
};

const saveStore = (store) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
};

const apiErr = (status, code, message, fieldErrors) => {
    const err = new Error(message);
    err.response = { status, data: { code, message, ...(fieldErrors && { fieldErrors }) } };
    return err;
};

const computeMilestoneStats = (milestone, tasks = [], columns = []) => {
    const linked = tasks.filter((t) => t.parentTaskId == null && !t.deletedAt && Number(t.milestone?.id) === Number(milestone.id));
    const totalTasks = linked.length;
    const doneTasks = linked.filter((t) => {
        if (columns.length > 0) {
            const col = columns.find((c) => c.id === t.statusId);
            return col ? columnCategory(col, columns) === "DONE" : false;
        }
        return t.stage === "DONE" || t.statusCategory === "DONE";
    }).length;

    const totalPoints = linked.reduce((acc, t) => acc + (Number(t.estimate) || 0), 0);
    const donePoints = linked
        .filter((t) => {
            if (columns.length > 0) {
                const col = columns.find((c) => c.id === t.statusId);
                return col ? columnCategory(col, columns) === "DONE" : false;
            }
            return t.stage === "DONE" || t.statusCategory === "DONE";
        })
        .reduce((acc, t) => acc + (Number(t.estimate) || 0), 0);

    const basis = totalPoints > 0 ? "POINTS" : "TASKS";
    const percent =
        totalTasks === 0
            ? null
            : basis === "POINTS"
                ? Math.floor((donePoints * 100) / totalPoints)
                : Math.floor((doneTasks * 100) / totalTasks);

    const today = new Date().toISOString().slice(0, 10);
    let status = "UPCOMING";
    if (totalTasks === 0) status = "EMPTY";
    else if (doneTasks === totalTasks) status = "REACHED";
    else if (milestone.targetDate < today) status = "OVERDUE";

    return {
        ...milestone,
        status,
        progress: { totalTasks, doneTasks, totalPoints, donePoints, basis, percent },
    };
};

// Хелпер для обогащения задач данными о вехе в мок-режиме
export const enrichTasksWithMockMilestones = (tasks) => {
    if (!USE_MOCK) return tasks;
    const store = loadStore();
    const byId = new Map(store.items.filter((m) => !m.deletedAt).map((m) => [m.id, m]));
    const byParent = new Map(tasks.map((t) => [t.id, t]));

    return tasks.map((task) => {
        const targetTaskId = task.parentTaskId ?? task.id;
        const mId = store.taskLinks[targetTaskId];
        const m = mId ? byId.get(mId) : null;
        if (!m && task.parentTaskId && byParent.get(task.parentTaskId)?.milestone) {
            return { ...task, milestone: byParent.get(task.parentTaskId).milestone };
        }
        return {
            ...task,
            milestone: m ? { id: m.id, name: m.name, targetDate: m.targetDate } : task.milestone ?? null,
        };
    });
};

export const listMilestones = async (projectId, signal, { columns = [] } = {}) => {
    if (!USE_MOCK) {
        return api.get(`/projects/${projectId}/milestones`, { signal }).then((res) => res.data);
    }
    const store = loadStore();
    const [rawTasks, resolvedColumns] = await Promise.all([
        listAllTasks(projectId, { order: "board" }, signal).catch(() => []),
        columns.length
            ? Promise.resolve(columns)
            : api
                .get(`/projects/${projectId}/board`, { signal })
                .then((res) => res.data?.columns ?? [])
                .catch(() => []),
    ]);

    const effectiveColumns = resolvedColumns.length
        ? resolvedColumns
        : rawTasks
            .filter((t) => t.column?.isDone || t.column?.category === "DONE" || /^done$/i.test(t.column?.name ?? ""))
            .map((t) => ({ id: t.columnId ?? t.column?.id, isDone: true, category: "DONE", name: "Done" }));

    const tasks = enrichTasksWithMockMilestones(rawTasks);
    const milestones = store.items
        .filter((m) => Number(m.projectId) === Number(projectId) && !m.deletedAt)
        .map((m) => computeMilestoneStats(m, tasks, effectiveColumns))
        .sort((a, b) => a.targetDate.localeCompare(b.targetDate));

    return { milestones, limit: 50, canManage: true };
};

export const createMilestone = async (projectId, body) => {
    if (!USE_MOCK) {
        return api.post(`/projects/${projectId}/milestones`, body).then((res) => res.data);
    }
    const store = loadStore();
    const name = (body.name ?? "").trim();
    const description = (body.description ?? "").trim() || null;
    if (!name) throw apiErr(400, "VALIDATION_ERROR", "Invalid milestone.", { name: "Name is required." });
    if (!body.targetDate) throw apiErr(400, "VALIDATION_ERROR", "Invalid milestone.", { targetDate: "Target date is required." });

    const live = store.items.filter((m) => Number(m.projectId) === Number(projectId) && !m.deletedAt);
    if (live.length >= 50) throw apiErr(409, "MILESTONE_LIMIT_REACHED", "A project can have at most 50 milestones.");
    if (live.some((m) => m.name.toLowerCase() === name.toLowerCase())) {
        throw apiErr(409, "MILESTONE_NAME_TAKEN", "A milestone with this name already exists in this project.");
    }

    const item = {
        id: store.seq++,
        projectId: Number(projectId),
        name,
        description,
        targetDate: body.targetDate,
        createdAt: new Date().toISOString(),
        createdBy: { id: 1, name: "Current User" },
        deletedAt: null,
        canManage: true,
        canLink: true,
    };
    store.items.push(item);
    saveStore(store);
    return computeMilestoneStats(item, []);
};

export const getMilestone = async (milestoneId, signal, { columns = [] } = {}) => {
    if (!USE_MOCK) {
        return api.get(`/milestones/${milestoneId}`, { signal }).then((res) => res.data);
    }
    const store = loadStore();
    const item = store.items.find((m) => Number(m.id) === Number(milestoneId) && !m.deletedAt);
    if (!item) throw apiErr(404, "RESOURCE_NOT_FOUND", "Milestone not found.");
    const rawTasks = await listAllTasks(item.projectId, { order: "board" }, signal).catch(() => []);
    const tasks = enrichTasksWithMockMilestones(rawTasks);
    return computeMilestoneStats(item, tasks, columns);
};

export const updateMilestone = async (milestoneId, body) => {
    if (!USE_MOCK) {
        return api.put(`/milestones/${milestoneId}`, body).then((res) => res.data);
    }
    const store = loadStore();
    const item = store.items.find((m) => Number(m.id) === Number(milestoneId) && !m.deletedAt);
    if (!item) throw apiErr(404, "RESOURCE_NOT_FOUND", "Milestone not found.");

    const name = (body.name ?? "").trim();
    const description = (body.description ?? "").trim() || null;
    if (!name) throw apiErr(400, "VALIDATION_ERROR", "Invalid milestone.", { name: "Name is required." });
    if (!body.targetDate) throw apiErr(400, "VALIDATION_ERROR", "Invalid milestone.", { targetDate: "Target date is required." });

    const duplicate = store.items.some(
        (m) => Number(m.projectId) === Number(item.projectId) && !m.deletedAt && m.id !== item.id && m.name.toLowerCase() === name.toLowerCase(),
    );
    if (duplicate) throw apiErr(409, "MILESTONE_NAME_TAKEN", "A milestone with this name already exists in this project.");

    item.name = name;
    item.targetDate = body.targetDate;
    item.description = description;
    saveStore(store);
    return getMilestone(milestoneId);
};

export const deleteMilestone = async (milestoneId) => {
    if (!USE_MOCK) {
        return api.delete(`/milestones/${milestoneId}`);
    }
    const store = loadStore();
    const item = store.items.find((m) => Number(m.id) === Number(milestoneId) && !m.deletedAt);
    if (!item) throw apiErr(404, "RESOURCE_NOT_FOUND", "Milestone not found.");
    item.deletedAt = new Date().toISOString();
    // Отвязываем все задачи
    Object.keys(store.taskLinks).forEach((tId) => {
        if (Number(store.taskLinks[tId]) === Number(milestoneId)) delete store.taskLinks[tId];
    });
    saveStore(store);
};

export const restoreMilestone = async (milestoneId) => {
    if (!USE_MOCK) {
        return api.post(`/milestones/${milestoneId}/restore`).then((res) => res.data);
    }
    const store = loadStore();
    const item = store.items.find((m) => Number(m.id) === Number(milestoneId) && Boolean(m.deletedAt));
    if (!item) throw apiErr(404, "RESOURCE_NOT_FOUND", "Milestone not found.");

    const live = store.items.filter((m) => Number(m.projectId) === Number(item.projectId) && !m.deletedAt);
    if (live.length >= 50) throw apiErr(409, "MILESTONE_LIMIT_REACHED", "A project can have at most 50 milestones.");
    if (live.some((m) => m.name.toLowerCase() === item.name.toLowerCase())) {
        throw apiErr(409, "MILESTONE_NAME_TAKEN", "A milestone with this name already exists in this project.");
    }

    item.deletedAt = null;
    saveStore(store);
    return computeMilestoneStats(item, []);
};

export const linkTasksToMilestone = async (milestoneId, taskIds) => {
    if (!USE_MOCK) {
        return api.post(`/milestones/${milestoneId}/tasks`, { taskIds }).then((res) => res.data);
    }
    const store = loadStore();
    const item = store.items.find((m) => Number(m.id) === Number(milestoneId) && !m.deletedAt);
    if (!item) throw apiErr(404, "RESOURCE_NOT_FOUND", "Milestone not found.");
    taskIds.forEach((id) => {
        store.taskLinks[id] = Number(milestoneId);
    });
    saveStore(store);
    return getMilestone(milestoneId);
};

export const setTaskMilestone = async (taskId, milestoneId) => {
    if (!USE_MOCK) {
        return api.patch(`/tasks/${taskId}/milestone`, { milestoneId }).then((res) => res.data);
    }

    const store = loadStore();
    if (milestoneId == null) {
        delete store.taskLinks[String(taskId)];
        saveStore(store);
        return { taskId, milestone: null };
    }

    const found = store.items.find((m) => Number(m.id) === Number(milestoneId) && !m.deletedAt);
    if (!found) {
        throw apiErr(404, "MILESTONE_NOT_FOUND", "Milestone not found.");
    }

    store.taskLinks[String(taskId)] = Number(milestoneId);
    saveStore(store);

    return {
        taskId,
        milestone: { id: found.id, name: found.name, targetDate: found.targetDate },
    };
};
