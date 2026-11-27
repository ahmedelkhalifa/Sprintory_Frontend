// The Board and Backlog filter bar (Jira's "filter by"). The backend does the filtering:
// GET /projects/{id}/tasks?q=&type=&priority=&statusId=&assigneeId=&label=&blockedOnly= (backend docs/tasks-docs.md
// §3.2, dependencies-docs.md §4), one value per filter, every filter that is set narrows the list. q matches the
// title or the key; blockedOnly (the bar's "Blocked only" toggle) keeps the tasks with an open blocker.

// nothing picked: every task shows
export const EMPTY_TASK_FILTERS = {
  q: "",
  assigneeId: null,
  type: null,
  priority: null,
  statusId: null,
  label: null,
  blockedOnly: false,
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
  // only sent when on: false or missing means "no dependency filter"
  if (filters.blockedOnly) params.blockedOnly = true;
  return params;
};

// how many filters are set (the search counts as one)
export const countTaskFilters = (filters) => Object.keys(taskFilterParams(filters)).length;

export const hasTaskFilters = (filters) => countTaskFilters(filters) > 0;

// how many of these filter groups ({ id }) have a value: the Filter window's count. It reads the window's own groups,
// so the Timeline's filters (milestone, sprint, ...) count as well as the Board's
export const countSetFilters = (filters, groups) =>
  groups.filter(({ id }) => filters[id] !== null && filters[id] !== undefined && filters[id] !== "").length;

// the name of the option picked in a filter group ({ options: [{ value, label }] }), or "" when nothing is picked
// (or the picked value isn't an option any more, e.g. a column that was removed)
export const pickedLabel = (group, value) =>
  value === null || value === undefined ? "" : (group.options.find((option) => option.value === value)?.label ?? "");
