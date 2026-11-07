import api from "./client";

// @ suggestions for a project's editors (backend mentions-docs.md §3): { users: [{ id, name, email }],
// teams: [{ id, name, membersInProject }] }. People are this project's members except the caller (at most 10),
// teams those with someone in the project (at most 5). Not paginated; `q` narrows it.
export const getMentionables = async (projectId, q, signal) => {
  const res = await api.get(`/projects/${projectId}/mentionables`, { params: { q }, signal });
  return res.data;
};
