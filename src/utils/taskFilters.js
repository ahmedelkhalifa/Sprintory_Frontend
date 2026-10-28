// The Board and Backlog filter bar (Jira's "filter by"). The backend does the filtering:
// GET /projects/{id}/tasks?q=&type=&priority=&statusId=&assigneeId=&label= (backend docs/tasks-docs.md §3.2),
// one value per filter, every filter that is set narrows the list. q matches the title or the key.

// nothing picked: every task shows
export const EMPTY_TASK_FILTERS = {
  q: "",
  assigneeId: null,
  type: null,
  priority: null,
  statusId: null,
  label: null,
};

const PICKED = ["assigneeId", "type", "priority", "statusId", "label"];

// the query params for the backend: trimmed search, and only the filters that are set
export const taskFilterParams = (filters) => {
  const params = {};
  const q = (filters.q ?? "").trim();
  if (q) params.q = q;
  PICKED.forEach((name) => {
    if (filters[name] !== null && filters[name] !== undefined && filters[name] !== "") params[name] = filters[name];
  });
  return params;
};

// how many filters are set (the search counts as one)
export const countTaskFilters = (filters) => Object.keys(taskFilterParams(filters)).length;

export const hasTaskFilters = (filters) => countTaskFilters(filters) > 0;
