import api from "./client";

// One search across workspaces, projects, teams and tasks (backend docs/search-docs.md), best match first.
// params: { q (required, 1–255 chars), types (["TASK", ...], default all), workspaceId, projectId, page, size }
// Only what the caller can see comes back; an unknown or hidden scope is just an empty page.
export const search = ({ types, ...params }, signal) =>
  api
    .get("/search", { params: { ...params, ...(types?.length && { types: types.join(",") }) }, signal })
    .then((res) => res.data);
