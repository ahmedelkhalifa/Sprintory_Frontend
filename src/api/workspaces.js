import api from "./client";

export const getWorkspace = (id) =>
    api.get(`/workspaces/${id}`).then((r) => r.data);