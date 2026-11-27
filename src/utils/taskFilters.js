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

export const NO_MILESTONE_VALUE = "NONE";

const PICKED = ["assigneeId", "type", "priority", "statusId", "label"];

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
  if (filters.blockedOnly) params.blockedOnly = true;
  return params;
};

export const countTaskFilters = (filters) => Object.keys(taskFilterParams(filters)).length;

export const hasTaskFilters = (filters) => countTaskFilters(filters) > 0;

export const countPickedFilters = (filters) => countTaskFilters({ ...filters, q: "", blockedOnly: false });

export const pickedLabel = (group, value) =>
    value === null || value === undefined ? "" : (group.options.find((option) => option.value === value)?.label ?? "");