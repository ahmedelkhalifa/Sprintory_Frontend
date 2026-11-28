// The Board and Backlog filter bar (Jira's "filter by"). The backend does the filtering:
// GET /projects/{id}/tasks?q=&type=&priority=&statusId=&assigneeId=&label=&blockedOnly= (backend docs/tasks-docs.md
// §3.2, dependencies-docs.md §4), one value per filter, every filter that is set narrows the list. q matches the
// title or the key; blockedOnly (the bar's "Blocked only" toggle) keeps the tasks with an open blocker.

export const NO_MILESTONE_VALUE = "NONE";

// nothing picked: every task shows
export const EMPTY_TASK_FILTERS = {
  q: "",
  assigneeId: null,
  type: null,
  priority: null,
  statusId: null,
  label: null,
  milestoneId: null,
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
  if (filters.milestoneId === NO_MILESTONE_VALUE) {
    params.noMilestone = true;
  } else if (filters.milestoneId !== null && filters.milestoneId !== undefined && filters.milestoneId !== "") {
    params.milestoneId = filters.milestoneId;
  }
  // only sent when on: false or missing means "no dependency filter"
  if (filters.blockedOnly) params.blockedOnly = true;
  return params;
};

// how many filters are set (the search counts as one)
export const countTaskFilters = (filters) => Object.keys(taskFilterParams(filters)).length;

export const hasTaskFilters = (filters) => countTaskFilters(filters) > 0;

// how many filters are picked in the Filter window (everything but the search box and the Blocked only toggle,
// which sit on the bar), for its button
export const countPickedFilters = (filters) => countTaskFilters({ ...filters, q: "", blockedOnly: false });

// the name of the option picked in a filter group ({ options: [{ value, label }] }), or "" when nothing is picked
// (or the picked value isn't an option any more, e.g. a column that was removed)
export const pickedLabel = (group, value) =>
    value === null || value === undefined ? "" : (group.options.find((option) => option.value === value)?.label ?? "");
